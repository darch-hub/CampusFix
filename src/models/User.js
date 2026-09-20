// User domain model — documents PRD §4 roles.
// No auth yet; institutional login is assumed per PRD §9.

const ROLES = ["reporter", "admin"];

// Shape of a User (to be persisted in a later version):
// {
//   id: string,
//   name: string,
//   email: string (institutional),
//   role: ROLES (Admin handles triage + resolution in v1; no Maintenance Staff role)
// }

module.exports = { ROLES };
