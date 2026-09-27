// CampusFix frontend — Better Auth session + Postgres-backed API.
const api = (path, opts = {}) => fetch(path, { credentials: "include", ...opts });

async function me() {
  try {
    const res = await api("/api/auth/get-session");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.user ?? null;
  } catch { return null; }
}

async function refreshAuth() {
  const user = await me();
  document.getElementById("auth-status").textContent = user
    ? `Signed in as ${user.name} (${user.role})`
    : "Not signed in.";
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = new FormData(e.target);
  const res = await api("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
  });
  document.getElementById("auth-status").textContent = res.ok ? "Signed in." : `Sign-in failed (${res.status}).`;
  await refreshAuth();
  await loadIssues();
});

document.getElementById("logout").addEventListener("click", async () => {
  await api("/api/auth/sign-out", { method: "POST" });
  await refreshAuth();
});

async function loadLocations() {
  try {
    const res = await api("/api/locations");
    if (!res.ok) return;
    const locs = await res.json();
    document.getElementById("location-select").innerHTML = locs.map((l) => `<option value="${l.id}">${l.name}</option>`).join("");
  } catch { /* not signed in yet */ }
}

async function loadIssues() {
  const list = document.getElementById("issue-list");
  const cat = document.getElementById("filter-category").value;
  const status = document.getElementById("filter-status").value;
  const q = new URLSearchParams({ ...(cat && { category: cat }), ...(status && { status }) });
  try {
    const res = await api(`/api/issues?${q}`);
    if (res.status === 401) { list.innerHTML = "<li>Sign in to view issues.</li>"; return; }
    const items = await res.json();
    list.innerHTML = items.length ? "" : "<li>No issues found.</li>";
    for (const i of items) {
      const li = document.createElement("li");
      li.innerHTML = `<b>#${i.id} ${i.category}</b> — ${i.locationName} — ${i.status} — ${i.effectiveUrgency}` +
        (i.overdue ? " — <b>OVERDUE</b>" : "") + ` — 👍 ${i.upvoteCount}<br/>${i.description}` +
        (i.photoUrl ? `<br/><a href="${i.photoUrl}" target="_blank">photo</a>` : "");
      const btn = document.createElement("button");
      btn.textContent = "I have this too";
      btn.onclick = async () => { await api(`/api/issues/${i.id}/upvote`, { method: "POST" }); loadIssues(); };
      li.appendChild(btn);
      list.appendChild(li);
    }
  } catch { list.innerHTML = "<li>API unavailable.</li>"; }
}

document.getElementById("refresh").addEventListener("click", loadIssues);

document.getElementById("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("form-status");
  try {
    const res = await api("/api/issues", { method: "POST", body: new FormData(e.target) });
    status.textContent = res.ok ? "Report submitted." : `Submit failed (${res.status}).`;
    if (res.ok) { e.target.reset(); loadIssues(); }
  } catch { status.textContent = "Submit failed: API unavailable."; }
});

document.getElementById("filter-category").innerHTML = '<option value="">All categories</option>' +
  ["Electrical", "Plumbing", "Structural", "Furniture", "Cleaning", "Other"].map((c) => `<option>${c}</option>`).join("");

refreshAuth().then(() => { loadLocations(); loadIssues(); });
