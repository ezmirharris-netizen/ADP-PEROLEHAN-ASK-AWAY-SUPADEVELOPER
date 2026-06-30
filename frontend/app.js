/* =====================================================
   Sistem Perolehan — Frontend
   ===================================================== */

const BACKEND_URL = window.location.hostname === "localhost" 
  ? "http://localhost:3001" 
  : window.location.origin;

/* ---------- Document field configs per doc type ---------- */
/* ---------- SST field configs ---------- */
const SST_FIELDS_BASE = [
  { key: "NO_SST",           label: "No. Rujukan SST",           type: "text", placeholder: "Contoh: SST/2026/001" },
  { key: "No_SST",           label: "No. SST (dalam surat)",     type: "text", placeholder: "Contoh: SST/2026/001" },
  { key: "Nama_Syarikat",    label: "Nama Syarikat",             type: "text", placeholder: "Nama syarikat pembekal", fullWidth: true },
  { key: "Alamat_Syarikat",  label: "Alamat Syarikat",           type: "text", placeholder: "Alamat penuh syarikat", fullWidth: true },
  { key: "No_Pendaftaran",   label: "No. Pendaftaran Syarikat",  type: "text", placeholder: "Contoh: ROC/SSM No." },
  { key: "Jenis_Perolehan",  label: "Jenis Perolehan",           type: "text", placeholder: "Bekalan / Perkhidmatan / Kerja" },
  { key: "Tajuk",            label: "Tajuk Perolehan",           type: "text", placeholder: "Tajuk lengkap perolehan", fullWidth: true },
  { key: "Harga",            label: "Harga Tawaran (RM)",        type: "text", placeholder: "Contoh: RM 10,000.00" },
  { key: "Tempoh_Sah_Laku",  label: "Tempoh Sah Laku",          type: "text", placeholder: "Contoh: 90 hari" },
  { key: "Harga_SH",         label: "Harga Sebut Harga (RM)",   type: "text", placeholder: "Contoh: RM 10,000.00" },
  { key: "Peruntukan_Cukai_P", label: "Peruntukan Cukai (%)",   type: "text", placeholder: "Contoh: 6%" },
  { key: "Fi_khidmat",       label: "Fi Khidmat (RM)",          type: "text", placeholder: "Contoh: RM 500.00" },
  { key: "Harga_K",          label: "Harga Kontrak (RM)",       type: "text", placeholder: "Contoh: RM 10,600.00" },
  { key: "Tempoh_K",         label: "Tempoh Kontrak",           type: "text", placeholder: "Contoh: 12 bulan" },
  { key: "Tarikh_Mula_K",    label: "Tarikh Mula Kontrak",      type: "date" },
  { key: "Tarikh_Tamat_K",   label: "Tarikh Tamat Kontrak",     type: "date" },
  { key: "Kadar_Bon",        label: "Kadar Bon Pelaksanaan (%)", type: "text", placeholder: "Contoh: 5%" },
  { key: "Nilai_Bon",        label: "Nilai Bon (RM)",           type: "text", placeholder: "Contoh: RM 530.00" },
  { key: "Nilai_Polisi",     label: "Nilai Polisi (RM)",        type: "text", placeholder: "Contoh: RM 530.00" },
];

const SST_FIELDS_BERDAFTAR = [
  { key: "No_Pendaftaraan_KK", label: "No. Pendaftaran (Kementerian/Jabatan)", type: "text", placeholder: "Contoh: MOF/2024/XXXXX", fullWidth: true },
  { key: "Kod_Bidang_Syarikat", label: "Kod Bidang Syarikat",  type: "text", placeholder: "Contoh: 210301" },
  { key: "Taraf_Syarikat",     label: "Taraf Syarikat",        type: "text", placeholder: "Contoh: Bumiputera / Bukan Bumiputera" },
  { key: "Tempoh_Bumiputera",  label: "Tempoh Sijil Bumiputera", type: "text", placeholder: "Contoh: 01/01/2024 - 31/12/2025" },
];

const SST_FIELDS_BERKAITAN = [
  { key: "No_Pendaftaran_CP",  label: "No. Pendaftaran Cidbid/PAKK",  type: "text", placeholder: "Contoh: CP/2024/XXXXX" },
  { key: "Tarikh_CP",          label: "Tarikh Sijil CP",              type: "date" },
];

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

