import { Router } from "express";
import { z } from "zod";
import { generateDocDraft, classifyJenis } from "./pk29Engine.js";
import { queryPekeliling } from "../chromaClient.js";

const router = Router();

const GenerateDocBody = z.object({
  situasi: z.string().min(1),
  hargaSiling: z.number().positive(),
});

router.post("/generate-doc", async (req, res) => {
  const parsed = GenerateDocBody.safeParse(req.body);
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

  const streamText = async (text: string, delay = 6) => {
    const words = text.split(/(\s+)/);
    for (const word of words) {
      if (res.writableEnded) break;
      res.write(`data: ${JSON.stringify({ content: word })}\n\n`);
      await new Promise((r) => setTimeout(r, delay));
    }
  };

  try {
    const { jenis } = classifyJenis(situasi);
    const jenisLabel = jenis === "bekalan" ? "Bekalan" : jenis === "perkhidmatan" ? "Perkhidmatan" : "Kerja";

    // Query ChromaDB for relevant document template chunks
    const queryStr = `borang sebut harga ${jenisLabel} arahan penyebut harga syarat ${situasi}`;
    const chunksPromise = queryPekeliling(queryStr, 4).catch((err) => {
      console.error("[chroma] Doc query failed:", err.message);
      return [];
    });

    // Stream the draft document
    const draft = generateDocDraft(situasi, hargaSiling);
    await streamText(draft, 6);

    // Append any relevant chunks as appendix
    const chunks = await chunksPromise;
    if (chunks.length > 0) {
      const appendix = buildDocAppendix(chunks);
      await streamText("\n\n---\n\n" + appendix, 5);
    }

    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    }
  } catch (err) {
    console.error("[generate-doc] Error:", err);
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: "Ralat semasa menjana dokumen. Sila cuba lagi." })}\n\n`);
      res.end();
    }
  }
});

function buildDocAppendix(chunks: { document: string; metadata: Record<string, unknown> }[]): string {
  const lines = [
    "## Lampiran: Peruntukan Berkaitan dari PK 2.9",
    "",
    "Teks asal dari Pekeliling Perbendaharaan PK 2.9 yang berkaitan dengan dokumen ini:",
    "",
  ];

  chunks.forEach((chunk, i) => {
    const source = chunk.metadata?.source ?? chunk.metadata?.filename ?? chunk.metadata?.page ?? "";
    const label = source ? ` *(${source})*` : "";
    lines.push(`### Peruntukan ${i + 1}${label}`);
    lines.push("");
    lines.push(chunk.document.trim());
    lines.push("");
  });

  return lines.join("\n");
}

export default router;
