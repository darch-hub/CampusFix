// Overdue thresholds per effective urgency (hours in current stage).
export const OVERDUE_HOURS = { Emergency: 4, High: 24, Medium: 72, Low: 168 };

export function effectiveUrgency(issue) {
  return issue.adminUrgency || issue.reporterUrgency || "Medium";
}

export function isOverdue(issue, now = new Date()) {
  const hours = OVERDUE_HOURS[effectiveUrgency(issue)] ?? OVERDUE_HOURS.Medium;
  const updated = new Date(issue.updatedAt);
  return now - updated > hours * 3600 * 1000;
}

const RANK = { Emergency: 0, High: 1, Medium: 2, Low: 3 };
export function urgencyRank(u) {
  return RANK[u] ?? 2;
}
