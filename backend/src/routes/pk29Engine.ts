/* ================================================================
   PK 2.9 Rule-Based Guidance Engine
   Classifies procurement situation and generates complete guidance
   ================================================================ */

export type JenisPerolehan = "bekalan" | "perkhidmatan" | "kerja";
export type KaedahPerolehan = "pembelian_terus" | "sebut_harga_bumi" | "sebut_harga" | "tender";

interface PK29Result {
  jenis: JenisPerolehan;
  jenisLabel: string;
  jenisReason: string;
  kaedah: KaedahPerolehan;
  kaedahLabel: string;
  hargaSiling: number;
  hargaFormatted: string;
  situasi: string;
}

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

function getGredKerja(hargaSiling: number): string {
  if (hargaSiling <= 200000) return "Gred G1";
  return "Gred G2";
}

export function generateGuidance(situasi: string, hargaSiling: number): string {
  const hargaFormatted = hargaSiling.toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const { jenis, reason } = classifyJenis(situasi);
  const { kaedah, kaedahLabel } = determineKaedah(jenis, hargaSiling);

  const jenisLabel =
    jenis === "bekalan" ? "Bekalan" : jenis === "perkhidmatan" ? "Perkhidmatan" : "Kerja";

  const result: PK29Result = {
    jenis,
    jenisLabel,
    jenisReason: reason,
    kaedah,
    kaedahLabel,
    hargaSiling,
    hargaFormatted,
    situasi,
  };

  return buildMarkdown(result);
}

function buildMarkdown(r: PK29Result): string {
  const sections: string[] = [];

  // Section 1: Jenis Perolehan
  sections.push(`## Jenis Perolehan Yang Ditentukan\n\n**${r.jenisLabel}**\n\n${r.jenisReason}`);

  // Section 2: Kaedah Perolehan
  sections.push(buildKaedahSection(r));

  // Section 3: Pekeliling
  sections.push(buildPekelilingSection(r));

  // Section 4: Sebab
  sections.push(buildSebabSection(r));

  // Section 5: Syarat
  sections.push(buildSyaratSection(r));

  // Section 6: Dokumen
  sections.push(buildDokumenSection(r));

  return sections.join("\n\n---\n\n");
}

