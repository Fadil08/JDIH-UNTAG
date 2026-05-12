const db = require('../db');

async function migrate() {
  const conn = await db.getConnection();
  try {
    console.log('Starting normalization migration for "Tentang" features...');
    await conn.beginTransaction();

    // 1. Create the new normalized content table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS tentang_konten (
        id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        page_id       INT UNSIGNED NOT NULL,
        tipe          ENUM('paragraf', 'list_item', 'struktur_item') NOT NULL,
        isi           TEXT NOT NULL,
        nama          VARCHAR(255) NULL,
        jabatan       VARCHAR(255) NULL,
        unit          VARCHAR(255) NULL,
        urutan        INT NOT NULL DEFAULT 0,
        FOREIGN KEY (page_id) REFERENCES tentang_pages(id) ON DELETE CASCADE,
        INDEX idx_page (page_id),
        INDEX idx_urutan (urutan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 2. Fetch existing pages to migrate data from JSON to rows
    const [columns] = await conn.query('SHOW COLUMNS FROM tentang_pages LIKE "konten"');
    if (columns.length > 0) {
      const [pages] = await conn.query('SELECT * FROM tentang_pages');
      console.log(`Migrating ${pages.length} pages...`);

      for (const page of pages) {
        let content;
        try {
          content = typeof page.konten === 'string' ? JSON.parse(page.konten) : page.konten;
        } catch (e) {
          console.warn(`Failed to parse content for page ${page.slug}, skipping data migration for this page.`);
          continue;
        }

        if (content && content.blocks) {
          let order = 0;
          for (const block of content.blocks) {
            if (block.__kind__ === 'paragraf') {
              await conn.query(
                'INSERT INTO tentang_konten (page_id, tipe, isi, urutan) VALUES (?, ?, ?, ?)',
                [page.id, 'paragraf', block.paragraf, order++]
              );
            } else if (block.__kind__ === 'daftarItem') {
              for (const item of block.daftarItem) {
                // Check if it's a structure item (Jabatan: ... | Nama: ... | Unit: ...)
                if (item.includes('Jabatan:') && item.includes('Nama:')) {
                  const parts = {};
                  for (const seg of item.split(' | ')) {
                    const [k, ...rest] = seg.split(':');
                    if (k && rest.length) parts[k.trim()] = rest.join(':').trim();
                  }
                  await conn.query(
                    'INSERT INTO tentang_konten (page_id, tipe, isi, nama, jabatan, unit, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [page.id, 'struktur_item', item, parts.Nama || '', parts.Jabatan || '', parts.Unit || '', order++]
                  );
                } else {
                  await conn.query(
                    'INSERT INTO tentang_konten (page_id, tipe, isi, urutan) VALUES (?, ?, ?, ?)',
                    [page.id, 'list_item', item, order++]
                  );
                }
              }
            }
          }
        }
      }

      // 3. Cleanup: Remove the old JSON column
      console.log('Dropping old "konten" column and removing ENUM constraint on slug...');
      await conn.query('ALTER TABLE tentang_pages DROP COLUMN konten');
    } else {
      console.log('Column "konten" already removed or never existed.');
    }

    // 4. Update slug to VARCHAR if it was an ENUM
    await conn.query('ALTER TABLE tentang_pages MODIFY COLUMN slug VARCHAR(100) NOT NULL');

    await conn.commit();
    console.log('✅ Normalization migration for "Tentang" completed successfully!');
  } catch (err) {
    await conn.rollback();
    console.error('❌ Migration failed:', err);
  } finally {
    conn.release();
    process.exit();
  }
}

migrate();
