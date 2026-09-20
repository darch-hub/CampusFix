// Issue domain model — documents PRD §5.1–5.4 fields.
// No persistence yet; this is a schema reference for the scaffold.

const CATEGORIES = ["Electrical", "Plumbing", "Structural", "Furniture", "Cleaning", "Other"];
const URGENCIES = ["Low", "Medium", "High", "Emergency"];
const STATUSES = ["Reported", "Acknowledged", "In Progress", "Resolved"];

// Shape of an Issue (to be persisted in a later version):
// {
//   id: string,
//   category: CATEGORIES,
//   location: string (must be in config/locations.js),
//   description: string,
//   photoUrl: string | null (optional but encouraged),
//   reporterUrgency: URGENCIES,
//   adminUrgency: URGENCIES | null (override during triage),
//   isAnonymous: boolean,
//   reporterId: string | null (null if anonymous for accountability separation),
//   status: STATUSES,
//   upvotes: number,
//   upvotedBy: string[],
//   reporterConfirmed: boolean | null (set after Resolved),
//   createdAt: string, updatedAt: string
// }

module.exports = { CATEGORIES, URGENCIES, STATUSES };
