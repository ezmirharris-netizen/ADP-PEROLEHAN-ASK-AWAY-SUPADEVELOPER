/* =====================================================
   Sistem Perolehan — Frontend
   Connects to the Express backend (see ../backend/).
   ===================================================== */

// >>>>>>>>  CONFIGURE: URL of your running backend  <<<<<<<<
const BACKEND_URL = "http://localhost:3001";
// >>>>>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

const VALID_CREDENTIALS = [
  { id: "admin", password: "admin123" },
  { id: "user01", password: "password" },
];

const JENIS_LABEL = {
  bekalan: "Bekalan",
  perkhidmatan: "Perkhidmatan",
  kerja: "Kerja",
};

/* ---------- View routing ---------- */
const viewLogin = document.getElementById("view-login");
const viewPerolehan = document.getElementById("view-perolehan");

function showLogin() {
  viewLogin.classList.remove("hidden");
  viewPerolehan.classList.add("hidden");
}
function showPerolehan() {
  viewLogin.classList.add("hidden");
  viewPerolehan.classList.remove("hidden");
  document.getElementById("welcome-user").textContent =
    sessionStorage.getItem("userId") || "Pengguna";
}

if (sessionStorage.getItem("loggedIn") === "true") {
  showPerolehan();
} else {
  showLogin();
}

/* ---------- Login ---------- */
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  loginError.classList.add("hidden");
  loginError.textContent = "";

  const id = document.getElementById("login-id").value.trim();
  const password = document.getElementById("login-password").value;

  document.getElementById("err-login-id").textContent = id ? "" : "ID pengguna diperlukan";
  document.getElementById("err-login-password").textContent = password ? "" : "Kata laluan diperlukan";
  if (!id || !password) return;

  const ok = VALID_CREDENTIALS.find((c) => c.id === id && c.password === password);
  if (ok) {
    sessionStorage.setItem("loggedIn", "true");
    sessionStorage.setItem("userId", id);
    loginForm.reset();
    showPerolehan();
  } else {
    loginError.textContent = "ID pengguna atau kata laluan tidak sah. Sila cuba lagi.";
    loginError.classList.remove("hidden");
  }
});

/* ---------- Logout ---------- */
document.getElementById("logout-btn").addEventListener("click", () => {
  sessionStorage.removeItem("loggedIn");
  sessionStorage.removeItem("userId");
  showLogin();
});

/* ---------- Perolehan form ---------- */
const perolehanForm = document.getElementById("perolehan-form");
const jenisSelect = document.getElementById("jenis-perolehan");
const fieldJenisKerja = document.getElementById("field-jenis-kerja");
const submitBtn = document.getElementById("submit-btn");
const submitDefault = document.getElementById("submit-icon-default");
const submitLoading = document.getElementById("submit-icon-loading");
const entriesSection = document.getElementById("entries-section");
const entriesList = document.getElementById("entries-list");
const entriesCount = document.getElementById("entries-count");

let entries = [];
let nextId = 1;

jenisSelect.addEventListener("change", () => {
  if (jenisSelect.value === "kerja") {
    fieldJenisKerja.classList.remove("hidden");
  } else {
    fieldJenisKerja.classList.add("hidden");
    document.getElementById("jenis-kerja").value = "";
    document.getElementById("err-jenis-kerja").textContent = "";
  }
});

function formatCurrency(num) {
  return num.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function setLoading(on) {
  submitBtn.disabled = on;
  submitDefault.classList.toggle("hidden", on);
  submitLoading.classList.toggle("hidden", !on);
}

/* ---------- SSE streaming helper ---------- */
async function streamFromBackend(endpoint, body, onChunk, onDone, onError) {
  const response = await fetch(`${BACKEND_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok || !response.body) {
    const errText = await response.text().catch(() => "");
    throw new Error(`Server ${response.status}: ${errText.slice(0, 200)}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      try {
        const data = JSON.parse(trimmed.slice(5).trim());
        if (data.error) { onError(data.error); return; }
        if (data.done)  { onDone(); return; }
        if (data.content) onChunk(data.content);
      } catch {}
    }
  }
  onDone();
}

