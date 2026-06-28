/* ================================================================
   PK 2.9 Rule-Based Classification Engine
   Classifies procurement type and determines the correct method
   ================================================================ */

export type JenisPerolehan = "bekalan" | "perkhidmatan" | "kerja";
export type KaedahPerolehan = "pembelian_terus" | "sebut_harga_bumi" | "sebut_harga" | "tender";

const KERJA_KEYWORDS = [
  "bina", "pembinaan", "ubahsuai", "renovation", "renovasi",
  "pembaikan", "repair", "baiki", "bumbung", "struktur",
  "paip", "plumbing", "pendawaian", "pendawaian elektrik",
  "elektrik", "wiring", "cat ", " cat", "painting",
  "jalan", "jambatan", "bridge", "tanah", "earthwork",
  "longkang", "drain", "konkrit", "concrete", "pengorekan",
  "pemasangan jubin", "jubin", "tile", "kerja-kerja",
  "kerja pembinaan", "kerja naik", "kerja pembaikan",
  "kerja elektrik", "kerja paip", "kerja ubahsuai",
  "kontrak kerja", "kontraktor", "cidb", "g1", "g2",
  "tapak bina", "site", "binaan", "demolisi", "demolition",
  "waterproofing", "kalis air", "pemasangan", "install",
  "membaiki", "menaik taraf", "upgrade bangunan",
];

const PERKHIDMATAN_KEYWORDS = [
  "perkhidmatan", "service", "servis",
  "konsultansi", "consultancy", "consultant", "perundingan",
  "latihan", "training", "kursus", "course",
  "audit", "pengauditan",
  "pembersihan", "cleaning", "cleaner",
  "keselamatan", "security guard", "pengawal keselamatan",
  "penyelenggaraan", "maintenance", "selenggara",
  "mengangkut", "transport", "pengangkutan", "logistics",
  "catering", "katering", "makanan",
  "it support", "sokongan it", "teknologi maklumat",
  "percetakan", "printing", "mencetak",
  "insurans", "insurance",
  "pemprosesan data", "data entry",
  "fotografi", "photography", "videografi",
  "kawalan perosak", "pest control",
  "dobi", "laundry",
  "pengurusan acara", "event management",
  "perunding", "advisor",
  "khidmat", "jasa",
];

export function classifyJenis(situasi: string): { jenis: JenisPerolehan; reason: string } {
  const lower = situasi.toLowerCase();

  const kerjaScore = KERJA_KEYWORDS.filter((k) => lower.includes(k)).length;
  const perkhidmatanScore = PERKHIDMATAN_KEYWORDS.filter((k) => lower.includes(k)).length;

  if (kerjaScore > 0 && kerjaScore >= perkhidmatanScore) {
    const matched = KERJA_KEYWORDS.filter((k) => lower.includes(k)).slice(0, 3);
    return {
      jenis: "kerja",
      reason: `Situasi mengandungi elemen kerja fizikal/pembinaan (${matched.join(", ")}), yang menunjukkan ini adalah perolehan Kerja di bawah PK 2.9.`,
    };
  }

  if (perkhidmatanScore > 0) {
    const matched = PERKHIDMATAN_KEYWORDS.filter((k) => lower.includes(k)).slice(0, 3);
    return {
      jenis: "perkhidmatan",
      reason: `Situasi menggambarkan pembekalan perkhidmatan (${matched.join(", ")}), yang menunjukkan ini adalah perolehan Perkhidmatan.`,
    };
  }

  return {
    jenis: "bekalan",
    reason: `Situasi menggambarkan pembelian barang/barangan/bekalan fizikal yang akan digunakan oleh agensi, yang menunjukkan ini adalah perolehan Bekalan.`,
  };
}

export function determineKaedah(jenis: JenisPerolehan, hargaSiling: number): {
  kaedah: KaedahPerolehan;
  kaedahLabel: string;
} {
  if (jenis === "bekalan" || jenis === "perkhidmatan") {
    if (hargaSiling <= 50000) return { kaedah: "pembelian_terus", kaedahLabel: "Pembelian Terus" };
    if (hargaSiling <= 100000) return { kaedah: "sebut_harga_bumi", kaedahLabel: "Sebut Harga (Bumiputera)" };
    if (hargaSiling <= 500000) return { kaedah: "sebut_harga", kaedahLabel: "Sebut Harga" };
    return { kaedah: "tender", kaedahLabel: "Tender" };
  } else {
    if (hargaSiling <= 50000) return { kaedah: "pembelian_terus", kaedahLabel: "Pembelian Terus" };
    if (hargaSiling <= 500000) return { kaedah: "sebut_harga", kaedahLabel: "Sebut Harga" };
    return { kaedah: "tender", kaedahLabel: "Tender" };
  }
}
