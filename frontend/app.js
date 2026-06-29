/* =====================================================
   Sistem Perolehan — Frontend
   ===================================================== */

const BACKEND_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : window.location.origin;

/* ---------- Document field configs per doc type ---------- */
const DOC_FIELDS = {
  "tawaran": [
    { key: "Tajuk",               label: "Tajuk Sebut Harga",             type: "text",  placeholder: "Contoh: Pembelian Komputer Riba", fullWidth: true },
    { key: "No_Siri",             label: "No. Siri",                      type: "text",  placeholder: "Contoh: 001" },
    { key: "No_SH",               label: "No. Sebut Harga",               type: "text",  placeholder: "Contoh: SH/2026/001" },
    { key: "KOD_MOF",             label: "Kod Bidang MOF",                type: "text",  placeholder: "Contoh: 210301" },
    { key: "link_Gform",          label: "Pautan Google Form",            type: "url",   placeholder: "https://forms.gle/...", fullWidth: true, required: false },
    { key: "Tarikh_buka_SH",      label: "Tarikh Buka Sebut Harga",       type: "date" },
    { key: "Tarikh_tutup_SH",     label: "Tarikh Tutup Sebut Harga",      type: "date" },
    { key: "Masa_tutup",          label: "Masa Tutup",                    type: "time",  placeholder: "Contoh: 12:00 PM" },
    { key: "Nama_Pegawai",        label: "Nama Pegawai",                  type: "text",  placeholder: "Nama penuh pegawai", fullWidth: true },
    { key: "No_Phone",            label: "No. Telefon",                   type: "tel",   placeholder: "03-XXXX XXXX" },
    { key: "Email_Pegawai",       label: "E-mel Pegawai",                 type: "email", placeholder: "pegawai@jabatan.gov.my" },
    { key: "SENARAI_SPESIFIKASI", label: "Senarai Spesifikasi (DOCX)",    type: "file",  accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document", fullWidth: true },
    { key: "Jadual_Tawaran_Harga",label: "Jadual Tawaran Harga (DOCX)",   type: "file",  accept: ".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document", fullWidth: true },
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

/* ---------- Sidebar navigation ---------- */
const navItems = document.querySelectorAll(".nav-item");
const pageAnalisis = document.getElementById("page-analisis");
const pageRekod = document.getElementById("page-rekod");

function showPage(name) {
  navItems.forEach((btn) => btn.classList.toggle("active", btn.dataset.page === name));
  pageAnalisis.classList.toggle("hidden", name !== "analisis");
  pageRekod.classList.toggle("hidden", name !== "rekod");
  if (name === "rekod") fetchRekod();
}

navItems.forEach((btn) => {
  btn.addEventListener("click", () => showPage(btn.dataset.page));
});

document.getElementById("rekod-refresh-btn").addEventListener("click", fetchRekod);

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
    chatMessages: [],
    chatStreaming: false,
    showChat: true,
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
      // Auto-save to persistent history
      const userId = sessionStorage.getItem("userId") || "unknown";
      fetch(`${BACKEND_URL}/api/rekod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          situasi: entry.situasi,
          hargaSilingNum: entry.hargaSilingNum,
          hargaSilingFmt: entry.hargaSiling,
          analisisAi: entry.aiAnalysis,
          tarikh: entry.tarikhDihantar,
        }),
      }).catch((err) => console.warn("[rekod] Auto-save failed:", err.message));
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
          Jana dokumen untuk perolehan ini?
        </div>
        <div class="doc-prompt-btns">
          <button class="btn btn-doc-yes btn-doc-tawaran" data-action="doc-yes" data-doctype="tawaran" data-id="${entry.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Borang Sebut Harga
          </button>
          <button class="btn btn-outline btn-sm" data-action="doc-no" data-id="${entry.id}">Tidak</button>
        </div>
      </div>`;
  }

  if (entry.showDocForm) {
    const formTitle = "Kenyataan Tawaran Sebut Harga";
    const docFields = DOC_FIELDS[entry.selectedDocType ?? "tawaran"] ?? DOC_FIELDS["tawaran"];
    let fieldsHtml = "";
    for (const field of docFields) {
      const inputId = `doc-field-${field.key}-${entry.id}`;
      const savedVal = entry.docFormValues?.[field.key] ?? "";
      const optional = field.required === false ? ' <span class="field-optional">(pilihan)</span>' : "";
      const isFile = field.type === "file";
      const savedFileName = isFile ? (entry.docFormValues?.[field.key + "__name"] ?? "") : "";
      fieldsHtml += `
            <div class="field${field.fullWidth ? " field-full" : ""}">
              <label for="${inputId}">${escapeHtml(field.label)}${optional}</label>
              ${isFile
                ? `<div class="file-upload-wrap">
                    <label class="file-upload-label" for="${inputId}">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                      ${savedFileName ? escapeHtml(savedFileName) : "Pilih fail DOCX..."}
                    </label>
                    <input type="file" id="${inputId}" accept="${escapeHtml(field.accept ?? ".docx")}" style="display:none;" onchange="this.previousElementSibling.textContent=this.files[0]?.name??'Pilih fail DOCX...'" />
                  </div>`
                : `<input type="${field.type ?? "text"}" id="${inputId}" placeholder="${escapeHtml(field.placeholder ?? "")}" value="${escapeHtml(savedVal)}" />`}
            </div>`;
    }
    html += `
      <div class="doc-form doc-form-tawaran">
        <div class="doc-form-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
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
    const successLabel = "Kenyataan Tawaran Sebut Harga";
    html += `
      <div class="doc-success">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span><strong>${successLabel}</strong> berjaya dijana dan dimuat turun.</span>
        <button class="btn btn-outline btn-sm" data-action="doc-again" data-id="${entry.id}" style="margin-left:auto;flex-shrink:0;">Jana Lagi</button>
      </div>`;

    if (!entry.sstDismissed) {
      html += `
      <div class="sst-suggestion">
        <div class="sst-suggestion-left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <div>
            <div class="sst-suggestion-title">Langkah Seterusnya</div>
            <div class="sst-suggestion-desc">Adakah anda ingin sistem membantu menjana <strong>Surat Setuju Terima</strong>?</div>
          </div>
        </div>
        <div class="sst-suggestion-btns">
          <button class="btn btn-sst-yes" data-action="sst-yes" data-id="${entry.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Ya, Jana Sekarang
          </button>
          <button class="btn btn-outline btn-sm" data-action="sst-no" data-id="${entry.id}">Tidak</button>
        </div>
      </div>`;
    }

    if (entry.sstAccepted) {
      html += `
      <div class="sst-accepted">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        Baik! Sila isi maklumat di bawah untuk menjana <strong>Surat Setuju Terima</strong>.
      </div>`;
    }
  }

  // Chat section — show after analysis completes
  if (entry.aiAnalysis && !entry.errored && !entry.streaming) {
    html += chatSectionHtml(entry);
  }

  return html;
}

function chatSectionHtml(entry) {
  const messagesHtml = entry.chatMessages.map((msg) => {
    if (msg.role === "user") {
      return `<div class="chat-msg chat-msg-user"><div class="chat-bubble chat-bubble-user">${escapeHtml(msg.content)}</div></div>`;
    }
    return `<div class="chat-msg chat-msg-ai"><div class="chat-avatar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5z"/></svg></div><div class="chat-bubble chat-bubble-ai">${renderMarkdown(msg.content)}${msg.streaming ? '<span class="streaming-cursor"></span>' : ""}</div></div>`;
  }).join("");

  const isStreaming = entry.chatStreaming;

  return `
    <div class="chat-section" id="chat-${entry.id}">
      <button class="chat-toggle" data-action="chat-toggle" data-id="${entry.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        Tanya Soalan Susulan
        <svg class="chat-toggle-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${entry.showChat ? '<polyline points="18 15 12 9 6 15"/>' : '<polyline points="6 9 12 15 18 9"/>'}</svg>
      </button>

      ${entry.showChat ? `
        <div class="chat-body">
          ${entry.chatMessages.length === 0 ? `
            <div class="chat-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Tanya apa-apa soalan berkaitan analisis perolehan ini
            </div>
          ` : `<div class="chat-messages" id="chat-messages-${entry.id}">${messagesHtml}</div>`}

          <div class="chat-input-row">
            <textarea
              class="chat-input"
              id="chat-input-${entry.id}"
              placeholder="Contoh: Berapa ramai pembekal yang perlu dijemput?"
              rows="2"
              ${isStreaming ? "disabled" : ""}
              onkeydown="chatKeydown(event, ${entry.id})"
            ></textarea>
            <button class="chat-send-btn" data-action="chat-send" data-id="${entry.id}" ${isStreaming ? "disabled" : ""}>
              ${isStreaming
                ? `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.55"/></svg>`
                : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`}
            </button>
          </div>
        </div>
      ` : ""}
    </div>`;
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
    openDocForm(entry, btn.dataset.doctype ?? "tawaran");
  } else if (btn.dataset.action === "doc-no") {
    entry.showDocPrompt = false;
    entry.docDeclined = true;
    renderEntries();
  } else if (btn.dataset.action === "sst-yes") {
    entry.sstDismissed = true;
    entry.sstAccepted = true;
    renderEntries();
  } else if (btn.dataset.action === "sst-no") {
    entry.sstDismissed = true;
    renderEntries();
  } else if (btn.dataset.action === "chat-toggle") {
    entry.showChat = !entry.showChat;
    updateEntryBody(entry);
  } else if (btn.dataset.action === "chat-send") {
    const input = document.getElementById(`chat-input-${id}`);
    const question = input?.value?.trim();
    if (question && !entry.chatStreaming) sendChatMessage(entry, question);
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
    const docType = entry.selectedDocType ?? "tawaran";
    const fields = DOC_FIELDS[docType] ?? DOC_FIELDS["tawaran"];
    const data = {};
    const files = {};
    for (const field of fields) {
      const el = document.getElementById(`doc-field-${field.key}-${id}`);
      if (field.type === "file") {
        const file = el?.files?.[0] ?? null;
        files[field.key] = file;
        data[field.key] = file?.name ?? "";
      } else {
        data[field.key] = el?.value?.trim() ?? "";
      }
    }
    submitDocForm(entry, data, files);
  }
});

/* ---------- Chat ---------- */
window.chatKeydown = function(e, entryId) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    const entry = entries.find((x) => x.id === entryId);
    const input = document.getElementById(`chat-input-${entryId}`);
    const question = input?.value?.trim();
    if (entry && question && !entry.chatStreaming) sendChatMessage(entry, question);
  }
};

async function sendChatMessage(entry, question) {
  entry.showChat = true;
  entry.chatStreaming = true;

  // Clear input
  const inputEl = document.getElementById(`chat-input-${entry.id}`);
  if (inputEl) inputEl.value = "";

  // Add user message
  entry.chatMessages.push({ role: "user", content: question });

  // Add placeholder AI message (streaming)
  const aiMsg = { role: "assistant", content: "", streaming: true };
  entry.chatMessages.push(aiMsg);
  updateEntryBody(entry);
  scrollChatToBottom(entry.id);

  try {
    await streamFromBackend(
      "/api/perolehan/chat",
      {
        situasi: entry.situasi,
        hargaSiling: entry.hargaSilingNum,
        messages: entry.chatMessages
          .filter((m) => !m.streaming)
          .slice(0, -1)
          .map((m) => ({ role: m.role, content: m.content })),
        question,
      },
      (chunk) => {
        aiMsg.content += chunk;
        updateEntryBody(entry);
        scrollChatToBottom(entry.id);
      },
      () => {},
      (errMsg) => {
        aiMsg.content = `Ralat: ${errMsg}`;
      }
    );
  } catch {
    aiMsg.content = "Ralat: Tidak dapat menghubungi pelayan.";
  } finally {
    aiMsg.streaming = false;
    entry.chatStreaming = false;
    updateEntryBody(entry);
    scrollChatToBottom(entry.id);
  }
}

function scrollChatToBottom(entryId) {
  requestAnimationFrame(() => {
    const el = document.getElementById(`chat-messages-${entryId}`);
    if (el) el.scrollTop = el.scrollHeight;
  });
}

/* ---------- Document form ---------- */
function openDocForm(entry, docType) {
  entry.showDocPrompt = false;
  entry.showDocForm = true;
  entry.selectedDocType = docType ?? "tawaran";
  entry.docFormError = "";
  entry.docFormSubmitting = false;
  renderEntries();
}

async function submitDocForm(entry, data, files = {}) {
  const docType = entry.selectedDocType ?? "tawaran";
  const fields = DOC_FIELDS[docType] ?? DOC_FIELDS["tawaran"];
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
    const hasFiles = Object.values(files).some((f) => f instanceof File);
    let response;

    if (hasFiles) {
      const formData = new FormData();
      formData.append("situasi", entry.situasi);
      formData.append("hargaSiling", String(entry.hargaSilingNum));
      formData.append("docType", docType);
      for (const field of fields) {
        if (field.type === "file") {
          if (files[field.key] instanceof File) {
            formData.append(`file_${field.key}`, files[field.key]);
          }
        } else {
          formData.append(`extra_${field.key}`, data[field.key] ?? "");
        }
      }
      response = await fetch(`${BACKEND_URL}/api/perolehan/generate-surat`, {
        method: "POST",
        body: formData,
      });
    } else {
      response = await fetch(`${BACKEND_URL}/api/perolehan/generate-surat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          situasi: entry.situasi,
          hargaSiling: entry.hargaSilingNum,
          docType,
          extraData: data,
        }),
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: `Ralat pelayan ${response.status}` }));
      throw new Error(errData.error ?? `Ralat pelayan ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const label = "Tawaran_Sebut_Harga";
    const pegawai = (data["Nama_Pegawai"] ?? data["nama_pegawai"] ?? data["nama"] ?? "dokumen").replace(/\s+/g, "_");
    a.download = `${label}_${pegawai}.docx`;
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

/* ---------- Rekod Perolehan page ---------- */
let rekodOpenIds = new Set();

async function fetchRekod() {
  const userId = sessionStorage.getItem("userId") || "unknown";
  const rekodList = document.getElementById("rekod-list");
  rekodList.innerHTML = `<div class="rekod-loading">
    <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M21 12a9 9 0 1 1-6.2-8.55"/></svg>
    Memuatkan rekod...
  </div>`;
  try {
    const res = await fetch(`${BACKEND_URL}/api/rekod?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();
    renderRekod(rows);
  } catch (err) {
    rekodList.innerHTML = `<div class="rekod-error">Gagal memuatkan rekod: ${escapeHtml(err.message)}</div>`;
  }
}