/* ---------- Submit ---------- */
perolehanForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const jenis = jenisSelect.value;
  const jenisKerja = document.getElementById("jenis-kerja").value.trim();
  const hargaRaw = document.getElementById("harga-siling").value;
  const hargaNum = parseFloat(String(hargaRaw).replace(/,/g, ""));

  let valid = true;
  document.getElementById("err-jenis").textContent = jenis ? "" : (valid = false, "Jenis perolehan diperlukan");
  if (jenis === "kerja") {
    document.getElementById("err-jenis-kerja").textContent =
      jenisKerja ? "" : (valid = false, "Jenis kerja diperlukan");
  }
  document.getElementById("err-harga").textContent =
    !hargaRaw ? (valid = false, "Harga siling diperlukan") :
    isNaN(hargaNum) || hargaNum <= 0 ? (valid = false, "Harga siling mesti nombor positif yang sah") : "";
  if (!valid) return;

  const entryId = nextId++;
  const entry = {
    id: entryId,
    jenisPerolehan: jenis,
    jenisKerja: jenis === "kerja" ? jenisKerja : undefined,
    hargaSiling: formatCurrency(hargaNum),
    hargaSilingNum: hargaNum,
    tarikhDihantar: new Date().toLocaleString("ms-MY", {
      day: "2-digit", month: "long", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }),
    aiAnalysis: "",
    showAI: true,
    streaming: true,
    errored: false,
    showDocPrompt: false,
    docContent: undefined,
    docStreaming: false,
    docDeclined: false,
  };
  entries.unshift(entry);
  renderEntries();
  perolehanForm.reset();
  fieldJenisKerja.classList.add("hidden");
  setLoading(true);

  try {
    await streamFromBackend(
      "/api/perolehan/analyze",
      { jenisPerolehan: jenis, jenisKerja: entry.jenisKerja, hargaSiling: hargaNum },
      (chunk) => {
        entry.aiAnalysis += chunk;
        updateEntryBody(entry);
      },
      () => {},
      (errMsg) => {
        entry.aiAnalysis = `Ralat: ${errMsg}`;
        entry.errored = true;
        updateEntryBody(entry);
      }
    );
  } catch (err) {
    entry.aiAnalysis = `Ralat: Tidak dapat menghubungi pelayan. Pastikan backend berjalan di ${BACKEND_URL}`;
    entry.errored = true;
    updateEntryBody(entry);
  } finally {
    entry.streaming = false;
    setLoading(false);
    if (entry.aiAnalysis && !entry.errored) {
      entry.showDocPrompt = true;
    }
    renderEntries();
  }
});

/* ---------- Entry rendering ---------- */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function renderInline(text) {
  return escapeHtml(text)
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}
function stripMd(s) {
  return s
    .replace(/\*\*\*(.+?)\*\*\*/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1");
}

function renderMarkdown(text) {
  const lines = text.split("\n");
  let html = "";
  let listBuffer = [];
  let listOrdered = false;

  const flushList = () => {
    if (!listBuffer.length) return;
    const tag = listOrdered ? "ol" : "ul";
    html += `<${tag}>` + listBuffer.map((it) => `<li>${it}</li>`).join("") + `</${tag}>`;
    listBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,2}\s/.test(line)) {
      flushList();
      html += `<h3>${escapeHtml(line.replace(/^#{1,2}\s+/, ""))}</h3>`;
    } else if (/^#{3,6}\s/.test(line)) {
      flushList();
      html += `<p class="subheading">${escapeHtml(line.replace(/^#{3,6}\s+/, ""))}</p>`;
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (listBuffer.length && !listOrdered) flushList();
      listOrdered = true;
      listBuffer.push(renderInline(trimmed.replace(/^\d+\.\s+/, "")));
    } else if (/^[-*]\s/.test(trimmed)) {
      if (listBuffer.length && listOrdered) flushList();
      listOrdered = false;
      listBuffer.push(renderInline(trimmed.replace(/^[-*]\s+/, "")));
    } else if (trimmed === "") {
      flushList();
    } else if (trimmed) {
      flushList();
      const cleaned = trimmed.replace(/^\*\*(.+)\*\*$/, "$1");
      html += `<p>${renderInline(cleaned)}</p>`;
    }
  }
  flushList();
  return html;
}

