import { auth } from "../auth.js";

export async function getSession(req) {
  return auth.api.getSession({ headers: Object.fromEntries(Object.entries(req.headers)) });
}

export function requireAuth(handler) {
  return async (req, res, next) => {
    try {
      const session = await getSession(req);
      if (!session?.user) return res.status(401).json({ error: "Not authenticated" });
      req.auth = session;
      return handler(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
}

export function requireAdmin(handler) {
  return requireAuth(async (req, res, next) => {
    if (req.auth.user.role !== "admin") return res.status(403).json({ error: "Admin only" });
    return handler(req, res, next);
  });
}
