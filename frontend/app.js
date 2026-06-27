/* =====================================================
   Sistem Perolehan — Frontend
   ===================================================== */

const BACKEND_URL = "";

/* ---------- Document field configs per doc type ---------- */
const DOC_FIELDS = {
  "sebut-harga": [
    { key: "nama",         label: "Nama Pegawai Pemohon",     type: "text",  placeholder: "Nama penuh pegawai" },
    { key: "namaSyarikat", label: "Nama Jabatan / Agensi",    type: "text",  placeholder: "Contoh: Jabatan Kerja Raya Malaysia" },
    { key: "tarikh",       label: "Tarikh",                   type: "date" },
  ],
  "tawaran": [
    { key: "tajuk",          label: "Tajuk Sebut Harga",           type: "text",  placeholder: "Contoh: Pembelian Komputer Riba", fullWidth: true },
    { key: "kod_bidang_MOF", label: "Kod Bidang MOF",              type: "text",  placeholder: "Contoh: 210301" },
    { key: "no_sebut_harga", label: "No. Sebut Harga",             type: "text",  placeholder: "Contoh: SH/2026/001" },
    { key: "form_link",      label: "Pautan Borang (Google Form)", type: "url",   placeholder: "https://forms.gle/...", fullWidth: true, required: false },
    { key: "tarikh_buka_sh", label: "Tarikh Buka Sebut Harga",    type: "date" },
    { key: "tarikh_tutup_sh",label: "Tarikh Tutup Sebut Harga",   type: "date" },
    { key: "nama_pegawai",   label: "Nama Pegawai",               type: "text",  placeholder: "Nama penuh pegawai", fullWidth: true },
    { key: "no_phone",       label: "No. Telefon",                type: "tel",   placeholder: "03-XXXX XXXX" },
    { key: "email",          label: "E-mel",                      type: "email", placeholder: "pegawai@jabatan.gov.my" },
  ],
};

const VALID_CREDENTIALS = [
  { id: "admin", password: "admin123" },
  { id: "user01", password: "password" },
];

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
const submitBtn = document.getElementById("submit-btn");
const submitDefault = document.getElementById("submit-icon-default");
const submitLoading = document.getElementById("submit-icon-loading");
const entriesSection = document.getElementById("entries-section");
const entriesList = document.getElementById("entries-list");
const entriesCount = document.getElementById("entries-count");

let entries = [];
let nextId = 1;

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

  const situasi = document.getElementById("situasi-perolehan").value.trim();
  const hargaRaw = document.getElementById("harga-siling").value;
  const hargaNum = parseFloat(String(hargaRaw).replace(/,/g, ""));

  let valid = true;
  document.getElementById("err-situasi").textContent =
    situasi ? "" : (valid = false, "Sila huraikan situasi perolehan anda");
  document.getElementById("err-harga").textContent =
    !hargaRaw ? (valid = false, "Harga siling diperlukan") :
    isNaN(hargaNum) || hargaNum <= 0 ? (valid = false, "Harga siling mesti nombor positif yang sah") : "";
  if (!valid) return;

  const entryId = nextId++;
  const entry = {
    id: entryId,
    situasi,
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
    showDocForm: false,
    selectedDocType: null,
    docFormSubmitting: false,
    docFormError: "",
    docGenSuccess: false,
    docFormValues: null,
  };
  entries.unshift(entry);
  renderEntries();
  perolehanForm.reset();
  setLoading(true);

  try {
    await streamFromBackend(
      "/api/perolehan/analyze",
      { situasi, hargaSiling: hargaNum },
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
    entry.aiAnalysis = `Ralat: Tidak dapat menghubungi pelayan. Pastikan backend berjalan.`;
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
  const situasiShort = entry.situasi.length > 80
    ? entry.situasi.slice(0, 80) + "…"
    : entry.situasi;
  const showPdf = entry.aiAnalysis && !entry.errored && !entry.streaming;
  return `
    <article class="card entry-card" data-id="${entry.id}">
      <div class="entry-head">
        <div class="entry-meta">
          <div class="entry-meta-row">
            <span class="badge">#${entry.id}</span>
            <span class="entry-name">${escapeHtml(situasiShort)}</span>
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
          Pilih dokumen yang ingin dijana:
        </div>
        <div class="doc-prompt-btns">
          <button class="btn btn-doc-yes" data-action="doc-yes" data-doctype="sebut-harga" data-id="${entry.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
            Borang Sebut Harga
          </button>
          <button class="btn btn-doc-yes btn-doc-tawaran" data-action="doc-yes" data-doctype="tawaran" data-id="${entry.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Kenyataan Tawaran
          </button>
          <button class="btn btn-outline btn-sm" data-action="doc-no" data-id="${entry.id}">Tidak</button>
        </div>
      </div>`;
  }

  if (entry.showDocForm) {
    const todayStr = new Date().toISOString().split("T")[0];
    const isTawaran = entry.selectedDocType === "tawaran";
    const formTitle = isTawaran ? "Kenyataan Tawaran Sebut Harga" : "Borang Sebut Harga";
    const docFields = DOC_FIELDS[entry.selectedDocType ?? "sebut-harga"] ?? DOC_FIELDS["sebut-harga"];
    let fieldsHtml = "";
    for (const field of docFields) {
      const inputId = `doc-field-${field.key}-${entry.id}`;
      let defaultVal = "";
      if (field.type === "date") defaultVal = todayStr;
      if (field.key === "tajuk" && entry.situasi) defaultVal = entry.situasi.slice(0, 100);
      const savedVal = entry.docFormValues?.[field.key] ?? defaultVal;
      const optional = field.required === false ? ' <span class="field-optional">(pilihan)</span>' : "";
      fieldsHtml += `
            <div class="field${field.fullWidth ? " field-full" : ""}">
              <label for="${inputId}">${escapeHtml(field.label)}${optional}</label>
              <input type="${field.type ?? "text"}" id="${inputId}" placeholder="${escapeHtml(field.placeholder ?? "")}" value="${escapeHtml(savedVal)}" />
            </div>`;
    }
    html += `
      <div class="doc-form ${isTawaran ? "doc-form-tawaran" : ""}">
        <div class="doc-form-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${isTawaran ? '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' : '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>'}</svg>
          Maklumat — ${formTitle}
        </div>
        <div class="doc-form-body">
          <div class="doc-form-grid">${fieldsHtml}
          </div>
          ${entry.docFormError ? `<div class="doc-form-error">${escapeHtml(entry.docFormError)}</div>` : ""}
          <div class="doc-form-actions">
            <button class="btn btn-outline btn-sm" data-action="doc-cancel" data-id="${entry.id}" ${entry.docFormSubmitting ? "disabled" : ""}>Batal</button>
            <button class="btn btn-doc-submit" data-action="doc-submit" data-id="${entry.id}" ${entry.docFormSubmitting ? "disabled" : ""}>
              ${entry.docFormSubmitting
                ? `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.55"/></svg> Menjana...`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Jana &amp; Muat Turun (.docx)`}
            </button>
          </div>
        </div>
      </div>`;
  }

  if (entry.docGenSuccess) {
    const successLabel = entry.selectedDocType === "tawaran"
      ? "Kenyataan Tawaran Sebut Harga"
      : "Borang Sebut Harga";
    html += `
      <div class="doc-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span><strong>${successLabel}</strong> berjaya dijana dan dimuat turun.</span>
        <button class="btn btn-outline btn-sm" data-action="doc-again" data-id="${entry.id}" style="margin-left:auto;flex-shrink:0;">Jana Lagi</button>
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
    openDocForm(entry, btn.dataset.doctype ?? "sebut-harga");
  } else if (btn.dataset.action === "doc-no") {
    entry.showDocPrompt = false;
    entry.docDeclined = true;
    renderEntries();
  } else if (btn.dataset.action === "doc-again") {
    entry.docGenSuccess = false;
    entry.showDocPrompt = true;
    renderEntries();
  } else if (btn.dataset.action === "doc-cancel") {
    entry.showDocForm = false;
    entry.showDocPrompt = true;
    entry.docFormError = "";
    renderEntries();
  } else if (btn.dataset.action === "doc-submit") {
    const docType = entry.selectedDocType ?? "sebut-harga";
    const fields = DOC_FIELDS[docType] ?? DOC_FIELDS["sebut-harga"];
    const data = {};
    for (const field of fields) {
      const el = document.getElementById(`doc-field-${field.key}-${id}`);
      data[field.key] = el?.value?.trim() ?? "";
    }
    submitDocForm(entry, data);
  }
});

