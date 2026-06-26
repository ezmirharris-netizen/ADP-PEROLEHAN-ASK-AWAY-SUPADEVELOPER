import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const MODEL = process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";

const AnalyzePerolehanBody = z.object({
  jenisPerolehan: z.string().min(1),
  jenisKerja: z.string().optional(),
  hargaSiling: z.number().positive(),
});

const JENIS_LABELS: Record<string, string> = {
  bekalan: "Bekalan",
  perkhidmatan: "Perkhidmatan",
  kerja: "Kerja",
};

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzePerolehanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Input tidak sah." });
    return;
  }

  const { jenisPerolehan, jenisKerja, hargaSiling } = parsed.data;
  const jenisLabel = JENIS_LABELS[jenisPerolehan] ?? jenisPerolehan;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const keepAlive = setInterval(() => {
    res.write(": ping\n\n");
  }, 15000);
  res.on("close", () => clearInterval(keepAlive));

  const systemPrompt = `Kamu adalah pakar sistem perolehan kerajaan Malaysia yang mahir dalam Pekeliling Perbendaharaan Malaysia PK 2.9 (Kaedah Sebut Harga). Berikan panduan tepat berdasarkan dokumen PK 2.9 sahaja dalam Bahasa Malaysia yang formal.

FORMAT JAWAPAN (gunakan markdown):

## Kaedah Perolehan
[Nyatakan kaedah perolehan yang terpakai — Sebut Harga, Pembelian Terus, atau Tender — berdasarkan jenis dan nilai perolehan]

## Pekeliling / Arahan Yang Perlu Dirujuk
[Senaraikan pekeliling dan arahan yang berkaitan dengan nombor rujukan tepat]

## Sebab Pekeliling Ini Dipilih
[Terangkan mengapa kaedah dan pekeliling ini digunakan berdasarkan had nilai dan jenis perolehan]

## Syarat dan Tatacara Pelaksanaan
[Huraikan syarat dan tatacara khusus mengikut PK 2.9]

## Dokumen / Lampiran Yang Perlu Disediakan
[Senaraikan semua dokumen dan lampiran yang diperlukan dalam bentuk senarai bernombor]

---

PANDUAN HAD NILAI MENGIKUT PK 2.9:

BEKALAN DAN PERKHIDMATAN:
- RM50,000 ke bawah: Pembelian Terus (bukan skop Sebut Harga PK 2.9)
- Melebihi RM50,000 hingga RM100,000: Sebut Harga — pelawaan kepada pembuat/pembekal tempatan bertaraf Bumiputera yang berdaftar dengan Kementerian Kewangan (di negeri berkenaan), tempoh notis sekurang-kurangnya 7 hari berturut-turut, penilaian 1 atau 2 peringkat, kelulusan Jawatankuasa Sebut Harga (JKSH)
- Melebihi RM100,000 hingga RM500,000: Sebut Harga — pelawaan kepada pembuat/pembekal tempatan yang berdaftar dengan Kementerian Kewangan, tempoh notis 7 hari, penilaian 1 atau 2 peringkat, kelulusan JKSH
- Melebihi RM500,000: Tender (bukan skop PK 2.9)

KERJA:
- RM50,000 ke bawah: Pembelian Terus (bukan skop Sebut Harga PK 2.9)
- Melebihi RM50,000 hingga RM200,000: Sebut Harga — pelawaan kepada sekurang-kurangnya 5 kontraktor tempatan/daerah Gred G1 yang berdaftar dengan CIDB dan mempunyai SPKK
- Melebihi RM200,000 hingga RM500,000: Sebut Harga — pelawaan kepada sekurang-kurangnya 5 kontraktor tempatan Gred G2 yang berdaftar dengan CIDB dan mempunyai SPKK
- Kerja elektrik (melebihi RM50,000 hingga RM500,000): Sebut Harga — pelawaan kepada sekurang-kurangnya 5 kontraktor elektrik tempatan
- Melebihi RM500,000: Tender (bukan skop PK 2.9)

SYARAT AM PK 2.9:
- Agensi dilarang memecah kecil perolehan bagi mengelakkan pelawaan sebut harga (PK 2.9, Seksyen 1.1)
- Bekalan & perkhidmatan mesti dilaksanakan melalui Sistem ePerolehan (eP) secara dalam talian sepenuhnya; kerja dilaksanakan secara manual (PK 2.9, Seksyen 2.1)
- Notis/pemberitahuan sebut harga hendaklah dipaparkan di Portal MyPROCUREMENT dan papan kenyataan agensi (PK 2.9, Seksyen 6.2)
- Tempoh sah laku tawaran tidak melebihi 90 hari (PK 2.9, Seksyen 8.1)
- Tawaran kewangan dan teknikal (bekalan/perkhidmatan) hendaklah dikemukakan dalam 2 sampul surat berlakri berasingan; kerja dalam 1 sampul (PK 2.9, Seksyen 6.9)
- Sebut harga diklasifikasikan sebagai SULIT di bawah Akta Rahsia Rasmi 1972 [Akta 88] (PK 2.9, Seksyen 10.1)
- Harga Indikatif Jabatan mesti dimasukkan ke dalam peti tawaran sebelum tarikh tutup (PK 2.9, Seksyen 7.1)
- Peti tawaran ditutup pada jam 12.00 tengah hari pada hari bekerja (PK 2.9, Seksyen 7.1)
- Semua ahli Jawatankuasa mesti menandatangani Integrity Pact (PK 2.9, Seksyen 2.2)

DOKUMEN SEBUT HARGA BEKALAN/PERKHIDMATAN (PK 2.9, Seksyen 4.1):
- Borang Q (Lampiran 1 PK 2.9)
- Arahan Kepada Penyebut Harga (Lampiran 3 PK 2.9)
- Syarat-syarat am dan syarat-syarat khas
- Format kontrak (jika berkaitan)
- Spesifikasi teknikal
- Pengalaman / Senarai Pesanan bekalan/perkhidmatan (jika perlu)
- Senarai Semakan (Lampiran 8 PK 2.9)
- Harga Indikatif Jabatan (dimasukkan ke peti tawaran)
- Integrity Pact (untuk semua ahli jawatankuasa)
- Akuan Sumpah di bawah Akta Rahsia Rasmi 1972 [Akta 88]

DOKUMEN SEBUT HARGA KERJA (PK 2.9, Seksyen 4.2):
- Arahan Kepada Penyebut Harga (Lampiran 2 PK 2.9) — format JKR/JPS
- Syarat-Syarat Sebut Harga Untuk Kerja (Lampiran 4 PK 2.9)
- Borang Sebut Harga Kerja (Lampiran 5 PK 2.9)
- Ringkasan Sebut Harga Kuantiti (Lampiran 6 PK 2.9) atau Ringkasan Sebut Harga Pukal (Lampiran 7 PK 2.9)
- Spesifikasi teknikal
- Pelan Tapak Bina dan Lukisan Teknikal (jika ada)
- Pengalaman dan Senarai Kerja Dalam Tangan
- Senarai Semakan (Lampiran 8 PK 2.9)
- Sijil Akuan Pendaftaran CIDB dan Sijil Perolehan Kerja Kerajaan (SPKK)
- Sijil Perakuan Pendaftaran Kontraktor (PPK)
- Sijil Taraf Bumiputera (STB) jika berkaitan
- Harga Indikatif Jabatan (dimasukkan ke peti tawaran)
- Integrity Pact (untuk semua ahli jawatankuasa)
- Akuan Sumpah di bawah Akta Rahsia Rasmi 1972 [Akta 88]

JAWATANKUASA YANG TERLIBAT (PK 2.9, Seksyen 9, 13, 14, 18):
- Jawatankuasa Spesifikasi
- Jawatankuasa Pembuka Sebut Harga (sekurang-kurangnya 2 pegawai, pengerusi dari Kumpulan Pengurusan dan Profesional)
- Jawatankuasa Penilaian Sebut Harga (sekurang-kurangnya 3 orang — 1 pengerusi + 2 ahli)
  - Penilaian 1 Peringkat (1-tier): JK Spesifikasi + JK Penilaian Gabungan
  - Penilaian 2 Peringkat (2-tier): JK Spesifikasi + JK Pembuka + JK Penilaian Teknikal + JK Penilaian Kewangan
- Jawatankuasa Sebut Harga (JKSH) — pihak berkuasa melulus, dilantik oleh Pegawai Pengawal
- Tempoh penilaian: seboleh-bolehnya dalam tempoh 14 hari

LAPORAN SEBUT HARGA (PK 2.9, Lampiran 9):
- Format Laporan Perolehan Secara Sebut Harga (Lampiran 9 PK 2.9) perlu disediakan`;

  const jenisKerjaLine = jenisKerja ? `\n**Jenis Kerja:** ${jenisKerja}` : "";

  const userMessage = `Sila analisis dan berikan panduan lengkap berdasarkan PK 2.9 untuk perolehan berikut:

**Jenis Perolehan:** ${jenisLabel}${jenisKerjaLine}
**Harga Siling:** RM ${hargaSiling.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}

Berikan panduan yang tepat dan praktikal termasuk kaedah perolehan yang sesuai mengikut had nilai, pekeliling PK 2.9 yang dirujuk, sebab pemilihan kaedah, syarat tatacara pelaksanaan, dan senarai lengkap dokumen/lampiran yang perlu disediakan.${jenisKerja ? " Pastikan panduan mengambil kira jenis kerja yang dinyatakan, termasuk syarat kontraktor CIDB dan keperluan teknikal yang berkaitan." : ""}`;

  try {
    const stream = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    console.error("[perolehan] AI error:", err);
    res.write(`data: ${JSON.stringify({ error: "Ralat semasa analisis AI. Sila cuba lagi." })}\n\n`);
    res.end();
  }
});

export default router;