function buildKaedahSection(r: PK29Result): string {
  if (r.kaedah === "pembelian_terus") {
    return `## Kaedah Perolehan\n\n**Pembelian Terus**\n\nBerdasarkan Harga Siling RM ${r.hargaFormatted} yang tidak melebihi RM 50,000, perolehan ${r.jenisLabel} ini boleh dilaksanakan melalui kaedah **Pembelian Terus** tanpa perlu melalui proses Sebut Harga PK 2.9.\n\nAgensi boleh terus membuat pembelian daripada mana-mana pembekal/kontraktor yang berdaftar atau berlesen, tertakluk kepada had nilai yang ditetapkan.`;
  }

  if (r.kaedah === "tender") {
    return `## Kaedah Perolehan\n\n**Tender**\n\nBerdasarkan Harga Siling RM ${r.hargaFormatted} yang melebihi RM 500,000, perolehan ${r.jenisLabel} ini **melampaui skop PK 2.9** dan mesti dilaksanakan melalui kaedah **Tender** mengikut Pekeliling Perbendaharaan yang berkaitan dengan perolehan melalui Tender.`;
  }

  if (r.kaedah === "sebut_harga_bumi") {
    return `## Kaedah Perolehan\n\n**Sebut Harga — Bumiputera (PK 2.9)**\n\nBerdasarkan Harga Siling RM ${r.hargaFormatted} (melebihi RM 50,000 hingga RM 100,000), perolehan ${r.jenisLabel} ini dilaksanakan melalui **Sebut Harga** dengan pelawaan **khusus kepada pembuat/pembekal tempatan bertaraf Bumiputera** yang berdaftar dengan Kementerian Kewangan (KKM) di negeri berkenaan.\n\n- Tempoh notis: sekurang-kurangnya **7 hari berturut-turut**\n- Penilaian: 1 Peringkat atau 2 Peringkat\n- Kelulusan: Jawatankuasa Sebut Harga (JKSH)`;
  }

  // sebut_harga standard
  if (r.jenis === "kerja") {
    const gred = getGredKerja(r.hargaSiling);
    const hadBawah = r.hargaSiling <= 200000 ? "RM 50,000" : "RM 200,000";
    const hadAtas = r.hargaSiling <= 200000 ? "RM 200,000" : "RM 500,000";
    return `## Kaedah Perolehan\n\n**Sebut Harga Kerja — ${gred} (PK 2.9)**\n\nBerdasarkan Harga Siling RM ${r.hargaFormatted} (melebihi ${hadBawah} hingga ${hadAtas}), perolehan Kerja ini dilaksanakan melalui **Sebut Harga** dengan syarat berikut:\n\n- Pelawaan kepada sekurang-kurangnya **5 kontraktor tempatan ${gred}** yang berdaftar dengan CIDB dan mempunyai Sijil Perolehan Kerja Kerajaan (SPKK)\n- Tempoh notis: sekurang-kurangnya **7 hari berturut-turut**\n- Kelulusan: Jawatankuasa Sebut Harga (JKSH)`;
  }

  return `## Kaedah Perolehan\n\n**Sebut Harga (PK 2.9)**\n\nBerdasarkan Harga Siling RM ${r.hargaFormatted} (melebihi RM 100,000 hingga RM 500,000), perolehan ${r.jenisLabel} ini dilaksanakan melalui **Sebut Harga** dengan pelawaan kepada pembuat/pembekal tempatan yang berdaftar dengan Kementerian Kewangan (KKM).\n\n- Tempoh notis: sekurang-kurangnya **7 hari berturut-turut**\n- Penilaian: 1 Peringkat atau 2 Peringkat\n- Kelulusan: Jawatankuasa Sebut Harga (JKSH)`;
}

function buildPekelilingSection(r: PK29Result): string {
  const core = `- **Pekeliling Perbendaharaan PK 2.9** — Kaedah Perolehan Secara Sebut Harga\n- **Pekeliling Perbendaharaan PP/PK 2.1** — Dasar Perolehan Kerajaan\n- **Pekeliling Perbendaharaan PP/PK 1.1** — Tatacara Pengurusan Perolehan Kerajaan`;

  if (r.kaedah === "pembelian_terus") {
    return `## Pekeliling / Arahan Yang Perlu Dirujuk\n\n- **Pekeliling Perbendaharaan PP/PK 2.1** — Dasar Perolehan Kerajaan (Had Nilai Pembelian Terus)\n- **Pekeliling Perbendaharaan PP/PK 1.1** — Tatacara Pengurusan Perolehan Kerajaan\n- Arahan Perbendaharaan (AP) yang berkaitan dengan pembelian terus`;
  }

  if (r.kaedah === "tender") {
    return `## Pekeliling / Arahan Yang Perlu Dirujuk\n\n- **Pekeliling Perbendaharaan PP/PK 2.4** — Perolehan Melalui Tender Terbuka / Tender Terhad\n- **Pekeliling Perbendaharaan PP/PK 2.1** — Dasar Perolehan Kerajaan\n- **Pekeliling Perbendaharaan PP/PK 1.1** — Tatacara Pengurusan Perolehan Kerajaan`;
  }

  const extra =
    r.jenis === "kerja"
      ? `\n- **Pekeliling Kontrak Kerja Awam (JKR/JPS)** — Format dokumen Sebut Harga Kerja\n- **CIDB Act 520** — Pendaftaran Kontraktor`
      : `\n- **Pekeliling Perbendaharaan PP/PK 5.1** — Pengurusan Sistem ePerolehan (eP)`;

  return `## Pekeliling / Arahan Yang Perlu Dirujuk\n\n${core}${extra}`;
}

