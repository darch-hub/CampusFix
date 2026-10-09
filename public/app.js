// CampusFix frontend — auth-first shell + role-aware interface.
const api = (path, opts = {}) => fetch(path, { credentials: "include", ...opts });
const $ = (id) => document.getElementById(id);

const NEXT_LABEL = { Reported: "Acknowledge", Acknowledged: "Start progress", "In Progress": "Resolve" };
const URGENCIES = ["Low", "Medium", "High", "Emergency"];
const pillClass = (s) => "pill pill-" + s.toLowerCase().replace(/ /g, "-");

async function me() {
  try {
    const res = await api("/api/auth/get-session");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch { return null; }
}

// ---- view shell: sign-in first, app only after sign-in ----
function showView(name) {
  $("view-auth").hidden = name !== "auth";
  $("view-app").hidden = name !== "app";
}

async function enterApp(user) {
  $("user-chip").textContent = `${user.name} · ${user.role}`;
  $("admin-section").hidden = user.role !== "admin";
  showView("app");
  await loadLocations();
  await loadIssues();
  if (user.role === "admin") await loadAdmin();
}

async function exitToAuth() {
  showView("auth");
  $("auth-error").textContent = "";
}

$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const res = await api("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
  });
  if (!res.ok) {
    $("auth-error").textContent = `Sign-in failed (${res.status}). Check your email and password.`;
    return;
  }
  e.target.reset();
  await enterApp(await me());
});

$("logout").addEventListener("click", async () => {
  await api("/api/auth/sign-out", { method: "POST" });
  await exitToAuth();
});

// ---- reporter + browsing (PRD §5.1, §5.4) ----
async function loadLocations() {
  try {
    const res = await api("/api/locations");
    if (!res.ok) return;
    const locs = await res.json();
    $("location-select").innerHTML = locs.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
  } catch { /* API unavailable */ }
}

function issueCard(i, { admin = false } = {}) {
  const li = document.createElement("li");
  li.className = "issue-card" + (i.overdue ? " overdue" : "");
  li.innerHTML =
    `<div class="issue-title"><b>#${i.id} ${i.category}</b>` +
    (i.overdue ? ` <span class="overdue-flag">OVERDUE</span>` : "") + `</div>` +
    `<div class="meta"><span class="badge badge-${i.effectiveUrgency.toLowerCase()}">${i.effectiveUrgency}</span>` +
    ` <span class="${pillClass(i.status)}">${i.status}</span>` +
    ` <span class="muted">${i.locationName}</span></div>` +
    `<div class="desc">${i.description}</div>` +
    (i.photoUrl ? `<div><a href="${i.photoUrl}" target="_blank" rel="noopener">View photo</a></div>` : "") +
    `<div class="muted small">👍 ${i.upvoteCount}</div>`;
  const actions = document.createElement("div");
  actions.className = "actions";
  if (!admin) {
    const btn = document.createElement("button");
    btn.textContent = "I have this too";
    btn.onclick = async () => { await api(`/api/issues/${i.id}/upvote`, { method: "POST" }); loadIssues(); };
    actions.appendChild(btn);
  } else {
    if (NEXT_LABEL[i.status]) {
      const adv = document.createElement("button");
      adv.className = "btn-primary";
      adv.textContent = NEXT_LABEL[i.status];
      adv.onclick = async () => {
        await api(`/api/admin/issues/${i.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus(i.status) }),
        });
        loadAdmin();
        loadIssues();
      };
      actions.appendChild(adv);
    }
    const sel = document.createElement("select");
    sel.title = "Override urgency";
    sel.innerHTML = URGENCIES.map((u) => `<option${(i.adminUrgency || i.reporterUrgency) === u ? " selected" : ""}>${u}</option>`).join("");
    sel.onchange = async () => {
      await api(`/api/admin/issues/${i.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminUrgency: sel.value }),
      });
      loadAdmin();
      loadIssues();
    };
    actions.appendChild(sel);
  }
  li.appendChild(actions);
  return li;
}

