import { Router } from "express";
import { z } from "zod";
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, BorderStyle, VerticalAlign, ShadingType, AlignmentType,
} from "docx";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { classifyJenis, determineKaedah } from "./pk29Engine.js";

const router = Router();

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

// ── Shared style constants ───────────────────────────────────────────────────

const THIN_BORDER = {
  top:    { style: BorderStyle.SINGLE, size: 2, color: "cbd5e1" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "cbd5e1" },
  left:   { style: BorderStyle.SINGLE, size: 2, color: "cbd5e1" },
  right:  { style: BorderStyle.SINGLE, size: 2, color: "cbd5e1" },
};

function labelCell(text: string): TableCell {
  return new TableCell({
    borders: THIN_BORDER,
    shading: { type: ShadingType.SOLID, color: "f1f5f9" },
    width: { size: 38, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "374151" })],
      }),
    ],
  });
}

function valueCell(text: string): TableCell {
  return new TableCell({
    borders: THIN_BORDER,
    width: { size: 62, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [new TextRun({ text, size: 20, font: "Calibri", color: "0f172a" })],
      }),
    ],
  });
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "1e40af" } },
    children: [
      new TextRun({ text, bold: true, size: 22, font: "Calibri", color: "1e40af", allCaps: true }),
    ],
  });
}

function bodyText(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, size: 19, font: "Calibri", color: "374151" })],
  });
}

// ── Document builders ────────────────────────────────────────────────────────

function buildSebuthargaDoc(data: Record<string, string>): Document {
  return new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 } } },
      children: [
        // Header
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [new TextRun({ text: "KERAJAAN MALAYSIA", bold: true, size: 32, font: "Calibri", color: "1e3a8a" })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [new TextRun({ text: "BORANG SEBUT HARGA", bold: true, size: 28, font: "Calibri", color: "1e40af", allCaps: true })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "1e40af" } },
          children: [new TextRun({ text: "Pekeliling Perbendaharaan PK 2.9 — Kaedah Sebut Harga", size: 18, font: "Calibri", color: "64748b", italics: true })],
        }),

        // Bahagian A
        sectionHeading("Bahagian A: Maklumat Pemohon"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: THIN_BORDER,
          rows: [
            new TableRow({ children: [labelCell("Nama Pegawai Pemohon"), valueCell(data["nama"] ?? "")] }),
            new TableRow({ children: [labelCell("Nama Jabatan / Agensi"),  valueCell(data["namaSyarikat"] ?? "")] }),
            new TableRow({ children: [labelCell("Tarikh"),                  valueCell(data["tarikh"] ?? "")] }),
          ],
        }),

        // Bahagian B
        sectionHeading("Bahagian B: Butiran Perolehan"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: THIN_BORDER,
          rows: [
            new TableRow({ children: [labelCell("Jenis Perolehan"),   valueCell(data["jenisPerolehan"] ?? "")] }),
            new TableRow({ children: [labelCell("Kaedah Perolehan"),  valueCell(data["kaedahPerolehan"] ?? "")] }),
            new TableRow({ children: [labelCell("Harga Siling"),      valueCell(data["hargaSiling"] ?? "")] }),
          ],
        }),

        // Bahagian C
        sectionHeading("Bahagian C: Huraian / Skop Perolehan"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: THIN_BORDER,
          rows: [
            new TableRow({
              children: [new TableCell({
                borders: THIN_BORDER,
                children: [new Paragraph({
                  spacing: { before: 80, after: 80 },
                  children: [new TextRun({ text: data["situasi"] ?? "", size: 20, font: "Calibri", color: "0f172a" })],
                })],
              })],
            }),
          ],
        }),

        // Bahagian D
        sectionHeading("Bahagian D: Syarat-Syarat Am"),
        bodyText("1. Sebut harga ini adalah tertakluk kepada syarat-syarat yang ditetapkan dalam Pekeliling Perbendaharaan PK 2.9."),
        bodyText("2. Harga yang ditawarkan hendaklah mengambil kira semua kos termasuk penghantaran, pemasangan dan cukai yang berkenaan."),
        bodyText("3. Tempoh sah laku sebut harga adalah selama 90 hari dari tarikh tutup tawaran."),
        bodyText("4. Kerajaan tidak terikat untuk menerima sebut harga yang terendah atau mana-mana sebut harga."),
        bodyText("5. Semua barangan/perkhidmatan/kerja mestilah memenuhi spesifikasi yang ditetapkan oleh Jabatan."),

        // Bahagian E — Signatures
        sectionHeading("Bahagian E: Pengesahan"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: THIN_BORDER,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: THIN_BORDER,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ spacing: { before: 80, after: 20 }, children: [new TextRun({ text: "Disediakan oleh:", bold: true, size: 20, font: "Calibri", color: "374151" })] }),
                    new Paragraph({ spacing: { before: 200, after: 60 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: "94a3b8" } }, children: [new TextRun({ text: "Tandatangan & Cop Rasmi", size: 18, font: "Calibri", color: "94a3b8", italics: true })] }),
                    new Paragraph({ spacing: { before: 40, after: 80 }, children: [new TextRun({ text: `Nama: ${data["nama"] ?? ""}`, size: 20, font: "Calibri", color: "0f172a" })] }),
                  ],
                }),
                new TableCell({
                  borders: THIN_BORDER,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({ spacing: { before: 80, after: 20 }, children: [new TextRun({ text: "Disahkan oleh Ketua Jabatan:", bold: true, size: 20, font: "Calibri", color: "374151" })] }),
                    new Paragraph({ spacing: { before: 200, after: 60 }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: "94a3b8" } }, children: [new TextRun({ text: "Tandatangan & Cop Rasmi", size: 18, font: "Calibri", color: "94a3b8", italics: true })] }),
                    new Paragraph({ spacing: { before: 40, after: 80 }, children: [new TextRun({ text: "Nama: ______________________________", size: 20, font: "Calibri", color: "0f172a" })] }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // Footer
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 280 },
          children: [new TextRun({ text: "Dokumen ini dijana secara automatik oleh Sistem Perolehan — PK 2.9", size: 16, font: "Calibri", color: "94a3b8", italics: true })],
        }),
      ],
    }],
  });
}

