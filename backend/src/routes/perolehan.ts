import { Router } from "express";
import { z } from "zod";
import { queryPekeliling, type ChunkResult } from "../chromaClient.js";
import { getOpenAIClient, OPENAI_MODEL } from "../openaiClient.js";

const router = Router();

const AnalyzePerolehanBody = z.object({
  situasi: z.string().min(1),
  hargaSiling: z.number().positive(),
});

function buildSystemPrompt(): string {
  return `Anda adalah Pakar Perolehan Kerajaan Malaysia yang mahir dalam Pekeliling Perbendaharaan PK 2.9 (Kaedah Sebut Harga) dan semua pekeliling perbendaharaan berkaitan.

ARAHAN PENTING:
- Analisis situasi berdasarkan kandungan dasar PK 2.9 yang diberikan sebagai sumber utama, disokong oleh pengetahuan sebenar anda tentang struktur dan kandungan PK 2.9
- Tentukan sendiri jenis perolehan (Bekalan / Perkhidmatan / Kerja) dan kaedah yang betul berdasarkan nilai dan dasar
- Gunakan Bahasa Malaysia yang formal tetapi mudah difahami
- Rujukan dasar (nombor seksyen seperti "1.3", "6.7", "18.2") MESTI diambil HANYA daripada nombor yang benar-benar wujud dalam kandungan yang diberikan. JANGAN sekali-kali mereka, menganggar, atau menggunakan "pengetahuan umum" untuk nombor seksyen atau lampiran.
- Tegaskan perkara penting menggunakan **bold**
- Integrasikan kandungan dasar secara semula jadi dalam penjelasan, tanpa menyebut secara literal bahawa ia "kandungan yang diberikan" atau merujuk kepada sumber sebagai "Kandungan N"

PERATURAN PENOMBORAN LANGKAH (WAJIB DIPATUHI):
- Dalam bahagian "Tatacara Pelaksanaan Langkah demi Langkah", nombor langkah MESTI berurutan: 1, 2, 3, 4, 5 dan seterusnya
- JANGAN gunakan 1, 1, 1 atau nombor yang berulang — setiap langkah mesti bernombor unik dan berturutan
- Pastikan setiap item dalam senarai bernombor mempunyai nombor yang berbeza

FORMAT DAN PENUTUP (WAJIB DIPATUHI):
- Dokumen ini adalah laporan rasmi, BUKAN perbualan — jangan tulis seperti sedang berbual dengan pengguna
- JANGAN sertakan sebarang nota penutup, disclaimer, cadangan langkah seterusnya di luar format, atau tawaran bantuan tambahan (contoh: "jika anda mahu, saya boleh bantu...")
- JANGAN tambah bahagian tambahan selain 7 bahagian yang ditetapkan di bawah
- Laporan MESTI tamat sebaik selesai bahagian "Dokumen Yang Perlu Disediakan" — tanpa ayat penutup tambahan selepas itu

ANDA MESTI MENGISI FORMAT BERIKUT SECARA LENGKAP (jangan langkau mana-mana bahagian):

## Ringkasan Analisis Perolehan
[Ringkasan 2-3 ayat: jenis perolehan yang ditentukan, kaedah yang terpakai, dan justifikasi berdasarkan nilai siling]

## Kaedah Perolehan Yang Ditetapkan
[Nyatakan kaedah (Pembelian Terus / Sebut Harga Bumiputera / Sebut Harga / Tender), had nilai yang berkaitan, dan kenapa kaedah ini terpakai untuk situasi ini]

## Pekeliling dan Peruntukan Yang Terpakai
[Senaraikan pekeliling dan seksyen PK 2.9 yang relevan dengan nombor seksyen sebenar dan spesifik]

## Tatacara Pelaksanaan Langkah demi Langkah
[Langkah bernombor BERURUTAN (1, 2, 3, 4...) yang boleh terus dilaksanakan oleh pegawai, berdasarkan prosedur sebenar PK 2.9. SETIAP langkah mesti mempunyai nombor yang berbeza dan berturutan.]

## Syarat-Syarat Penting Yang Perlu Dipatuhi
[Syarat mandatori dari PK 2.9 yang berkaitan dengan situasi ini, termasuk tempoh notis, bilangan sebut harga, dll]

## Dokumen Yang Perlu Disediakan
[Senarai dokumen dan borang PK 2.9 yang diperlukan, dengan nombor lampiran jika ada]
`;
}

