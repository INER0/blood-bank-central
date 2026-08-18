import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { query } from "../db/pool.js";

export async function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token)
    return res.status(401).json({ message: "Authentication required" });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    const account = await query(
      "SELECT active,hospital_id,role FROM users WHERE id=$1",
      [req.user.id],
    );
    if (!account.rows[0]?.active)
      return res
        .status(401)
        .json({ message: "This account is no longer active" });
    req.user.hospitalId = account.rows[0].hospital_id;
    req.user.role = account.rows[0].role;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}

export function authorize(...roles) {
  return (req, res, next) =>
    roles.includes(req.user.role)
      ? next()
      : res
          .status(403)
          .json({ message: "You do not have access to this action" });
}
