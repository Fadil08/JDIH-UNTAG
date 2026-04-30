module {
  public type DokumenId = Nat;
  public type KategoriId = Nat;
  public type ArtikelId = Nat;
  public type Timestamp = Int;

  public type StatusDokumen = {
    #Berlaku;
    #TidakBerlaku;
    #Dicabut;
  };

  public type Counter = { var value : Nat };
};
