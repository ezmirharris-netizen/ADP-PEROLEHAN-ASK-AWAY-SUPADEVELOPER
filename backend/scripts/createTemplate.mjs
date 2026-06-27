/**
 * Run: node backend/scripts/createTemplate.mjs
 *
 * Generates template-sebut-harga.docx with docxtemplater {placeholders}
 * and saves it locally. Upload this file to your Supabase Storage bucket
 * named "templates" as "template-sebut-harga.docx".
 *
 * Placeholders used:
 *   {nama}            - Nama Pegawai Pemohon
 *   {namaSyarikat}    - Nama Jabatan / Agensi
 *   {tarikh}          - Tarikh
 *   {jenisPerolehan}  - Jenis Perolehan (Bekalan / Perkhidmatan / Kerja)
 *   {kaedahPerolehan} - Kaedah Perolehan
 *   {hargaSiling}     - Harga Siling (RM)
 *   {situasi}         - Huraian Situasi Perolehan
 */

import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Table, TableRow, TableCell, WidthType,
  BorderStyle, VerticalAlign, ShadingType,
} from "docx";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));

const BORDER = {
  top:    { style: BorderStyle.SINGLE, size: 6, color: "1e40af" },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: "1e40af" },
  left:   { style: BorderStyle.SINGLE, size: 6, color: "1e40af" },
  right:  { style: BorderStyle.SINGLE, size: 6, color: "1e40af" },
};

const THIN_BORDER = {
  top:    { style: BorderStyle.SINGLE, size: 2, color: "cbd5e1" },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: "cbd5e1" },
  left:   { style: BorderStyle.SINGLE, size: 2, color: "cbd5e1" },
  right:  { style: BorderStyle.SINGLE, size: 2, color: "cbd5e1" },
};

function labelCell(text) {
  return new TableCell({
    borders: THIN_BORDER,
    shading: { type: ShadingType.SOLID, color: "f1f5f9" },
    width: { size: 35, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "374151" }),
        ],
      }),
    ],
  });
}

function valueCell(text) {
  return new TableCell({
    borders: THIN_BORDER,
    width: { size: 65, type: WidthType.PERCENTAGE },
    verticalAlign: VerticalAlign.CENTER,
    children: [
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text, size: 20, font: "Calibri", color: "0f172a" }),
        ],
      }),
    ],
  });
}