function buildSebabSection(r: PK29Result): string {
  if (r.kaedah === "pembelian_terus") {
    return `## Sebab Kaedah Ini Dipilih\n\nKaedah **Pembelian Terus** dipilih kerana:\n\n1. Nilai perolehan RM ${r.hargaFormatted} adalah **tidak melebihi had RM 50,000** yang ditetapkan oleh Perbendaharaan Malaysia\n2. Pada nilai ini, kos dan masa untuk menjalankan proses Sebut Harga tidak berbaloi\n3. PK 2.9 (Sebut Harga) hanya terpakai bagi nilai **melebihi RM 50,000 hingga RM 500,000**\n4. Agensi masih perlu mematuhi prinsip nilai terbaik wang awam (value for money) walaupun melalui Pembelian Terus`;
  }

  if (r.kaedah === "tender") {
    return `## Sebab Kaedah Ini Dipilih\n\nKaedah **Tender** dipilih kerana:\n\n1. Nilai perolehan RM ${r.hargaFormatted} **melebihi had maksimum Sebut Harga (RM 500,000)**\n2. PK 2.9 tidak terpakai bagi nilai melebihi RM 500,000\n3. Nilai yang besar memerlukan persaingan lebih luas dan proses penilaian yang lebih teliti\n4. Tender memberikan akses kepada lebih ramai pembekal/kontraktor yang berkelayakan`;
  }

  if (r.kaedah === "sebut_harga_bumi") {
    return `## Sebab Kaedah Ini Dipilih\n\nKaedah **Sebut Harga Bumiputera** dipilih kerana:\n\n1. Nilai RM ${r.hargaFormatted} berada dalam julat **melebihi RM 50,000 hingga RM 100,000** (PK 2.9, Seksyen 3)\n2. Dalam julat ini, kerajaan mewajibkan pelawaan **khusus kepada pembekal/pembuat Bumiputera** berdaftar KKM bagi memperkukuhkan penyertaan usahawan Bumiputera\n3. Kaedah Pembelian Terus tidak boleh digunakan kerana nilai melebihi RM 50,000\n4. Tender tidak diperlukan kerana nilai masih dalam skop PK 2.9`;
  }

  if (r.jenis === "kerja") {
    const gred = getGredKerja(r.hargaSiling);
    return `## Sebab Kaedah Ini Dipilih\n\nKaedah **Sebut Harga Kerja** dipilih kerana:\n\n1. Nilai RM ${r.hargaFormatted} berada dalam skop PK 2.9 (melebihi RM 50,000 hingga RM 500,000)\n2. Perolehan ini melibatkan **Kerja** yang memerlukan kontraktor berdaftar CIDB ${gred}\n3. Sebut Harga memastikan persaingan harga yang adil dalam kalangan kontraktor yang berkelayakan\n4. Proses ini memerlukan sekurang-kurangnya 5 kontraktor ${gred} bagi mendapatkan nilai terbaik wang awam`;
  }

  return `## Sebab Kaedah Ini Dipilih\n\nKaedah **Sebut Harga** dipilih kerana:\n\n1. Nilai RM ${r.hargaFormatted} berada dalam julat **melebihi RM 100,000 hingga RM 500,000** (PK 2.9, Seksyen 3)\n2. Dalam julat ini, proses Sebut Harga diperlukan bagi memastikan persaingan yang adil dan nilai terbaik wang awam\n3. Pembelian Terus tidak boleh digunakan kerana nilai melebihi RM 50,000\n4. Tender tidak diperlukan kerana nilai masih dalam skop PK 2.9 (≤ RM 500,000)`;
}