/* ---------- Status Tracker ---------- */
const TRACKER_STEPS = [
  { id: "analisis", label: "Analisis AI", sub: { pending: "Belum dimulakan", active: "Sedang menganalisis...", done: "Analisis selesai" } },
  { id: "borang",   label: "Borang Sebut Harga", sub: { pending: "Menunggu analisis", active: "Menjana dokumen...", done: "Dokumen dijana" } },
  { id: "sst",      label: "Surat Setuju Terima", sub: { pending: "Menunggu borang", active: "Menjana SST...", done: "SST dijana" } },
];

let trackerState = { analisis: "pending", borang: "pending", sst: "pending" };

function setTracker(stepId, status) {
  trackerState[stepId] = status;
  renderTracker();
}

function renderTracker() {
  const el = document.getElementById("tracker-steps");
  if (!el) return;
  el.innerHTML = TRACKER_STEPS.map((step, i) => {
    const st = trackerState[step.id];
    const icon = st === "done"   ? "✓"
               : st === "active" ? `<span class="tracker-dot-pulse"></span>⏳`
               : `${i + 1}`;
    const subText = step.sub[st] || "";
    return `
      <div class="tracker-step ts-${st}">
        <div class="tracker-step-connector">
          <div class="tracker-dot">${icon}</div>
        </div>
        <div class="tracker-body">
          <div class="tracker-label">${step.label}</div>
          <div class="tracker-sub">${subText}</div>
        </div>
      </div>`;
  }).join("");
}

renderTracker();

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
    sstBerdaftar: null,
    sstBerkaitan: null,
    sstFormSubmitting: false,
    sstFormError: "",
    sstGenSuccess: false,
    sstFormValues: null,
  };
  entries.unshift(entry);
  renderEntries();
  perolehanForm.reset();
  setLoading(true);
  setTracker("analisis", "active");
  setTracker("borang", "pending");
  setTracker("sst", "pending");

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
      setTracker("analisis", "done");
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
    } else if (entry.errored) {
      setTracker("analisis", "pending");
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
      if (entry.sstGenSuccess) {
        html += `
        <div class="doc-success sst-gen-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          <span><strong>Surat Setuju Terima</strong> berjaya dijana dan dimuat turun.</span>
          <button class="btn btn-outline btn-sm" data-action="sst-again" data-id="${entry.id}" style="margin-left:auto;flex-shrink:0;">Jana Lagi</button>
        </div>`;
      } else {
        html += sstFormHtml(entry);
      }
    }
  }

  // Chat section — show after analysis completes
  if (entry.aiAnalysis && !entry.errored && !entry.streaming) {
    html += chatSectionHtml(entry);
  }

  return html;
}

function sstFieldsHtml(fields, entryId, savedValues) {
  let html = "";
  for (const field of fields) {
    const inputId = `sst-field-${field.key}-${entryId}`;
    const savedVal = savedValues?.[field.key] ?? "";
    html += `
      <div class="field${field.fullWidth ? " field-full" : ""}">
        <label for="${inputId}">${escapeHtml(field.label)}</label>
        <input type="${field.type ?? "text"}" id="${inputId}" placeholder="${escapeHtml(field.placeholder ?? "")}" value="${escapeHtml(savedVal)}" />
      </div>`;
  }
  return html;
}