function renderRekod(rows) {
  const rekodList = document.getElementById("rekod-list");
  if (!rows || rows.length === 0) {
    rekodList.innerHTML = `<div class="rekod-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
      <p>Tiada rekod perolehan lagi.<br>Mulakan analisis baharu di menu <strong>Analisis Perolehan</strong>.</p>
    </div>`;
    return;
  }

  rekodList.innerHTML = rows.map((row) => {
    const isOpen = rekodOpenIds.has(row.id);
    const situasiShort = (row.situasi || "").length > 120 ? row.situasi.slice(0, 120) + "…" : row.situasi;
    return `<div class="rekod-card" data-rekod-id="${row.id}">
      <div class="rekod-card-header">
        <div class="rekod-card-meta">
          <div class="rekod-card-situasi" title="${escapeHtml(row.situasi)}">${escapeHtml(situasiShort)}</div>
          <div class="rekod-card-pills">
            <span class="rekod-pill rekod-pill-green">RM ${escapeHtml(row.harga_siling_fmt)}</span>
            <span class="rekod-pill rekod-pill-gray">${escapeHtml(row.tarikh)}</span>
          </div>
        </div>
        <div class="rekod-card-actions">
          <button class="btn btn-ghost btn-ghost-pdf btn-sm" onclick="exportRekodPdf(${row.id})" title="Muat Turun PDF">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
            PDF
          </button>
          <button class="btn btn-ghost btn-ghost-danger btn-sm" onclick="deleteRekod(${row.id})" title="Padam">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
          </button>
          <button class="btn btn-ghost btn-sm" onclick="toggleRekodBody(${row.id})" title="${isOpen ? 'Tutup' : 'Lihat Analisis'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${isOpen ? '180deg' : '0deg'});transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg>
            ${isOpen ? "Tutup" : "Lihat"}
          </button>
        </div>
      </div>
      <div class="rekod-card-body ${isOpen ? 'open' : ''}">
        <div class="rekod-ai-text">${renderMarkdown(row.analisis_ai || "")}</div>
      </div>
    </div>`;
  }).join("");

  // Store rows for PDF use
  window._rekodRows = rows;
}

function toggleRekodBody(id) {
  if (rekodOpenIds.has(id)) rekodOpenIds.delete(id);
  else rekodOpenIds.add(id);
  renderRekod(window._rekodRows || []);
}

function exportRekodPdf(id) {
  const rows = window._rekodRows || [];
  const row = rows.find((r) => r.id === id);
  if (!row) return;
  const entry = {
    id: row.id,
    situasi: row.situasi,
    hargaSiling: row.harga_siling_fmt,
    hargaSilingNum: parseFloat(row.harga_siling_num),
    tarikhDihantar: row.tarikh,
    aiAnalysis: row.analisis_ai,
  };
  exportToPdf(entry);
}

async function deleteRekod(id) {
  if (!confirm("Padam rekod ini?")) return;
  const userId = sessionStorage.getItem("userId") || "unknown";
  try {
    await fetch(`${BACKEND_URL}/api/rekod/${id}?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
    rekodOpenIds.delete(id);
    fetchRekod();
  } catch (err) {
    alert("Gagal memadam rekod.");
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