/* ---------- Document form ---------- */
function openDocForm(entry, docType) {
  entry.showDocPrompt = false;
  entry.showDocForm = true;
  entry.selectedDocType = docType ?? "sebut-harga";
  entry.docFormError = "";
  entry.docFormSubmitting = false;
  renderEntries();
}

async function submitDocForm(entry, data) {
  const docType = entry.selectedDocType ?? "sebut-harga";
  const fields = DOC_FIELDS[docType] ?? DOC_FIELDS["sebut-harga"];
  for (const field of fields) {
    if (field.required !== false && !data[field.key]) {
      entry.docFormError = `${field.label} diperlukan.`;
      entry.docFormValues = data;
      updateEntryBody(entry);
      return;
    }
  }

  entry.docFormValues = data;
  entry.docFormSubmitting = true;
  entry.docFormError = "";
  updateEntryBody(entry);

  try {
    const response = await fetch(`${BACKEND_URL}/api/perolehan/generate-surat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        situasi: entry.situasi,
        hargaSiling: entry.hargaSilingNum,
        docType,
        extraData: data,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: `Ralat pelayan ${response.status}` }));
      throw new Error(errData.error ?? `Ralat pelayan ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = entry.selectedDocType === "tawaran" ? "Tawaran_Sebut_Harga" : "Sebut_Harga";
    a.download = `${label}_${nama.replace(/\s+/g, "_")}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    entry.showDocForm = false;
    entry.docGenSuccess = true;
    entry.docFormSubmitting = false;
    renderEntries();
  } catch (err) {
    entry.docFormError = err.message ?? "Ralat semasa menjana dokumen.";
    entry.docFormSubmitting = false;
    updateEntryBody(entry);
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

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y, contentW, 30, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(71, 85, 105);
  doc.text("SITUASI PEROLEHAN", margin + 4, y + 7);
  doc.text("HARGA SILING", margin + contentW / 2, y + 7);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const situasiWrapped = doc.splitTextToSize(entry.situasi, (contentW / 2) - 8);
  doc.text(situasiWrapped.slice(0, 2), margin + 4, y + 14);
  doc.setFontSize(10);
  doc.text(`RM ${entry.hargaSiling}`, margin + contentW / 2, y + 14);
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tarikh: ${entry.tarikhDihantar}`, margin + 4, y + 27);
  y += 38;

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
  doc.save(`Panduan_Perolehan_${entry.id}.pdf`);
}