function buildSyaratSection(r: PK29Result): string {
  if (r.kaedah === "pembelian_terus") {
    return `## Syarat dan Tatacara Pelaksanaan\n\n1. Dapatkan sebut harga harga daripada sekurang-kurangnya **3 pembekal** bagi mendapatkan harga terbaik (amalan terbaik)\n2. Semak bahawa pembekal adalah **sah dan berdaftar** (jika berkenaan)\n3. Pastikan barang/perkhidmatan yang dibeli mematuhi spesifikasi yang ditetapkan\n4. Rekodkan semua pembelian dalam sistem perakaunan agensi\n5. Simpan semua resit/invois untuk tujuan audit\n6. Agensi **dilarang memecah kecil** perolehan bagi mengelakkan had Sebut Harga (PK 2.9, Seksyen 1.1)`;
  }

  if (r.kaedah === "tender") {
    return `## Syarat dan Tatacara Pelaksanaan\n\n1. Rujuk prosedur Tender mengikut Pekeliling Perbendaharaan PP/PK 2.4\n2. Iklan Tender perlu disiarkan di **portal rasmi dan akhbar** (jika Tender Terbuka)\n3. Tempoh notis minimum **21 hari** (Tender Terbuka) atau seperti yang ditetapkan\n4. Jawatankuasa Tender perlu dilantik oleh Pegawai Pengawal\n5. Penilaian teknikal dan kewangan perlu dilakukan secara berasingan\n6. Kelulusan perlu diperoleh daripada Lembaga Perolehan yang berkenaan`;
  }

  const syaratAm = `**Syarat Am PK 2.9:**\n\n1. Agensi **dilarang memecah kecil** perolehan bagi mengelakkan pelawaan Sebut Harga (PK 2.9, Seksyen 1.1)\n2. Notis/pemberitahuan hendaklah dipaparkan di **Portal MyPROCUREMENT** dan papan kenyataan agensi selama **7 hari berturut-turut** (PK 2.9, Seksyen 6.2)\n3. Tempoh sah laku tawaran **tidak melebihi 90 hari** (PK 2.9, Seksyen 8.1)\n4. Sebut harga diklasifikasikan sebagai **SULIT** di bawah Akta Rahsia Rasmi 1972 [Akta 88] (PK 2.9, Seksyen 10.1)\n5. **Harga Indikatif Jabatan** mesti dimasukkan ke dalam peti tawaran sebelum tarikh tutup (PK 2.9, Seksyen 7.1)\n6. Peti tawaran ditutup pada **jam 12.00 tengah hari** pada hari bekerja (PK 2.9, Seksyen 7.1)\n7. Semua ahli Jawatankuasa mesti menandatangani **Integrity Pact** (PK 2.9, Seksyen 2.2)`;

  if (r.jenis === "kerja") {
    const gred = getGredKerja(r.hargaSiling);
    return `## Syarat dan Tatacara Pelaksanaan\n\n${syaratAm}\n\n**Syarat Khusus Kerja:**\n\n8. Pelawaan kepada sekurang-kurangnya **5 kontraktor tempatan ${gred}** yang berdaftar dengan CIDB dan mempunyai SPKK\n9. Sebut harga kerja dilaksanakan secara **manual** (bukan melalui ePerolehan)\n10. Tawaran dikemukakan dalam **1 sampul surat berlakri** yang mengandungi tawaran teknikal dan kewangan (PK 2.9, Seksyen 6.9)\n11. Jawatankuasa Sebut Harga (JKSH) perlu dilantik oleh Pegawai Pengawal\n12. Tempoh penilaian: seboleh-bolehnya dalam tempoh **14 hari** (PK 2.9, Seksyen 9)`;
  }

  const eProcurement =
    r.jenis === "bekalan" || r.jenis === "perkhidmatan"
      ? `\n8. Bekalan & perkhidmatan **mesti dilaksanakan melalui Sistem ePerolehan (eP)** secara dalam talian sepenuhnya (PK 2.9, Seksyen 2.1)\n9. Tawaran teknikal dan kewangan hendaklah dikemukakan dalam **2 sampul surat berlakri berasingan** (PK 2.9, Seksyen 6.9)`
      : "";

  return `## Syarat dan Tatacara Pelaksanaan\n\n${syaratAm}${eProcurement}`;
}

