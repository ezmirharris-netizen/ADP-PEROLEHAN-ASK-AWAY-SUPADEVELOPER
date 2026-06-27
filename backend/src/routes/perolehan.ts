import { Router } from "express";
import { z } from "zod";
import { generateGuidance, classifyJenis, determineKaedah } from "./pk29Engine.js";
import { queryPekeliling } from "../chromaClient.js";

const router = Router();

const AnalyzePerolehanBody = z.object({
  situasi: z.string().min(1),
  hargaSiling: z.number().positive(),
});

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

  const streamText = async (text: string, delay = 8) => {
    const words = text.split(/(\s+)/);
    for (const word of words) {
      if (res.writableEnded) break;
      send(word);
      await new Promise((r) => setTimeout(r, delay));
    }
  };

  try {
    // 1. Classify situation using rule engine
    const { jenis, reason } = classifyJenis(situasi);
    const jenisLabel =
      jenis === "bekalan" ? "Bekalan" : jenis === "perkhidmatan" ? "Perkhidmatan" : "Kerja";
    const hargaFormatted = hargaSiling.toLocaleString("ms-MY", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const { kaedahLabel } = determineKaedah(jenis, hargaSiling);

    // 2. Query ChromaDB in parallel with streaming start
    const queryStr = `${situasi} ${jenisLabel} RM ${hargaFormatted} ${kaedahLabel}`;
    const chunksPromise = queryPekeliling(queryStr, 6).catch((err) => {
      console.error("[chroma] Query failed:", err.message);
      return [];
    });

    // 3. Stream rule-based structural analysis first (fast)
    const structuralGuidance = generateGuidance(situasi, hargaSiling);
    await streamText(structuralGuidance, 8);

    // 4. Wait for ChromaDB chunks and append as grounded references
    const chunks = await chunksPromise;

    if (chunks.length > 0) {
      const refSection = buildReferenceSection(chunks);
      await streamText("\n\n---\n\n" + refSection, 6);
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

function buildReferenceSection(chunks: { document: string; metadata: Record<string, unknown>; distance: number }[]): string {
  const lines: string[] = [
    "## Petikan Berkaitan dari Dokumen PK 2.9",
    "",
    "Berikut adalah peruntukan sebenar dari Pekeliling Perbendaharaan PK 2.9 yang berkaitan dengan situasi anda:",
    "",
  ];

  chunks.forEach((chunk, i) => {
    const source = chunk.metadata?.source ?? chunk.metadata?.filename ?? chunk.metadata?.page ?? "";
    const sourceLabel = source ? ` *(${source})*` : "";
    lines.push(`### Rujukan ${i + 1}${sourceLabel}`);
    lines.push("");
    lines.push(chunk.document.trim());
    lines.push("");
  });

  return lines.join("\n");
}

export default router;
