import { foldTr } from "../text";

export type BankCatalogEntry = {
  id: string;
  name: string;
  searchNames: string[];
  shortCode: string;
  logoKey: string;
  logoStatus: "verified" | "fallback";
};

/**
 * Uygulama içi kısa gösterim kodları resmi EFT/SWIFT kodu değildir.
 * Kalıcı kimlik logoKey / id'dir.
 */
export const BANK_CATALOG: BankCatalogEntry[] = [
  {
    id: "bank-ziraat",
    name: "T.C. Ziraat Bankası",
    searchNames: ["ziraat", "ziraat bankasi", "tc ziraat", "ziraatbank"],
    shortCode: "ZRT",
    logoKey: "ziraat",
    logoStatus: "verified",
  },
  {
    id: "bank-isbank",
    name: "Türkiye İş Bankası",
    searchNames: ["is bankasi", "isbank", "turkiye is bankasi", "is bank"],
    shortCode: "ISB",
    logoKey: "isbank",
    logoStatus: "verified",
  },
  {
    id: "bank-garanti",
    name: "Garanti BBVA",
    searchNames: ["garanti", "garanti bbva", "garanti bankasi", "bbva"],
    shortCode: "GRN",
    logoKey: "garanti",
    logoStatus: "verified",
  },
  {
    id: "bank-akbank",
    name: "Akbank",
    searchNames: ["akbank", "ak bank"],
    shortCode: "AKB",
    logoKey: "akbank",
    logoStatus: "verified",
  },
  {
    id: "bank-vakifbank",
    name: "VakıfBank",
    searchNames: ["vakifbank", "vakif bank", "vakiflar"],
    shortCode: "VKF",
    logoKey: "vakifbank",
    logoStatus: "verified",
  },
  {
    id: "bank-denizbank",
    name: "DenizBank",
    searchNames: ["denizbank", "deniz bank"],
    shortCode: "DNZ",
    logoKey: "denizbank",
    logoStatus: "verified",
  },
  {
    id: "bank-enpara",
    name: "Enpara",
    searchNames: ["enpara", "enpara com", "qnb enpara"],
    shortCode: "ENP",
    logoKey: "enpara",
    logoStatus: "verified",
  },
  {
    id: "bank-sekerbank",
    name: "Şekerbank",
    searchNames: ["sekerbank", "seker bank"],
    shortCode: "SKR",
    logoKey: "sekerbank",
    logoStatus: "verified",
  },
  {
    id: "bank-ziraatkatilim",
    name: "Ziraat Katılım",
    searchNames: ["ziraat katilim", "ziraat participation"],
    shortCode: "ZKT",
    logoKey: "ziraatkatilim",
    logoStatus: "verified",
  },
  {
    id: "bank-emlakkatilim",
    name: "Emlak Katılım",
    searchNames: ["emlak katilim", "emlak katilim bankasi"],
    shortCode: "EMK",
    logoKey: "emlakkatilim",
    logoStatus: "verified",
  },
  {
    id: "bank-aktifbank",
    name: "Aktif Bank",
    searchNames: ["aktif bank", "aktifbank"],
    shortCode: "AKT",
    logoKey: "aktifbank",
    logoStatus: "verified",
  },
  {
    id: "bank-anadolubank",
    name: "Anadolubank",
    searchNames: ["anadolubank", "anadolu bank"],
    shortCode: "AND",
    logoKey: "anadolubank",
    logoStatus: "verified",
  },
  {
    id: "bank-yapikredi",
    name: "Yapı Kredi",
    searchNames: ["yapi kredi", "yapikredi", "yapi ve kredi"],
    shortCode: "YKR",
    logoKey: "yapikredi",
    logoStatus: "fallback",
  },
  {
    id: "bank-halkbank",
    name: "Halkbank",
    searchNames: ["halkbank", "halk bankasi", "turkiye halk bankasi"],
    shortCode: "HLK",
    logoKey: "halkbank",
    logoStatus: "fallback",
  },
  {
    id: "bank-qnb",
    name: "QNB",
    searchNames: ["qnb", "qnb finansbank", "finansbank", "finans bank"],
    shortCode: "QNB",
    logoKey: "qnb",
    logoStatus: "fallback",
  },
  {
    id: "bank-teb",
    name: "TEB",
    searchNames: ["teb", "turk ekonomi bankasi", "ekonomi bankasi"],
    shortCode: "TEB",
    logoKey: "teb",
    logoStatus: "fallback",
  },
  {
    id: "bank-ing",
    name: "ING",
    searchNames: ["ing", "ing bank", "ing turkiye"],
    shortCode: "ING",
    logoKey: "ing",
    logoStatus: "fallback",
  },
  {
    id: "bank-hsbc",
    name: "HSBC",
    searchNames: ["hsbc", "hsbc bank"],
    shortCode: "HSB",
    logoKey: "hsbc",
    logoStatus: "fallback",
  },
  {
    id: "bank-kuveytturk",
    name: "Kuveyt Türk",
    searchNames: ["kuveyt turk", "kuveytturk"],
    shortCode: "KVT",
    logoKey: "kuveytturk",
    logoStatus: "fallback",
  },
  {
    id: "bank-turkiyefinans",
    name: "Türkiye Finans",
    searchNames: ["turkiye finans", "turkiyefinans"],
    shortCode: "TFN",
    logoKey: "turkiyefinans",
    logoStatus: "fallback",
  },
  {
    id: "bank-albaraka",
    name: "Albaraka Türk",
    searchNames: ["albaraka", "albaraka turk"],
    shortCode: "ALB",
    logoKey: "albaraka",
    logoStatus: "fallback",
  },
  {
    id: "bank-vakifkatilim",
    name: "Vakıf Katılım",
    searchNames: ["vakif katilim", "vakifkatilim"],
    shortCode: "VKT",
    logoKey: "vakifkatilim",
    logoStatus: "fallback",
  },
  {
    id: "bank-fibabanka",
    name: "Fibabanka",
    searchNames: ["fibabanka", "fiba banka", "fiba"],
    shortCode: "FBA",
    logoKey: "fibabanka",
    logoStatus: "fallback",
  },
  {
    id: "bank-odeabank",
    name: "Odeabank",
    searchNames: ["odeabank", "odea bank"],
    shortCode: "ODA",
    logoKey: "odeabank",
    logoStatus: "fallback",
  },
];

export const VERIFIED_LOGO_KEYS = new Set(
  BANK_CATALOG.filter((bank) => bank.logoStatus === "verified").map((bank) => bank.logoKey),
);

export function catalogById(id: string) {
  return BANK_CATALOG.find((bank) => bank.id === id) ?? null;
}

export function inferCatalogBankId(name: string): string | null {
  const folded = foldTr(name);
  if (!folded) return null;
  const ranked = BANK_CATALOG.map((bank) => {
    const hay = [bank.name, ...bank.searchNames].map(foldTr);
    const hit = hay.some((item) => folded.includes(item) || item.includes(folded));
    return { id: bank.id, hit, length: bank.name.length };
  }).filter((row) => row.hit);
  ranked.sort((a, b) => b.length - a.length);
  return ranked[0]?.id ?? null;
}

export function searchCatalog(query: string) {
  const needle = foldTr(query);
  if (!needle) return BANK_CATALOG;
  return BANK_CATALOG.filter((bank) =>
    [bank.name, bank.shortCode, ...bank.searchNames].some((part) => foldTr(part).includes(needle)),
  );
}