function buildDokumenSection(r: PK29Result): string {
  if (r.kaedah === "pembelian_terus") {
    return `## Dokumen / Lampiran Yang Perlu Disediakan\n\n1. Borang Pesanan Kerajaan (LO) atau Surat Setuju Terima\n2. Sebut harga harga bertulis daripada pembekal (sekurang-kurangnya 3, amalan terbaik)\n3. Spesifikasi teknikal barang/perkhidmatan\n4. Invois/resit daripada pembekal\n5. Laporan penerimaan barang (jika berkenaan)\n6. Dokumen sokongan lain seperti yang diperlukan oleh agensi`;
  }

  if (r.kaedah === "tender") {
    return `## Dokumen / Lampiran Yang Perlu Disediakan\n\nRujuk Pekeliling Perbendaharaan PP/PK 2.4 untuk senarai lengkap dokumen Tender. Secara umum:\n\n1. Dokumen Tender (Borang Tender, Syarat-Syarat Kontrak, Spesifikasi)\n2. Surat Iklan Tender\n3. Laporan Penilaian Teknikal dan Kewangan\n4. Minit Mesyuarat Lembaga Perolehan\n5. Surat Setuju Terima / Kontrak`;
  }

  if (r.jenis === "kerja") {
    return `## Dokumen / Lampiran Yang Perlu Disediakan\n\n**Dokumen Sebut Harga Kerja (PK 2.9, Seksyen 4.2):**\n\n1. Arahan Kepada Penyebut Harga (Lampiran 2 PK 2.9) — format JKR/JPS\n2. Syarat-Syarat Sebut Harga Untuk Kerja (Lampiran 4 PK 2.9)\n3. Borang Sebut Harga Kerja (Lampiran 5 PK 2.9)\n4. Ringkasan Sebut Harga Kuantiti (Lampiran 6 PK 2.9) atau Ringkasan Sebut Harga Pukal (Lampiran 7 PK 2.9)\n5. Spesifikasi teknikal dan keperluan kerja\n6. Pelan Tapak Bina dan Lukisan Teknikal (jika ada)\n7. Pengalaman dan Senarai Kerja Dalam Tangan\n8. Senarai Semakan (Lampiran 8 PK 2.9)\n9. Sijil Akuan Pendaftaran CIDB dan Sijil Perolehan Kerja Kerajaan (SPKK)\n10. Sijil Perakuan Pendaftaran Kontraktor (PPK)\n11. Sijil Taraf Bumiputera (STB) — jika berkaitan\n12. Harga Indikatif Jabatan (dimasukkan ke peti tawaran sebelum tarikh tutup)\n13. Integrity Pact untuk semua ahli Jawatankuasa\n14. Akuan Sumpah di bawah Akta Rahsia Rasmi 1972 [Akta 88]\n15. Format Laporan Perolehan Secara Sebut Harga (Lampiran 9 PK 2.9)`;
  }

  // bekalan / perkhidmatan
  return `## Dokumen / Lampiran Yang Perlu Disediakan\n\n**Dokumen Sebut Harga ${r.jenisLabel} (PK 2.9, Seksyen 4.1):**\n\n1. Borang Q — Borang Sebut Harga (Lampiran 1 PK 2.9)\n2. Arahan Kepada Penyebut Harga (Lampiran 3 PK 2.9)\n3. Syarat-syarat am perolehan\n4. Syarat-syarat khas (jika berkenaan)\n5. Format kontrak (jika perolehan melebihi tempoh atau nilai tertentu)\n6. Spesifikasi teknikal yang lengkap\n7. Pengalaman / Senarai Pesanan ${r.jenisLabel} terdahulu (jika perlu)\n8. Senarai Semakan (Lampiran 8 PK 2.9)\n9. Harga Indikatif Jabatan (dimasukkan ke peti tawaran sebelum tarikh tutup)\n10. Integrity Pact untuk semua ahli Jawatankuasa\n11. Akuan Sumpah di bawah Akta Rahsia Rasmi 1972 [Akta 88]\n12. Format Laporan Perolehan Secara Sebut Harga (Lampiran 9 PK 2.9)`;
}

