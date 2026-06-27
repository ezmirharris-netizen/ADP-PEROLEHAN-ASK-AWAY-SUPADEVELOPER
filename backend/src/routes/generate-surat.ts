import { Router } from "express";
import { z } from "zod";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { classifyJenis, determineKaedah } from "./pk29Engine.js";

const router = Router();

const TEMPLATE_MAP: Record<string, string> = {
  "sebut-harga": "template-sebut-harga.docx",
  "tawaran": "kenyataan-tawaran-sebut-harga.docx",
};

const DOC_LABEL: Record<string, string> = {
  "sebut-harga": "Sebut_Harga",
  "tawaran": "Tawaran_Sebut_Harga",
};

const GenerateSuratBody = z.object({
  situasi: z.string().min(1),
  hargaSiling: z.number().positive(),
  docType: z.enum(["sebut-harga", "tawaran"]).default("sebut-harga"),
  extraData: z.record(z.string()).default({}),
});

function formatMalaysianDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" });
}

router.post("/generate-surat", async (req, res) => {
  const parsed = GenerateSuratBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Input tidak sah. Sila semak semua medan." });
    return;
  }

  const { situasi, hargaSiling, docType, extraData } = parsed.data;

  try {
    const supabaseUrl = process.env["SUPABASE_URL"];
    if (!supabaseUrl) {
      res.status(500).json({ error: "SUPABASE_URL belum dikonfigurasi." });
      return;
    }

    const bucket = process.env["SUPABASE_BUCKET"] ?? "templates";
    const templateFile = TEMPLATE_MAP[docType] ?? TEMPLATE_MAP["sebut-harga"];
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${templateFile}`;

    const fetchRes = await fetch(publicUrl);
    if (!fetchRes.ok) {
      console.error("[generate-surat] Template fetch failed:", fetchRes.status, fetchRes.statusText);
      res.status(500).json({
        error: `Gagal memuat turun templat "${templateFile}" dari Supabase Storage (${fetchRes.status}). Pastikan bucket "${bucket}" adalah public dan fail telah dimuat naik.`,
      });
      return;
    }

    const arrayBuffer = await fetchRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Auto-computed fields from analysis engine
    const { jenis } = classifyJenis(situasi);
    const { kaedahLabel } = determineKaedah(jenis, hargaSiling);
    const jenisLabel = jenis === "bekalan" ? "Bekalan" : jenis === "perkhidmatan" ? "Perkhidmatan" : "Kerja";
    const hargaFormatted = `RM ${hargaSiling.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const autoData: Record<string, string> = {
      situasi,
      hargaSiling: hargaFormatted,
      jenisPerolehan: jenisLabel,
      kaedahPerolehan: kaedahLabel,
    };

    // Process extraData: auto-format any key named "tarikh" or starting with "tarikh_"
    const processedExtra: Record<string, string> = {};
    for (const [key, val] of Object.entries(extraData)) {
      if (val && (key === "tarikh" || key.startsWith("tarikh_"))) {
        processedExtra[key] = formatMalaysianDate(val);
      } else {
        processedExtra[key] = val;
      }
    }

    const renderData = { ...autoData, ...processedExtra };

    const zip = new PizZip(buffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(renderData);

    const output = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" });

    const safeNama = (processedExtra["nama"] ?? processedExtra["nama_pegawai"] ?? "dokumen").replace(/[^a-zA-Z0-9]/g, "_");
    const label = DOC_LABEL[docType] ?? "Dokumen";
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${label}_${safeNama}.docx"`);
    res.send(output);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat tidak diketahui.";
    console.error("[generate-surat] Error:", msg);
    res.status(500).json({ error: `Ralat semasa menjana dokumen: ${msg}` });
  }
});

export default router;
