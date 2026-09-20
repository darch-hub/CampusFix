// Scaffold frontend: wires PRD fields to stub APIs (all return 501 for now).
async function loadIssues() {
  const list = document.getElementById("issue-list");
  try {
    const res = await fetch("/api/issues");
    const data = await res.json();
    list.innerHTML = `<li>API stub: ${JSON.stringify(data)}</li>`;
  } catch (e) {
    list.innerHTML = "<li>API unavailable.</li>";
  }
}

document.getElementById("refresh").addEventListener("click", loadIssues);

document.getElementById("report-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const status = document.getElementById("form-status");
  const form = new FormData(e.target);
  const payload = Object.fromEntries(form.entries());
  try {
    const res = await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    status.textContent = `API stub response: ${res.status}`;
  } catch (err) {
    status.textContent = "Submit failed: API unavailable.";
  }
});

// Placeholder locations mirror src/config/locations.js until an API exists.
document.getElementById("location-select").innerHTML = [
  "Main Hostel - Block A",
  "Main Hostel - Block B",
  "Library - Ground Floor",
  "Library - First Floor",
  "Science Building - Lab 101",
  "Admin Block - Reception"
].map((l) => `<option>${l}</option>`).join("");

loadIssues();