function sstFormHtml(entry) {
  const id = entry.id;
  const saved = entry.sstFormValues ?? {};
  const disabled = entry.sstFormSubmitting ? "disabled" : "";

  let baseFieldsHtml = sstFieldsHtml(SST_FIELDS_BASE, id, saved);

  /* ── Sekiranya Berdaftar ── */
  let berdaftarHtml = "";
  if (entry.sstBerdaftar === null) {
    berdaftarHtml = `
      <div class="sst-conditional-section">
        <div class="sst-conditional-header">
          <div class="sst-conditional-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Sekiranya Berdaftar dengan Kementerian/Jabatan?
          </div>
          <div class="sst-conditional-btns">
            <button class="btn btn-sst-cond-yes" data-action="sst-berdaftar-yes" data-id="${id}" ${disabled}>Ya</button>
            <button class="btn btn-sst-cond-no" data-action="sst-berdaftar-no" data-id="${id}" ${disabled}>Tidak</button>
          </div>
        </div>
      </div>`;
  } else if (entry.sstBerdaftar === true) {
    berdaftarHtml = `
      <div class="sst-conditional-section sst-conditional-open">
        <div class="sst-conditional-header">
          <div class="sst-conditional-title sst-conditional-title-yes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Sekiranya Berdaftar — Maklumat Pendaftaran
          </div>
          <button class="btn btn-sst-cond-change btn-sm" data-action="sst-berdaftar-no" data-id="${id}" ${disabled}>Tukar ke Tidak</button>
        </div>
        <div class="doc-form-grid">${sstFieldsHtml(SST_FIELDS_BERDAFTAR, id, saved)}</div>
      </div>`;
  } else {
    berdaftarHtml = `
      <div class="sst-conditional-section sst-conditional-skipped">
        <div class="sst-conditional-header">
          <div class="sst-conditional-title sst-conditional-title-no">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Sekiranya Berdaftar — Ditinggalkan
          </div>
          <button class="btn btn-sst-cond-change btn-sm" data-action="sst-berdaftar-yes" data-id="${id}" ${disabled}>Tukar ke Ya</button>
        </div>
      </div>`;
  }

  /* ── Sekiranya Berkaitan ── */
  let berkaitanHtml = "";
  if (entry.sstBerkaitan === null) {
    berkaitanHtml = `
      <div class="sst-conditional-section">
        <div class="sst-conditional-header">
          <div class="sst-conditional-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            Sekiranya Berkaitan dengan Cidbid/PAKK?
          </div>
          <div class="sst-conditional-btns">
            <button class="btn btn-sst-cond-yes" data-action="sst-berkaitan-yes" data-id="${id}" ${disabled}>Ya</button>
            <button class="btn btn-sst-cond-no" data-action="sst-berkaitan-no" data-id="${id}" ${disabled}>Tidak</button>
          </div>
        </div>
      </div>`;
  } else if (entry.sstBerkaitan === true) {
    berkaitanHtml = `
      <div class="sst-conditional-section sst-conditional-open">
        <div class="sst-conditional-header">
          <div class="sst-conditional-title sst-conditional-title-yes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            Sekiranya Berkaitan — Maklumat Cidbid/PAKK
          </div>
          <button class="btn btn-sst-cond-change btn-sm" data-action="sst-berkaitan-no" data-id="${id}" ${disabled}>Tukar ke Tidak</button>
        </div>
        <div class="doc-form-grid">${sstFieldsHtml(SST_FIELDS_BERKAITAN, id, saved)}</div>
      </div>`;
  } else {
    berkaitanHtml = `
      <div class="sst-conditional-section sst-conditional-skipped">
        <div class="sst-conditional-header">
          <div class="sst-conditional-title sst-conditional-title-no">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="15" height="15"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            Sekiranya Berkaitan — Ditinggalkan
          </div>
          <button class="btn btn-sst-cond-change btn-sm" data-action="sst-berkaitan-yes" data-id="${id}" ${disabled}>Tukar ke Ya</button>
        </div>
      </div>`;
  }

  const canSubmit = entry.sstBerdaftar !== null && entry.sstBerkaitan !== null;

  return `
    <div class="doc-form doc-form-sst">
      <div class="doc-form-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
        Maklumat — Surat Setuju Terima
      </div>
      <div class="doc-form-body">
        <div class="doc-form-grid">${baseFieldsHtml}</div>
        ${berdaftarHtml}
        ${berkaitanHtml}
        ${entry.sstFormError ? `<div class="doc-form-error">${escapeHtml(entry.sstFormError)}</div>` : ""}
        <div class="doc-form-actions">
          <button class="btn btn-doc-submit" data-action="sst-submit" data-id="${id}"
            ${entry.sstFormSubmitting || !canSubmit ? "disabled" : ""}
            title="${!canSubmit ? "Sila jawab soalan Sekiranya Berdaftar dan Sekiranya Berkaitan dahulu" : ""}">
            ${entry.sstFormSubmitting
              ? `<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.2-8.55"/></svg> Menjana...`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Jana &amp; Muat Turun (.docx)`}
          </button>
        </div>
        ${!canSubmit ? `<p class="sst-pending-hint">Sila jawab soalan di atas (Sekiranya Berdaftar &amp; Sekiranya Berkaitan) sebelum menjana dokumen.</p>` : ""}
      </div>
    </div>`;
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
    entry.sstBerdaftar = null;
    entry.sstBerkaitan = null;
    entry.sstGenSuccess = false;
    entry.sstFormValues = null;
    entry.sstFormError = "";
    renderEntries();
  } else if (btn.dataset.action === "sst-no") {
    entry.sstDismissed = true;
    renderEntries();
  } else if (btn.dataset.action === "sst-berdaftar-yes") {
    saveSstFieldValues(entry);
    entry.sstBerdaftar = true;
    updateEntryBody(entry);
  } else if (btn.dataset.action === "sst-berdaftar-no") {
    saveSstFieldValues(entry);
    entry.sstBerdaftar = false;
    updateEntryBody(entry);
  } else if (btn.dataset.action === "sst-berkaitan-yes") {
    saveSstFieldValues(entry);
    entry.sstBerkaitan = true;
    updateEntryBody(entry);
  } else if (btn.dataset.action === "sst-berkaitan-no") {
    saveSstFieldValues(entry);
    entry.sstBerkaitan = false;
    updateEntryBody(entry);
  } else if (btn.dataset.action === "sst-submit") {
    if (entry.sstBerdaftar !== null && entry.sstBerkaitan !== null) {
      saveSstFieldValues(entry);
      submitSstForm(entry);
    }
  } else if (btn.dataset.action === "sst-again") {
    entry.sstGenSuccess = false;
    entry.sstBerdaftar = null;
    entry.sstBerkaitan = null;
    entry.sstFormValues = null;
    entry.sstFormError = "";
    updateEntryBody(entry);
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
  setTracker("borang", "active");
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
    setTracker("borang", "done");
    renderEntries();
  } catch (err) {
    entry.docFormError = err.message ?? "Ralat semasa menjana dokumen.";
    entry.docFormSubmitting = false;
    setTracker("borang", "pending");
    updateEntryBody(entry);
  }
}

/* ---------- SST helpers ---------- */
function saveSstFieldValues(entry) {
  const id = entry.id;
  const allFields = [
    ...SST_FIELDS_BASE,
    ...SST_FIELDS_BERDAFTAR,
    ...SST_FIELDS_BERKAITAN,
  ];
  const values = entry.sstFormValues ?? {};
  for (const field of allFields) {
    const el = document.getElementById(`sst-field-${field.key}-${id}`);
    if (el) values[field.key] = el.value ?? "";
  }
  entry.sstFormValues = values;
}

async function submitSstForm(entry) {
  entry.sstFormSubmitting = true;
  entry.sstFormError = "";
  setTracker("sst", "active");
  updateEntryBody(entry);

  const saved = entry.sstFormValues ?? {};
  const payload = { ...saved };

  if (entry.sstBerdaftar !== true) {
    for (const f of SST_FIELDS_BERDAFTAR) payload[f.key] = "";
  }
  if (entry.sstBerkaitan !== true) {
    for (const f of SST_FIELDS_BERKAITAN) payload[f.key] = "";
  }

  try {
    const response = await fetch(`${BACKEND_URL}/api/perolehan/generate-sst`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: `Ralat pelayan ${response.status}` }));
      throw new Error(errData.error ?? `Ralat pelayan ${response.status}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = (saved["Nama_Syarikat"] ?? "dokumen").replace(/\s+/g, "_");
    a.download = `Surat_Setuju_Terima_${safeName}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    entry.sstGenSuccess = true;
    entry.sstFormSubmitting = false;
    setTracker("sst", "done");
    updateEntryBody(entry);
  } catch (err) {
    entry.sstFormError = err.message ?? "Ralat semasa menjana Surat Setuju Terima.";
    entry.sstFormSubmitting = false;
    setTracker("sst", "pending");
    updateEntryBody(entry);
  }
}

/* ---------- Rekod Perolehan page ---------- */
const REKOD_PER_PAGE = 5;
let rekodPage = 1;
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
    rekodPage = 1;
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

  // Store all rows for PDF/delete use
  window._rekodRows = rows;

  const totalPages = Math.ceil(rows.length / REKOD_PER_PAGE);
  rekodPage = Math.min(Math.max(rekodPage, 1), totalPages);

  const start = (rekodPage - 1) * REKOD_PER_PAGE;
  const pageRows = rows.slice(start, start + REKOD_PER_PAGE);

  const cardsHtml = pageRows.map((row) => {
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

  const paginationHtml = totalPages > 1 ? `
    <div class="rekod-pagination">
      <button class="rekod-page-btn" onclick="goRekodPage(${rekodPage - 1})" ${rekodPage === 1 ? "disabled" : ""}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="15 18 9 12 15 6"/></svg>
        Sebelum
      </button>
      <div class="rekod-page-numbers">
        ${Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => `
          <button class="rekod-page-num ${p === rekodPage ? "active" : ""}" onclick="goRekodPage(${p})">${p}</button>
        `).join("")}
      </div>
      <button class="rekod-page-btn" onclick="goRekodPage(${rekodPage + 1})" ${rekodPage === totalPages ? "disabled" : ""}>
        Seterus
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
      <span class="rekod-page-info">${rows.length} rekod · Halaman ${rekodPage} / ${totalPages}</span>
    </div>` : `<div class="rekod-pagination-info">${rows.length} rekod</div>`;

  rekodList.innerHTML = cardsHtml + paginationHtml;
}

window.goRekodPage = function(page) {
  rekodPage = page;
  renderRekod(window._rekodRows || []);
  document.getElementById("rekod-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

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

/* =====================================================
   Right-click context menu — "Tanya Chatbot"
   ===================================================== */
document.addEventListener("DOMContentLoaded", function initAiContextMenu() {
  const menu = document.getElementById("ai-context-menu");
  const askBtn = document.getElementById("ai-context-ask");

  let activeEntryId = null;
  let selectedText = "";
  let cachedSelection = "";   // captured on mouseup before right-click clears it
  let cachedBodyEl = null;

  // Cache selection on left-button mouseup so right-click still has it
  document.addEventListener("mouseup", (e) => {
    if (e.button !== 0) return; // ignore right-click mouseup
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : "";
    const anchor = sel && sel.anchorNode ? sel.anchorNode.parentElement : null;
    const mdEl = anchor ? anchor.closest(".entry-body .md") : null;
    if (text && mdEl) {
      cachedSelection = text;
      cachedBodyEl = mdEl.closest("[data-body]");
    } else {
      cachedSelection = "";
      cachedBodyEl = null;
    }
  });

  function hideMenu() {
    menu.style.display = "none";
    activeEntryId = null;
    selectedText = "";
  }

  // Show menu on right-click inside an AI analysis .md block
  document.addEventListener("contextmenu", (e) => {
    // Walk up to find if we're inside a .md element that lives in an entry body
    const mdEl = e.target.closest(".entry-body .md");
    if (!mdEl) { hideMenu(); return; }

    // Use the cached selection (captured on mouseup) since right-click may clear it
    const text = cachedSelection;
    if (!text) { hideMenu(); return; }

    const bodyEl = cachedBodyEl;
    if (!bodyEl) { hideMenu(); return; }

    e.preventDefault();

    activeEntryId = Number(bodyEl.dataset.body);
    selectedText = text;

    // Position menu near cursor, keeping it on-screen
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    menu.style.display = "block";
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let x = e.clientX + 4;
    let y = e.clientY + 4;
    if (x + mw > vw - 8) x = e.clientX - mw - 4;
    if (y + mh > vh - 8) y = e.clientY - mh - 4;
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
  });

  // Hide on any outside click
  document.addEventListener("mousedown", (e) => {
    if (!menu.contains(e.target)) hideMenu();
  });

  // Hide on scroll or Escape
  document.addEventListener("scroll", hideMenu, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") hideMenu(); });

  // "Ask Chatbot" action
  askBtn.addEventListener("click", () => {
    if (!activeEntryId || !selectedText) { hideMenu(); return; }

    const entry = entries.find((x) => x.id === activeEntryId);
    if (!entry) { hideMenu(); return; }

    // Capture these now — hideMenu() below will reset the shared variables
    // before the requestAnimationFrame callback below gets a chance to run
    const capturedText = selectedText;
    const capturedEntry = entry;

    // Expand chat if collapsed
    capturedEntry.showChat = true;
    updateEntryBody(capturedEntry);

    // Scroll chat into view then send
    requestAnimationFrame(() => {
      const chatEl = document.getElementById(`chat-${capturedEntry.id}`);
      if (chatEl) chatEl.scrollIntoView({ behavior: "smooth", block: "nearest" });

      // Build a clear question referencing the selected snippet
      const question = `Mengenai petikan ini daripada analisis:\n"${capturedText}"\n\nBoleh terangkan dengan lebih lanjut?`;

      if (!capturedEntry.chatStreaming) {
        sendChatMessage(capturedEntry, question);
      }
    });

    hideMenu();
  });
});