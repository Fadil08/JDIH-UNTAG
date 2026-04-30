const db = require('./src/api/src/db');
async function run() {
  try {
    await db.query("ALTER TABLE status_dokumen ADD COLUMN warna VARCHAR(50) DEFAULT '#64748b'");
    
    // Set some default colors for known statuses
    const colors = {
      'Berlaku': '#16a34a',
      'Tidak Berlaku': '#dc2626',
      'Dicabut': '#ef4444',
      'Diubah': '#f59e0b',
      'Mencabut': '#0284c7',
      'Mengubah': '#0ea5e9',
      'Menjabarkan': '#8b5cf6'
    };

    for (const [nama, warna] of Object.entries(colors)) {
      await db.query("UPDATE status_dokumen SET warna = ? WHERE nama = ?", [warna, nama]);
    }
    console.log('Column warna added to status_dokumen and defaults updated');
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME') {
      console.log('Column already exists');
    } else {
      console.error(err);
    }
  }
  process.exit();
}
run();