function entryCardHtml(entry) {
  const jenisLabel = JENIS_LABEL[entry.jenisPerolehan] || entry.jenisPerolehan;
  const subname = entry.jenisKerja ? `<span class="entry-subname">— ${escapeHtml(entry.jenisKerja)}</span>` : "";
  const showPdf = entry.aiAnalysis && !entry.errored && !entry.streaming;
  return `
    <article class="card entry-card" data-id="${entry.id}">
      <div class="entry-head">
        <div class="entry-meta">
          <div class="entry-meta-row">
            <span class="badge">#${entry.id}</span>
            <span class="entry-name">${escapeHtml(jenisLabel)}</span>
            ${subname}
            <span class="badge badge-primary">RM ${escapeHtml(entry.hargaSiling)}</span>
          </div>
          <p class="entry-date">${escapeHtml(entry.tarikhDihantar)}</p>
        </div>
        <div class="entry-actions">
          <button class="btn btn-ghost" data-action="toggle" data-id="${entry.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/></svg>
            Panduan AI
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${entry.showAI ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>'}</svg>
          </button>
          ${showPdf ? `
            <button class="btn btn-ghost btn-ghost-pdf" data-action="pdf" data-id="${entry.id}" title="Eksport sebagai PDF">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              PDF
            </button>` : ""}
          <button class="btn btn-ghost btn-ghost-danger" data-action="delete" data-id="${entry.id}" title="Padam">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </div>
      ${entry.showAI ? `<div class="entry-body" data-body="${entry.id}">${entryBodyHtml(entry)}</div>` : ""}
    </article>
  `;
}

function entryBodyHtml(entry) {
  let html = "";

  if (!entry.aiAnalysis && entry.streaming) {
    html += `<div class="md"><p class="muted small streaming-cursor">Menjana panduan AI</p></div>`;
  } else if (entry.errored) {
    html += `<div class="md"><p style="color:#b91c1c;">${escapeHtml(entry.aiAnalysis)}</p></div>`;
  } else {
    const md = renderMarkdown(entry.aiAnalysis || "");
    html += `<div class="md">${md}${entry.streaming ? '<span class="streaming-cursor"></span>' : ""}</div>`;
  }

  if (entry.showDocPrompt) {
    html += `
      <div class="doc-prompt-banner">
        <div class="doc-prompt-question">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/></svg>
          Adakah anda mahukan pertolongan saya menghasilkan dokumen sebut harga?
        </div>
        <div class="doc-prompt-btns">
          <button class="btn btn-doc-yes" data-action="doc-yes" data-id="${entry.id}">Ya</button>
          <button class="btn btn-outline btn-sm" data-action="doc-no" data-id="${entry.id}">Tidak</button>
        </div>
      </div>`;
  }

  if (entry.docContent !== undefined || entry.docStreaming) {
    const docMd = entry.docContent ? renderMarkdown(entry.docContent) : "";
    html += `
      <div class="doc-section">
        <div class="doc-section-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
          Draf Dokumen Sebut Harga
          ${entry.docStreaming ? '<span class="streaming-cursor"></span>' : ""}
        </div>
        <div class="doc-section-body">
          ${entry.docStreaming && !entry.docContent
            ? `<p class="muted small streaming-cursor">Menjana dokumen sebut harga</p>`
            : `<div class="md">${docMd}</div>`}
        </div>
      </div>`;
  }

  return html;
}

function updateEntryBody(entry) {
  const el = entriesList.querySelector(`[data-body="${entry.id}"]`);
  if (el) el.innerHTML = entryBodyHtml(entry);
}

function renderEntries() {
  entriesCount.textContent = entries.length;
  if (entries.length === 0) {
    entriesSection.classList.add("hidden");
    entriesList.innerHTML = "";
    return;
  }
  entriesSection.classList.remove("hidden");
  entriesList.innerHTML = entries.map(entryCardHtml).join("");
}

entriesList.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = parseInt(btn.dataset.id, 10);
  const entry = entries.find((x) => x.id === id);
  if (!entry) return;

  if (btn.dataset.action === "toggle") {
    entry.showAI = !entry.showAI;
    renderEntries();
  } else if (btn.dataset.action === "delete") {
    entries = entries.filter((x) => x.id !== id);
    renderEntries();
  } else if (btn.dataset.action === "pdf") {
    exportToPdf(entry);
  } else if (btn.dataset.action === "doc-yes") {
    generateDocument(entry);
  } else if (btn.dataset.action === "doc-no") {
    entry.showDocPrompt = false;
    entry.docDeclined = true;
    renderEntries();
  }
});

/* ---------- Document generation ---------- */
async function generateDocument(entry) {
  entry.showDocPrompt = false;
  entry.docContent = "";
  entry.docStreaming = true;
  renderEntries();

  try {
    await streamFromBackend(
      "/api/perolehan/generate-doc",
      { jenisPerolehan: entry.jenisPerolehan, jenisKerja: entry.jenisKerja, hargaSiling: entry.hargaSilingNum },
      (chunk) => {
        entry.docContent += chunk;
        const bodyEl = entriesList.querySelector(`[data-body="${entry.id}"]`);
        if (bodyEl) bodyEl.innerHTML = entryBodyHtml(entry);
      },
      () => {},
      (errMsg) => {
        entry.docContent = `Ralat: ${errMsg}`;
      }
    );
  } catch (err) {
    entry.docContent = `Ralat: Tidak dapat menghubungi pelayan. Pastikan backend berjalan di ${BACKEND_URL}`;
  } finally {
    entry.docStreaming = false;
    renderEntries();
  }
}

