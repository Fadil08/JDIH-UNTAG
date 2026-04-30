import List "mo:core/List";
import Map "mo:core/Map";
import MixinObjectStorage "mo:caffeineai-object-storage/Mixin";
import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Common "types/common";
import DokumenTypes "types/dokumen";
import BeritaTypes "types/berita";
import TentangTypes "types/tentang";
import GaleriTypes "types/galeri";
import UM "types/user-management";
import DokumenLib "lib/dokumen";
import BeritaLib "lib/berita";
import TentangLib "lib/tentang";
import GaleriLib "lib/galeri";
import DokumenApi "mixins/dokumen-api";
import BeritaApi "mixins/berita-api";
import UserManagementApi "mixins/user-management-api";
import DokumenWorkflowApi "mixins/dokumen-workflow-api";
import TentangApi "mixins/tentang-api";
import GaleriApi "mixins/galeri-api";





actor {
  // ── Object storage (handles file upload/download) ─────────────────────────
  include MixinObjectStorage();

  // ── Authorization ─────────────────────────────────────────────────────────
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // ── Domain state ──────────────────────────────────────────────────────────
  let dokumenList = List.empty<DokumenTypes.DokumenInternal>();
  let kategoriMap = Map.empty<Common.KategoriId, DokumenTypes.Kategori>();
  let artikelList = List.empty<BeritaTypes.Artikel>();
  let tentangPages = Map.empty<Text, TentangTypes.TentangPage>();
  let galeriItems = List.empty<GaleriTypes.GaleriItem>();

  let nextDokumenId : Common.Counter = { var value = 1 };
  let nextKategoriId : Common.Counter = { var value = 1 };
  let nextArtikelId : Common.Counter = { var value = 1 };
  let nextGaleriItemId : Common.Counter = { var value = 1 };

  // ── User management state ─────────────────────────────────────────────────
  let adminUsers = Map.empty<Text, UM.AdminUser>();
  let activityLog = List.empty<UM.ActivityLog>();
  let nextLogId : Common.Counter = { var value = 1 };

  // ── Sample data bootstrap ─────────────────────────────────────────────────
  nextKategoriId.value := DokumenLib.initSampleKategori(kategoriMap, nextKategoriId.value);
  nextDokumenId.value := DokumenLib.initSampleDokumen(dokumenList, nextDokumenId.value);
  nextArtikelId.value := BeritaLib.initSampleArtikel(artikelList, nextArtikelId.value);
  TentangLib.initSampleTentang(tentangPages);
  nextGaleriItemId.value := GaleriLib.initSampleGaleri(galeriItems, nextGaleriItemId.value);

  // ── Mixin composition ─────────────────────────────────────────────────────
  include DokumenApi(accessControlState, dokumenList, kategoriMap, artikelList, nextDokumenId, nextKategoriId);
  include BeritaApi(accessControlState, artikelList, nextArtikelId);
  include UserManagementApi(accessControlState, adminUsers, activityLog, nextLogId);
  include DokumenWorkflowApi(accessControlState, dokumenList, activityLog, nextLogId);
  include TentangApi(accessControlState, adminUsers, tentangPages, activityLog, nextLogId);
  include GaleriApi(accessControlState, adminUsers, galeriItems, nextGaleriItemId);
};
