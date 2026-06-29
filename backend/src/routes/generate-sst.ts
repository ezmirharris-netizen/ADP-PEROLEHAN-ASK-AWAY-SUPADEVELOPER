import { Router } from "express";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const router = Router();

function formatMalaysianDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" });
}

const DATE_KEYS = ["Tarikh_Mula_K", "Tarikh_Tamat_K", "Tarikh_CP"];

router.post("/generate-sst", async (req, res) => {
  const body = req.body as Record<string, string>;

  const supabaseUrl = process.env["SUPABASE_URL"];
  if (!supabaseUrl) {
    res.status(500).json({ error: "SUPABASE_URL belum dikonfigurasi." });
    return;
  }

  const bucket = process.env["SUPABASE_BUCKET"] ?? "templates";
  const templateFile = "surat-setuju-terima-template.docx";
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${templateFile}`;

  const fetchRes = await fetch(publicUrl);
  if (!fetchRes.ok) {
    console.error("[generate-sst] Template fetch failed:", fetchRes.status, fetchRes.statusText);
    res.status(500).json({
      error: `Gagal memuat turun templat "${templateFile}" dari Supabase Storage (${fetchRes.status}). Pastikan bucket "${bucket}" adalah public dan fail telah dimuat naik.`,
    });
    return;
  }

  const renderData: Record<string, string> = {};
  for (const [key, val] of Object.entries(body)) {
    if (DATE_KEYS.includes(key) && val) {
      renderData[key] = formatMalaysianDate(val);
    } else {
      renderData[key] = val ?? "";
    }
  }

  try {
    const arrayBuffer = await fetchRes.arrayBuffer();
    const zip = new PizZip(Buffer.from(arrayBuffer));
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(renderData);

    const buffer = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;

    const safeSyarikat = (body["Nama_Syarikat"] ?? "dokumen").replace(/[^a-zA-Z0-9]/g, "_");
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="Surat_Setuju_Terima_${safeSyarikat}.docx"`);
    res.send(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat tidak diketahui.";
    console.error("[generate-sst] Error:", msg);
    res.status(500).json({ error: `Ralat semasa menjana Surat Setuju Terima: ${msg}` });
  }
});

export default router;