function sectionHeading(text) {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "1e40af" },
    },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        font: "Calibri",
        color: "1e40af",
        allCaps: true,
      }),
    ],
  });
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1000, bottom: 1000, left: 1134, right: 1134 },
        },
      },
      children: [
        // ─── Header ────────────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: "KERAJAAN MALAYSIA",
              bold: true,
              size: 32,
              font: "Calibri",
              color: "1e3a8a",
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: "BORANG SEBUT HARGA",
              bold: true,
              size: 28,
              font: "Calibri",
              color: "1e40af",
              allCaps: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 20 },
          children: [
            new TextRun({
              text: "Pekeliling Perbendaharaan PK 2.9 — Kaedah Sebut Harga",
              size: 18,
              font: "Calibri",
              color: "64748b",
              italics: true,
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 280 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 8, color: "1e40af" },
          },
          children: [],
        }),

        // ─── Bahagian A ────────────────────────────────────────────────
        sectionHeading("Bahagian A: Maklumat Pemohon"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: THIN_BORDER,
          rows: [
            new TableRow({
              children: [
                labelCell("Nama Pegawai Pemohon"),
                valueCell("{nama}"),
              ],
            }),
            new TableRow({
              children: [
                labelCell("Nama Jabatan / Agensi"),
                valueCell("{namaSyarikat}"),
              ],
            }),
            new TableRow({
              children: [
                labelCell("Tarikh"),
                valueCell("{tarikh}"),
              ],
            }),
          ],
        }),

        // ─── Bahagian B ────────────────────────────────────────────────
        sectionHeading("Bahagian B: Butiran Perolehan"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: THIN_BORDER,
          rows: [
            new TableRow({
              children: [
                labelCell("Jenis Perolehan"),
                valueCell("{jenisPerolehan}"),
              ],
            }),
            new TableRow({
              children: [
                labelCell("Kaedah Perolehan"),
                valueCell("{kaedahPerolehan}"),
              ],
            }),
            new TableRow({
              children: [
                labelCell("Harga Siling"),
                valueCell("{hargaSiling}"),
              ],
            }),
          ],
        }),

        // ─── Bahagian C ────────────────────────────────────────────────
        sectionHeading("Bahagian C: Huraian / Skop Perolehan"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: THIN_BORDER,
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  borders: THIN_BORDER,
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 80 },
                      children: [
                        new TextRun({
                          text: "{situasi}",
                          size: 20,
                          font: "Calibri",
                          color: "0f172a",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ─── Bahagian D ────────────────────────────────────────────────
        sectionHeading("Bahagian D: Syarat-Syarat Am"),
        new Paragraph({
          spacing: { before: 60, after: 40 },
          children: [
            new TextRun({
              text: "1. Sebut harga ini adalah tertakluk kepada syarat-syarat yang ditetapkan dalam Pekeliling Perbendaharaan PK 2.9.",
              size: 19,
              font: "Calibri",
              color: "374151",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: "2. Harga yang ditawarkan hendaklah mengambil kira semua kos termasuk penghantaran, pemasangan dan cukai yang berkenaan.",
              size: 19,
              font: "Calibri",
              color: "374151",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: "3. Tempoh sah laku sebut harga adalah selama 90 hari dari tarikh tutup tawaran.",
              size: 19,
              font: "Calibri",
              color: "374151",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: "4. Kerajaan tidak terikat untuk menerima sebut harga yang terendah atau mana-mana sebut harga.",
              size: 19,
              font: "Calibri",
              color: "374151",
            }),
          ],
        }),
        new Paragraph({
          spacing: { before: 40, after: 200 },
          children: [
            new TextRun({
              text: "5. Semua barangan/perkhidmatan/kerja mestilah memenuhi spesifikasi yang ditetapkan oleh Jabatan.",
              size: 19,
              font: "Calibri",
              color: "374151",
            }),
          ],
        }),

        // ─── Signatures ────────────────────────────────────────────────
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
                    new Paragraph({
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({ text: "Disediakan oleh:", bold: true, size: 20, font: "Calibri", color: "374151" }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 200, after: 60 },
                      border: { top: { style: BorderStyle.SINGLE, size: 2, color: "94a3b8" } },
                      children: [
                        new TextRun({ text: "Tandatangan & Cop Rasmi", size: 18, font: "Calibri", color: "94a3b8", italics: true }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 40, after: 80 },
                      children: [
                        new TextRun({ text: "Nama: {nama}", size: 20, font: "Calibri", color: "0f172a" }),
                      ],
                    }),
                  ],
                }),
                new TableCell({
                  borders: THIN_BORDER,
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      spacing: { before: 80, after: 20 },
                      children: [
                        new TextRun({ text: "Disahkan oleh Ketua Jabatan:", bold: true, size: 20, font: "Calibri", color: "374151" }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 200, after: 60 },
                      border: { top: { style: BorderStyle.SINGLE, size: 2, color: "94a3b8" } },
                      children: [
                        new TextRun({ text: "Tandatangan & Cop Rasmi", size: 18, font: "Calibri", color: "94a3b8", italics: true }),
                      ],
                    }),
                    new Paragraph({
                      spacing: { before: 40, after: 80 },
                      children: [
                        new TextRun({ text: "Nama: ______________________________", size: 20, font: "Calibri", color: "0f172a" }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),

        // ─── Footer note ───────────────────────────────────────────────
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 280 },
          children: [
            new TextRun({
              text: "Dokumen ini dijana secara automatik oleh Sistem Perolehan — PK 2.9",
              size: 16,
              font: "Calibri",
              color: "94a3b8",
              italics: true,
            }),
          ],
        }),
      ],
    },
  ],
});

const outPath = join(__dirname, "../../template-sebut-harga.docx");
const buffer = await Packer.toBuffer(doc);
writeFileSync(outPath, buffer);
console.log(`✅  Template created at: ${outPath}`);
console.log(`\nNext steps:`);
console.log(`  1. Go to your Supabase dashboard → Storage`);
console.log(`  2. Create a bucket named "templates" (set to public)`);
console.log(`  3. Upload the file "template-sebut-harga.docx" into that bucket`);
console.log(`  4. The app will automatically use it when generating documents\n`);

// Optional: auto-upload if SUPABASE_URL and SUPABASE_SERVICE_KEY are set
const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;
if (supabaseUrl && serviceKey) {
  console.log("🔑  Service key detected — attempting auto-upload to Supabase...");
  const supabase = createClient(supabaseUrl, serviceKey);
  const fileBuffer = readFileSync(outPath);
  const { error } = await supabase.storage
    .from("templates")
    .upload("template-sebut-harga.docx", fileBuffer, {
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    });
  if (error) {
    console.error("❌  Upload failed:", error.message);
  } else {
    console.log("✅  Template uploaded to Supabase Storage successfully!");
  }
}