/* ---------- PDF export ---------- */
function exportToPdf(entry) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;
  let y = margin;

  const drawFooter = () => {
    const total = doc.internal.pages.length - 1;
    const current = doc.getCurrentPageInfo().pageNumber;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text("Sistem Perolehan — Panduan AI berdasarkan PK 2.9", margin, pageH - 10);
    doc.text(`Halaman ${current} / ${total}`, pageW - margin, pageH - 10, { align: "right" });
    doc.setTextColor(0);
  };
  const addPageIfNeeded = (needed) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
      drawFooter();
    }
  };

  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PANDUAN PEROLEHAN AI", margin, 12);
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.text("Sistem Perolehan  |  Berdasarkan Pekeliling Perbendaharaan PK 2.9", margin, 20);
  doc.setTextColor(0);
  y = 36;

  const metaH = entry.jenisKerja ? 30 : 24;
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentW, metaH, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("JENIS PEROLEHAN", margin + 4, y + 7);
  doc.text("HARGA SILING", margin + contentW / 2, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(JENIS_LABEL[entry.jenisPerolehan] || entry.jenisPerolehan, margin + 4, y + 14);
  doc.text(`RM ${entry.hargaSiling}`, margin + contentW / 2, y + 14);
  if (entry.jenisKerja) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(71, 85, 105);
    doc.text("JENIS KERJA", margin + 4, y + 21);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(entry.jenisKerja, margin + 4, y + 27);
  }
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tarikh: ${entry.tarikhDihantar}`, margin + 4, y + (entry.jenisKerja ? 35 : 21));
  y += entry.jenisKerja ? 40 : 30;

  doc.setDrawColor(203, 213, 225);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  const lines = entry.aiAnalysis.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#{1,2}\s/.test(line)) {
      addPageIfNeeded(14);
      if (y > margin + 42) y += 3;
      const heading = line.replace(/^#{1,2}\s+/, "");
      doc.setFillColor(239, 246, 255);
      doc.rect(margin, y - 4, contentW, 9, "F");
      doc.setDrawColor(147, 197, 253);
      doc.rect(margin, y - 4, 2.5, 9, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text(stripMd(heading), margin + 5, y + 2);
      doc.setTextColor(0);
      y += 11;
    } else if (/^#{3,6}\s/.test(line)) {
      addPageIfNeeded(10);
      y += 2;
      const heading = line.replace(/^#{3,6}\s+/, "");
      doc.setFontSize(9.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text(stripMd(heading), margin, y);
      doc.setTextColor(0);
      y += 6;
    } else if (/^\d+\.\s/.test(trimmed)) {
      const num = (trimmed.match(/^(\d+)\./) || [])[1] || "•";
      const content = stripMd(trimmed.replace(/^\d+\.\s+/, ""));
      const wrapped = doc.splitTextToSize(content, contentW - 12);
      addPageIfNeeded(wrapped.length * 5 + 2);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text(`${num}.`, margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(wrapped, margin + 9, y);
      y += wrapped.length * 5 + 1;
    } else if (/^[-*]\s/.test(trimmed)) {
      const content = stripMd(trimmed.replace(/^[-*]\s+/, ""));
      const wrapped = doc.splitTextToSize(content, contentW - 10);
      addPageIfNeeded(wrapped.length * 5 + 2);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 64, 175);
      doc.text("•", margin + 2, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(wrapped, margin + 8, y);
      y += wrapped.length * 5 + 1;
    } else if (trimmed === "") {
      y += 2;
    } else if (trimmed) {
      const content = stripMd(trimmed.replace(/^\*\*(.+)\*\*$/, "$1"));
      const wrapped = doc.splitTextToSize(content, contentW);
      addPageIfNeeded(wrapped.length * 5 + 2);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5 + 1;
    }
  }

  drawFooter();
  const label = (JENIS_LABEL[entry.jenisPerolehan] || entry.jenisPerolehan).replace(/\s/g, "_");
  doc.save(`Panduan_Perolehan_${label}_${entry.id}.pdf`);
}