function nextStatus(s) {
  return s === "Reported" ? "Acknowledged" : s === "Acknowledged" ? "In Progress" : "Resolved";
}

async function loadIssues() {
  const list = $("issue-list");
  const cat = $("filter-category").value;
  const status = $("filter-status").value;
  const q = new URLSearchParams({ ...(cat && { category: cat }), ...(status && { status }) });
  try {
    const res = await api(`/api/issues?${q}`);
    if (res.status === 401) { await exitToAuth(); return; }
    const items = await res.json();
    list.innerHTML = items.length ? "" : "<li>No issues found.</li>";
    for (const i of items) list.appendChild(issueCard(i));
  } catch { list.innerHTML = "<li>API unavailable.</li>"; }
}

$("refresh").addEventListener("click", loadIssues);

$("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = $("form-status");
  try {
    const res = await api("/api/issues", { method: "POST", body: new FormData(e.target) });
    if (res.status === 401) { await exitToAuth(); return; }
    status.textContent = res.ok ? "Report submitted." : `Submit failed (${res.status}).`;
    if (res.ok) { e.target.reset(); loadIssues(); }
  } catch { status.textContent = "Submit failed: API unavailable."; }
});

// ---- admin interface (PRD §5.2, §5.3, §5.7) ----
async function loadAdmin() {
  try {
    const q = await api("/api/admin/issues");
    if (!q.ok) return;
    const items = await q.json();
    const list = $("admin-list");
    list.innerHTML = items.length ? "" : "<li>No open work.</li>";
    for (const i of items) list.appendChild(issueCard(i, { admin: true }));
    const d = await (await api("/api/admin/dashboard")).json();
    $("admin-stats").innerHTML =
      stat(d.open, "Open") + stat(d.resolved, "Resolved") +
      stat(d.avgResolutionHours == null ? "—" : Math.round(d.avgResolutionHours * 10) / 10 + "h", "Avg resolution") +
      stat(d.overdueCount, "Overdue");
  } catch { /* API unavailable */ }
}

function stat(num, label) {
  return `<div class="stat-card"><div class="num">${num}</div><div class="label">${label}</div></div>`;
}

$("filter-category").innerHTML = '<option value="">All categories</option>' +
  ["Electrical", "Plumbing", "Structural", "Furniture", "Cleaning", "Other"].map((c) => `<option>${c}</option>`).join("");

// Boot: session decides the first view — no session, no app.
(async () => {
  const user = await me();
  if (user) await enterApp(user);
  else showView("auth");
})();

// ---- PWA: service worker + visible install UI ----
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

let deferredPrompt = null;

function refreshInstallUI() {
  const banner = $("install-banner"), top = $("install-btn-top"),
    btn = $("install-btn"), hint = $("install-hint");
  if (!banner || isStandalone()) {
    if (banner) banner.hidden = true;
    if (top) top.hidden = true;
    return;
  }
  if (deferredPrompt) {
    hint.textContent = "Add it to your home screen for quick access.";
    btn.hidden = false;
    banner.hidden = false;
    top.hidden = false;
  } else if (isIos()) {
    hint.textContent = "Tap Share, then \u201cAdd to Home Screen\u201d.";
    btn.hidden = true;
    banner.hidden = false;
    top.hidden = true;
  } else {
    banner.hidden = true;
    top.hidden = true;
  }
}

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  refreshInstallUI();
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  refreshInstallUI();
});

async function promptInstall() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  await deferredPrompt.userChoice.catch(() => {});
  deferredPrompt = null;
  refreshInstallUI();
}

$("install-btn").addEventListener("click", promptInstall);
$("install-btn-top").addEventListener("click", promptInstall);
$("install-dismiss").addEventListener("click", () => { $("install-banner").hidden = true; });

refreshInstallUI();