// ── Route ────────────────────────────────────────────────────────────────────

router.post("/generate-surat", async (req, res) => {
  const parsed = GenerateSuratBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Input tidak sah. Sila semak semua medan." });
    return;
  }

  const { situasi, hargaSiling, docType, extraData } = parsed.data;

  try {
    // Auto-compute classification fields
    const { jenis } = classifyJenis(situasi);
    const { kaedahLabel } = determineKaedah(jenis, hargaSiling);
    const jenisLabel = jenis === "bekalan" ? "Bekalan" : jenis === "perkhidmatan" ? "Perkhidmatan" : "Kerja";
    const hargaFormatted = `RM ${hargaSiling.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Process extra data — format date fields
    const processedExtra: Record<string, string> = {};
    for (const [key, val] of Object.entries(extraData)) {
      if (val && (key === "tarikh" || key.startsWith("tarikh_"))) {
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

    const safeNama = (
      processedExtra["nama"] ?? processedExtra["nama_pegawai"] ?? "dokumen"
    ).replace(/[^a-zA-Z0-9]/g, "_");
    const label = DOC_LABEL[docType] ?? "Dokumen";

    let buffer: Buffer;

    if (docType === "tawaran") {
      // Fetch template from Supabase Storage and fill with docxtemplater
      const supabaseUrl = process.env["SUPABASE_URL"];
      if (!supabaseUrl) {
        res.status(500).json({ error: "SUPABASE_URL belum dikonfigurasi." });
        return;
      }
      const bucket = process.env["SUPABASE_BUCKET"] ?? "templates";
      const templateFile = "kenyataan-tawaran-sebut-harga.docx";
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
      buffer = doc.getZip().generate({ type: "nodebuffer", compression: "DEFLATE" }) as Buffer;
    } else {
      // Build sebut-harga programmatically
      const docxDoc = buildSebuthargaDoc(renderData);
      buffer = await Packer.toBuffer(docxDoc);
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    res.setHeader("Content-Disposition", `attachment; filename="${label}_${safeNama}.docx"`);
    res.send(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ralat tidak diketahui.";
    console.error("[generate-surat] Error:", msg);
    res.status(500).json({ error: `Ralat semasa menjana dokumen: ${msg}` });
  }
});

export default router;