export function generateDocDraft(situasi: string, hargaSiling: number): string {
  const hargaFormatted = hargaSiling.toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const { jenis } = classifyJenis(situasi);
  const { kaedahLabel } = determineKaedah(jenis, hargaSiling);
  const jenisLabel = jenis === "bekalan" ? "Bekalan" : jenis === "perkhidmatan" ? "Perkhidmatan" : "Kerja";
  const gred = jenis === "kerja" ? ` (${getGredKerja(hargaSiling)})` : "";

  const today = new Date().toLocaleDateString("ms-MY", {
    day: "2-digit", month: "long", year: "numeric",
  });

  return `# DRAF DOKUMEN SEBUT HARGA
## ${kaedahLabel.toUpperCase()} — ${jenisLabel.toUpperCase()}${gred.toUpperCase()}

**Rujukan:** [No. Rujukan Agensi]
**Tarikh:** ${today}
**Nilai Anggaran:** RM ${hargaFormatted}

---

## ARAHAN KEPADA PENYEBUT HARGA

### 1. Tujuan dan Skop Perolehan

Agensi ini menjemput penyebut harga yang berkelayakan untuk mengemukakan tawaran bagi perolehan berikut:

**Perihal Perolehan:** ${situasi}

**Harga Siling:** RM ${hargaFormatted}

### 2. Syarat-Syarat Penyertaan

${jenis === "kerja"
  ? `Penyebut harga mestilah:\n\n- Kontraktor tempatan yang berdaftar dengan **CIDB** bagi kategori dan gred yang berkaitan${gred}\n- Mempunyai **Sijil Perolehan Kerja Kerajaan (SPKK)** yang masih sah laku\n- Mempunyai **Sijil Perakuan Pendaftaran Kontraktor (PPK)** yang masih sah laku\n- Memiliki pengalaman yang relevan dalam kerja yang sama`
  : `Penyebut harga mestilah:\n\n- ${jenis === "perkhidmatan" && (hargaSiling <= 100000) ? "Syarikat tempatan bertaraf **Bumiputera** yang berdaftar dengan **Kementerian Kewangan Malaysia (KKM)**" : "Syarikat yang berdaftar dengan **Kementerian Kewangan Malaysia (KKM)**"} bagi kategori ${jenisLabel} berkaitan\n- Mempunyai kod bidang yang bersesuaian dengan perolehan ini\n- Mempunyai rekod prestasi yang baik`}

### 3. Tatacara Penyerahan Sebut Harga

- Tawaran hendaklah dikemukakan dalam ${jenis === "kerja" ? "**1 sampul surat berlakri**" : "**2 sampul surat berlakri berasingan** (teknikal dan kewangan)"} kepada alamat agensi
- Sampul surat hendaklah dilabelkan: **"RAHSIA — SEBUT HARGA [NO. RUJUKAN]"**
- Tarikh tutup: **[Tarikh dan Masa]** jam 12.00 tengah hari
- Tawaran yang diterima selepas tarikh tutup **tidak akan dipertimbangkan**

### 4. Tempoh Sah Laku Tawaran

Tawaran hendaklah sah laku selama **90 hari** dari tarikh tutup sebut harga.

### 5. Hak Agensi

Agensi berhak untuk:

- Menolak mana-mana atau semua tawaran tanpa memberikan sebarang sebab
- Menerima tawaran yang paling menguntungkan Kerajaan
- Membatalkan proses sebut harga ini pada bila-bila masa

---

## BORANG SEBUT HARGA

**No. Sebut Harga:** ___________________________
**Tarikh:** ___________________________

### Maklumat Syarikat

| Perkara | Maklumat |
|---------|----------|
| Nama Syarikat | |
| No. Pendaftaran | |
| Alamat | |
| No. Telefon | |
| E-mel | |
| No. Pendaftaran KKM${jenis === "kerja" ? " / CIDB" : ""} | |
| Nama Wakil Bertauliah | |

### Harga Yang Ditawarkan

| Perkara | Harga (RM) |
|---------|------------|
| Harga Tawaran (Tidak termasuk GST/SST) | |
| GST/SST (jika berkenaan) | |
| **Harga Tawaran Keseluruhan** | |

### Akuan Penyebut Harga

Saya/Kami dengan ini mengaku bahawa:

1. Semua maklumat yang dikemukakan adalah **benar dan tepat**
2. Saya/Kami **tidak terlibat** dalam sebarang perjanjian persekongkolan harga dengan pihak lain
3. Saya/Kami bersetuju dengan semua syarat-syarat yang ditetapkan
4. Tawaran ini adalah **sah laku selama 90 hari** dari tarikh tutup

**Tandatangan:** ___________________________
**Nama:** ___________________________
**Jawatan:** ___________________________
**Cop Syarikat:** ___________________________

---

## SYARAT-SYARAT AM

1. Sebut harga ini adalah **SULIT** di bawah Akta Rahsia Rasmi 1972 [Akta 88]
2. Sebarang percubaan melobi atau mempengaruhi keputusan akan **menyebabkan tawaran dibatalkan**
3. Penyebut harga dikehendaki mematuhi semua undang-undang dan peraturan Malaysia yang berkaitan
4. Agensi berhak meminta maklumat tambahan yang difikirkan perlu
5. Kegagalan mematuhi syarat-syarat ini boleh menyebabkan tawaran ditolak
6. Semua perbelanjaan yang ditanggung oleh penyebut harga dalam menyediakan tawaran adalah tanggungan penyebut harga sendiri

---

## SENARAI SEMAK DOKUMEN (LAMPIRAN 8 PK 2.9)

Penyebut harga dikehendaki mengemukakan dokumen-dokumen berikut bersama tawaran:

${jenis === "kerja"
  ? `- [ ] Borang Sebut Harga Kerja yang telah dilengkapkan (Lampiran 5 PK 2.9)\n- [ ] Ringkasan Sebut Harga Kuantiti / Pukal (Lampiran 6/7 PK 2.9)\n- [ ] Salinan Sijil Pendaftaran CIDB (terkini dan sah)\n- [ ] Salinan Sijil Perolehan Kerja Kerajaan (SPKK) — sah laku\n- [ ] Salinan Sijil Perakuan Pendaftaran Kontraktor (PPK)\n- [ ] Salinan Sijil Taraf Bumiputera (STB) — jika berkenaan\n- [ ] Senarai Pengalaman Kerja dalam tempoh 5 tahun terakhir\n- [ ] Senarai Kerja Dalam Tangan (semasa)\n- [ ] Salinan Penyata Akaun Bank (3 bulan terkini)\n- [ ] Akuan Sumpah di bawah Akta Rahsia Rasmi 1972\n- [ ] Integrity Pact (ditandatangani)`
  : `- [ ] Borang Q — Borang Sebut Harga yang telah dilengkapkan (Lampiran 1 PK 2.9)\n- [ ] Salinan Sijil Pendaftaran Kementerian Kewangan (KKM) — sah laku\n- [ ] Salinan Sijil Pendaftaran Syarikat (SSM)\n${hargaSiling <= 100000 ? "- [ ] Salinan Sijil Taraf Bumiputera (STB) — diperlukan\n" : ""}- [ ] Spesifikasi teknikal / brosur produk/perkhidmatan\n- [ ] Senarai Pengalaman / Rujukan terdahulu (jika berkenaan)\n- [ ] Salinan Penyata Akaun Bank (3 bulan terkini)\n- [ ] Akuan Sumpah di bawah Akta Rahsia Rasmi 1972\n- [ ] Integrity Pact (ditandatangani)`}

---

*Draf ini disediakan berdasarkan Pekeliling Perbendaharaan PK 2.9 (Kaedah Sebut Harga). Sila semak dan pinda mengikut keperluan khusus agensi anda.*`;
}