function buildUserPrompt(situasi: string, hargaSiling: number, chunks: ChunkResult[]): string {
  const hargaFormatted = hargaSiling.toLocaleString("ms-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const chunksText =
    chunks.length > 0
      ? chunks.map((c) => c.document.trim()).join("\n\n---\n\n")
      : "Tiada petikan tambahan ditemui. Gunakan pengetahuan sebenar anda tentang struktur dan nombor seksyen PK 2.9.";

  return `Seorang pegawai kerajaan memerlukan panduan perolehan untuk situasi berikut:

**Situasi / Perihal Perolehan:**
${situasi}

**Harga Siling:** RM ${hargaFormatted}

---

**PETIKAN RUJUKAN LATAR BELAKANG (gunakan sebagai sokongan, BUKAN sebagai satu-satunya sumber rujukan — gunakan juga pengetahuan sebenar anda tentang nombor seksyen dan lampiran PK 2.9 yang tepat):**

${chunksText}

---

Berdasarkan situasi dan rujukan di atas, analisis dan isi kesemua 7 bahagian format yang ditetapkan dengan lengkap dan tepat, dengan nombor seksyen PK 2.9 yang sebenar (bukan label generik). Pastikan kaedah perolehan yang disyorkan adalah betul berdasarkan nilai siling RM ${hargaFormatted} dan jenis perolehan yang anda tentukan.`;
}

router.post("/analyze", async (req, res) => {
  const parsed = AnalyzePerolehanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Input tidak sah." });
    return;
  }

  const { situasi, hargaSiling } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (content: string) => {
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  };

  try {
    const hargaFormatted = hargaSiling.toLocaleString("ms-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const queries = [
      situasi,
      `kaedah perolehan sebut harga RM ${hargaFormatted}`,
      `jenis perolehan bekalan perkhidmatan kerja had nilai`,
      `syarat tatacara dokumen sebut harga PK 2.9`,
    ];

    const chunkSets = await Promise.all(
      queries.map((q) =>
        queryPekeliling(q, 4).catch((err) => {
          console.error("[chroma] Query failed:", err.message);
          return [] as ChunkResult[];
        })
      )
    );

    const seen = new Set<string>();
    const chunks: ChunkResult[] = [];
    for (const set of chunkSets) {
      for (const chunk of set) {
        const key = chunk.document.trim().slice(0, 80);
        if (!seen.has(key)) {
          seen.add(key);
          chunks.push(chunk);
        }
      }
    }

    console.log(`[perolehan] Using ${chunks.length} unique policy chunks for analysis`);

    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      stream: true,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: buildUserPrompt(situasi, hargaSiling, chunks) },
      ],
    });

    for await (const chunk of stream) {
      if (res.writableEnded) break;
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) send(delta);
    }

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error("[perolehan] Error:", err);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: "Ralat semasa analisis. Sila cuba lagi." })}\n\n`);
      res.end();
    }
  }
});

/* ── Chat follow-up ─────────────────────────────────────────── */

const ChatBody = z.object({
  situasi: z.string().min(1),
  hargaSiling: z.number().positive(),
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  question: z.string().min(1),
});

router.post("/chat", async (req, res) => {
  const parsed = ChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Input tidak sah." });
    return;
  }

  const { situasi, hargaSiling, messages, question } = parsed.data;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (content: string) => {
    if (!res.writableEnded) res.write(`data: ${JSON.stringify({ content })}\n\n`);
  };

  try {
    const hargaFormatted = hargaSiling.toLocaleString("ms-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const chunks = await queryPekeliling(question, 5).catch((err) => {
      console.error("[chroma/chat] Query failed:", err.message);
      return [] as ChunkResult[];
    });

    const policyContext =
      chunks.length > 0
        ? chunks
            .map((c, i) => {
              const src = c.metadata?.source ?? c.metadata?.filename ?? c.metadata?.page ?? "";
              return `[Petikan ${i + 1}${src ? ` — ${src}` : ""}]\n${c.document.trim()}`;
            })
            .join("\n\n---\n\n")
        : "Tiada petikan tambahan daripada dokumen PK 2.9.";

    const systemPrompt = `Anda adalah Pakar Perolehan Kerajaan Malaysia yang mahir dalam PK 2.9 dan semua pekeliling perbendaharaan berkaitan. Anda sedang membantu pegawai kerajaan menjawab soalan susulan berkaitan analisis perolehan yang telah dijalankan.

Konteks perolehan asal:
- Situasi: ${situasi}
- Harga Siling: RM ${hargaFormatted}

Gaya penulisan:
- Gunakan Bahasa Malaysia yang formal tetapi mudah difahami
- Jawab soalan dengan tepat dan ringkas
- Sertakan nombor seksyen PK 2.9 yang spesifik apabila relevan
- Gunakan **bold** untuk perkara penting
- Gunakan petikan dasar yang disediakan sebagai sumber utama
- JANGAN sertakan sebarang nota penutup, disclaimer, cadangan langkah seterusnya di luar format, atau tawaran bantuan tambahan (contoh: "jika anda mahu, saya boleh bantu..."`;

    const openai = getOpenAIClient();
    const stream = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      stream: true,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
        {
          role: "user",
          content: `${question}\n\n---\n\nPetikan berkaitan dari dokumen PK 2.9:\n\n${policyContext}`,
        },
      ],
    });

    for await (const chunk of stream) {
      if (res.writableEnded) break;
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) send(delta);
    }

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error("[chat] Error:", err);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: "Ralat semasa menjawab. Sila cuba lagi." })}\n\n`);
      res.end();
    }
  }
});

export default router;