import { Router } from "express";
import OpenAI from "openai";
import { z } from "zod";

const router = Router();

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

const MODEL = process.env["OPENAI_MODEL"] ?? "gpt-4o-mini";

const GenerateDocBody = z.object({
  jenisPerolehan: z.string().min(1),
  jenisKerja: z.string().optional(),
  hargaSiling: z.number().positive(),
});

const JENIS_LABELS: Record<string, string> = {
  bekalan: "Bekalan",
  perkhidmatan: "Perkhidmatan",
  kerja: "Kerja",
};

router.post("/generate-doc", async (req, res) => {
  const parsed = GenerateDocBody.safeParse(req.body);
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

  const systemPrompt = `Kamu adalah pegawai perolehan kerajaan Malaysia yang pakar dalam menyediakan dokumen sebut harga mengikut Pekeliling Perbendaharaan PK 2.9. Hasilkan draf dokumen sebut harga yang lengkap dan formal dalam Bahasa Malaysia. Gunakan format rasmi kerajaan Malaysia.`;

  const jenisKerjaLine = jenisKerja ? `\n**Jenis Kerja:** ${jenisKerja}` : "";
  const hargaFormatted = hargaSiling.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const userMessage = `Sila hasilkan draf dokumen sebut harga yang lengkap untuk perolehan berikut:

**Jenis Perolehan:** ${jenisLabel}${jenisKerjaLine}
**Harga Siling:** RM ${hargaFormatted}

Hasilkan dokumen yang merangkumi:

## ARAHAN KEPADA PENYEBUT HARGA
Sediakan arahan lengkap kepada penyebut harga termasuk:
- Tujuan dan skop perolehan
- Syarat-syarat penyertaan (pendaftaran KKM/CIDB, SPKK jika kerja)
- Tatacara penyerahan sebut harga
- Tempoh sah laku tawaran
- Hak agensi

## BORANG SEBUT HARGA
Sediakan format borang sebut harga yang boleh diisi oleh kontraktor/pembekal termasuk:
- Maklumat syarikat
- Harga yang ditawarkan
- Jadual harga/senarai kuantiti (ringkasan)
- Akuan penyebut harga

## SYARAT-SYARAT AM
Senaraikan syarat-syarat am perolehan yang berkaitan dengan jenis perolehan ini berdasarkan PK 2.9.

## SENARAI SEMAK DOKUMEN (LAMPIRAN 8 PK 2.9)
Hasilkan senarai semak lengkap dokumen yang perlu disertakan oleh penyebut harga.${jenisKerja ? ` Pastikan syarat khusus untuk ${jenisKerja} dimasukkan.` : ""}

Gunakan format dokumen rasmi dengan pengepala yang sesuai.`;

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
    console.error("[generate-doc] AI error:", err);
    res.write(`data: ${JSON.stringify({ error: "Ralat semasa menjana dokumen. Sila cuba lagi." })}\n\n`);
    res.end();
  }
});

export default router;
