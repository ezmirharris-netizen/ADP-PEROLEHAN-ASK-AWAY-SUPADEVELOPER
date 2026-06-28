import { Router } from "express";
import { z } from "zod";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import multer from "multer";
import { classifyJenis, determineKaedah } from "./pk29Engine.js";

function extractDocxBodyXml(buffer: Buffer): string {
  try {
    const zip = new PizZip(buffer);
    const xmlText = zip.file("word/document.xml")?.asText() ?? "";
    const match = xmlText.match(/<w:body>([\s\S]+)<\/w:body>/);
    if (!match) return "";
    const body = match[1].replace(/<w:sectPr[\s\S]*?<\/w:sectPr>\s*$/, "").trim();
    return body;
  } catch {
    return "";
  }
}

function injectXmlAtMarker(docXml: string, marker: string, rawXml: string): string {
  const safeMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(
    `<w:p[ >](?:(?!<w:p[ >])[\\s\\S])*?${safeMarker}[\\s\\S]*?<\\/w:p>`,
    "g"
  );
  return docXml.replace(regex, rawXml);
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const router = Router();

const GenerateSuratBody = z.object({
  situasi: z.string().min(1),
  hargaSiling: z.number().positive(),
  extraData: z.record(z.string()).default({}),
});

function formatMalaysianDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ms-MY", { day: "2-digit", month: "long", year: "numeric" });
}

const FILE_INJECT_KEYS = ["SENARAI_SPESIFIKASI", "Jadual_Tawaran_Harga"];

router.post("/generate-surat", upload.any(), async (req, res) => {
  let situasi: string;
  let hargaSiling: number;
  let extraData: Record<string, string>;
  let docxInjections: Record<string, string> = {};

  const isMultipart = !!(req.headers["content-type"]?.includes("multipart/form-data"));

  if (isMultipart) {
    situasi = String(req.body.situasi ?? "").trim();
    hargaSiling = parseFloat(req.body.hargaSiling ?? "0");
    extraData = {};

    for (const [key, val] of Object.entries(req.body as Record<string, string>)) {
      if (key.startsWith("extra_")) {
        extraData[key.slice(6)] = String(val);
      }
    }

    const uploadedFiles = (req.files as Express.Multer.File[]) ?? [];
    for (const file of uploadedFiles) {
      if (file.fieldname.startsWith("file_")) {
        const fieldKey = file.fieldname.slice(5);
        const bodyXml = extractDocxBodyXml(file.buffer);
        if (bodyXml) {
          docxInjections[fieldKey] = bodyXml;
          console.log(`[generate-surat] DOCX body extracted for ${fieldKey}: ${bodyXml.length} chars`);
        } else {
          console.warn(`[generate-surat] Empty DOCX body for ${fieldKey}`);
        }
      }
    }

    if (!situasi || isNaN(hargaSiling) || hargaSiling <= 0) {
      res.status(400).json({ error: "Input tidak sah. Sila semak semua medan." });
      return;
    }
  } else {
    const parsed = GenerateSuratBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Input tidak sah. Sila semak semua medan." });
      return;
    }
    ({ situasi, hargaSiling, extraData } = parsed.data);
  }

  try {
    const { jenis } = classifyJenis(situasi);
    const { kaedahLabel } = determineKaedah(jenis, hargaSiling);
    const jenisLabel = jenis === "bekalan" ? "Bekalan" : jenis === "perkhidmatan" ? "Perkhidmatan" : "Kerja";
    const hargaFormatted = `RM ${hargaSiling.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const processedExtra: Record<string, string> = {};
    for (const [key, val] of Object.entries(extraData)) {
      const lk = key.toLowerCase();
      if (val && (lk === "tarikh" || lk.startsWith("tarikh_") || lk.startsWith("tarikh"))) {
        processedExtra[key] = formatMalaysianDate(val);
      } else {
        processedExtra[key] = val;
      }
    }

    const renderData: Record<string, string> = {
      situasi,
      hargaSiling: hargaFormatted,
      jenisPerolehan: jenisLabel,
      kaedahPerolehan: kaedahLabel,
      ...processedExtra,
    };

    for (const key of FILE_INJECT_KEYS) {
      if (docxInjections[key]) {
        renderData[key] = `DOCXINJECT_${key}`;
      } else if (!(key in renderData)) {
        renderData[key] = "";
      }
    }

    const safeNama = (
      processedExtra["nama"] ?? processedExtra["nama_pegawai"] ?? processedExtra["Nama_Pegawai"] ?? "dokumen"
    ).replace(/[^a-zA-Z0-9]/g, "_");

    const supabaseUrl = process.env["SUPABASE_URL"];
    if (!supabaseUrl) {
      res.status(500).json({ error: "SUPABASE_URL belum dikonfigurasi." });
      return;
    }
    const bucket = process.env["SUPABASE_BUCKET"] ?? "templates";
    const templateFile = "dokumen-sebut-harga-template.docx";
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
    const zip = new PizZip(Buffer.from(arrayBuffer));
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(renderData);

    const renderedZip = doc.getZip();
    if (Object.keys(docxInjections).length > 0) {
      const docXmlEntry = renderedZip.file("word/document.xml");
      if (docXmlEntry) {
        let docXml = docXmlEntry.asText();
        for (const [fieldKey, bodyXml] of Object.entries(docxInjections)) {
          const marker = `DOCXINJECT_${fieldKey}`;
          const before = docXml;
          docXml = injectXmlAtMarker(docXml, marker, bodyXml);
          if (docXml !== before) {
            console.log(`[generate-surat] Injected DOCX content for ${fieldKey}`);
          } else {
            console.warn(`[generate-surat] Marker not found in rendered XML for ${fieldKey}`);
          }
        }
        renderedZip.file("word/document.xml", docXml);
      }
    }

    const buffer = renderedZip.generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="Tawaran_Sebut_Harga_${safeNama}.docx"`);
    res.send(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat tidak diketahui.";
    console.error("[generate-surat] Error:", msg);
    res.status(500).json({ error: `Ralat semasa menjana dokumen: ${msg}` });
  }
});

export default router;
