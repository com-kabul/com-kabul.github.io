const GITHUB_USERNAME = "com-Kabul";
const REPOSITORY = "com-Kabul.github.io";
const BRANCH = "main";

const SUBJECTS = {
  sehat: { name: "ارتباطات صحی", icon: "🩺" },
  nonverbal: { name: "ارتباطات غیرکلامی", icon: "🗣️" },
  statistics: { name: "آمار و استدلال", icon: "📊" },
  computer: { name: "کمپیوتر", icon: "💻" },
  dari: { name: "دری", icon: "🇦🇫" },
  pashto: { name: "پشتو", icon: "پ" },
  english: { name: "انگلیسی", icon: "🇬🇧" },
  culture: { name: "ثقافت", icon: "🌍" }
};

const params = new URLSearchParams(location.search);
const subjectKey = params.get("subject");
const subject = SUBJECTS[subjectKey];

const statusEl = document.getElementById("status");
const listEl = document.getElementById("fileList");
const searchEl = document.getElementById("search");
const refreshBtn = document.getElementById("refresh");

if (!subject) {
  if (statusEl) statusEl.innerHTML = '<div class="empty">❌ مضمون پیدا نشد.</div>';
} else {
  document.title = `${subject.name} | COM-Kabul`;
  document.getElementById("pageTitle").textContent = subject.name;
  document.getElementById("subjectIcon").textContent = subject.icon;
  loadFiles();
}

async function loadFiles() {
  if (!subject) return;
  statusEl.className = "status";
  statusEl.textContent = "در حال دریافت فایل‌ها...";
  listEl.innerHTML = "";

  const api = `https://api.github.com/repos/${encodeURIComponent(GITHUB_USERNAME)}/${encodeURIComponent(REPOSITORY)}/contents/files/${encodeURIComponent(subjectKey)}?ref=${encodeURIComponent(BRANCH)}`;

  try {
    const response = await fetch(api, { headers: { "Accept": "application/vnd.github+json" }, cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404) throw new Error("پوشه مضمون پیدا نشد. نام Repository یا ساختار پوشه‌ها را بررسی کنید.");
      if (response.status === 403) throw new Error("درخواست‌های GitHub موقتاً محدود شده است. چند دقیقه بعد دوباره امتحان کنید.");
      throw new Error(`خطای GitHub (${response.status})`);
    }

    const data = await response.json();
    const files = Array.isArray(data) ? data.filter(x => x.type === "file" && x.name !== ".gitkeep") : [];

    if (!files.length) {
      statusEl.innerHTML = '<div class="empty">📂 هنوز فایلی در این بخش آپلود نشده است.</div>';
      return;
    }

    files.sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric:true, sensitivity:"base"}));
    statusEl.textContent = `${files.length} فایل پیدا شد`;
    renderFiles(files);
  } catch (err) {
    console.error(err);
    statusEl.innerHTML = `<div class="error">❌ ${escapeHTML(err.message)}<br><small>اگر تازه فایل/پوشه ساخته‌اید، کمی صبر کنید و «تازه‌سازی» را بزنید.</small></div>`;
  }
}

function renderFiles(files) {
  listEl.innerHTML = "";
  for (const file of files) {
    const ext = extension(file.name);
    const card = document.createElement("article");
    card.className = "file-card";
    card.dataset.name = file.name.toLowerCase();

    const icon = getIcon(ext);
    const size = file.size ? formatBytes(file.size) : "";

    card.innerHTML = `
      <div class="file-icon">${icon}</div>
      <div class="file-info">
        <h2>${escapeHTML(file.name)}</h2>
        <p>${escapeHTML(ext ? ext.toUpperCase() : "FILE")}${size ? " • " + size : ""}</p>
      </div>
      <div class="file-actions">
        <a class="open-btn" href="${file.html_url}" target="_blank" rel="noopener">مشاهده</a>
        <a class="download-btn" href="${file.download_url}" target="_blank" rel="noopener" download>⬇ دانلود</a>
      </div>
    `;
    listEl.appendChild(card);
  }
  applySearch();
}

searchEl?.addEventListener("input", applySearch);
refreshBtn?.addEventListener("click", loadFiles);

function applySearch() {
  const q = (searchEl?.value || "").trim().toLowerCase();
  const cards = listEl.querySelectorAll(".file-card");
  let visible = 0;
  cards.forEach(card => {
    const show = card.dataset.name.includes(q);
    card.hidden = !show;
    if (show) visible++;
  });
  if (cards.length && !visible) {
    statusEl.textContent = "نتیجه‌ای برای جستجوی شما پیدا نشد.";
  } else if (cards.length) {
    statusEl.textContent = `${visible} فایل نمایش داده می‌شود`;
  }
}

function extension(name) {
  const i = name.lastIndexOf(".");
  return i > -1 ? name.slice(i + 1).toLowerCase() : "";
}

function getIcon(ext) {
  const map = {pdf:"📕", doc:"📘", docx:"📘", ppt:"📙", pptx:"📙", xls:"📗", xlsx:"📗", zip:"🗜️", rar:"🗜️", "7z":"🗜️", jpg:"🖼️", jpeg:"🖼️", png:"🖼️", gif:"🖼️", mp4:"🎬", mp3:"🎵", txt:"📄"};
  return map[ext] || "📄";
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B","KB","MB","GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 1 : 0)} ${units[i]}`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
}