import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { query } from "../db/pool.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validMaldivesLocation } from "../data/maldivesLocations.js";

const router = Router();
router.use(authenticate, authorize("hospital_manager", "admin"));

function hospital(req) {
  return req.user.hospitalId || null;
}

router.get("/account", async (req, res, next) => {
  try {
    const id = hospital(req);
    if (!id) return res.status(400).json({ message: "Hospital is required" });
    const result = await query(
      `SELECT id,name,address,city,atoll,island,phone FROM hospitals WHERE id=$1`,
      [id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/account", async (req, res, next) => {
  try {
    const id = hospital(req);
    if (!id) return res.status(400).json({ message: "Hospital is required" });
    const input = z
      .object({
        name: z.string().trim().min(2).max(150),
        address: z.string().trim().min(3).max(250),
        atoll: z.string().trim().min(2).max(80),
        island: z.string().trim().min(2).max(80),
        phone: z.string().trim().min(7).max(30),
      })
      .refine((value) => validMaldivesLocation(value.atoll, value.island), {
        message: "Select a valid island for the chosen atoll",
        path: ["island"],
      })
      .parse(req.body);
    const result = await query(
      `UPDATE hospitals SET name=$1,address=$2,city=$4,atoll=$3,island=$4,phone=$5 WHERE id=$6 RETURNING id,name,address,atoll,island,phone`,
      [input.name, input.address, input.atoll, input.island, input.phone, id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/donation-settings", async (req, res, next) => {
  try {
    const id = hospital(req);
    if (!id) return res.status(400).json({ message: "Hospital is required" });
    const result = await query(
      `SELECT donation_open_time AS "opensAt",donation_close_time AS "closesAt",
      donation_days AS "donationDays",donations_enabled AS enabled
      FROM hospitals WHERE id=$1`,
      [id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/donation-settings", async (req, res, next) => {
  try {
    const id = hospital(req);
    if (!id) return res.status(400).json({ message: "Hospital is required" });
    const input = z
      .object({
        opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        donationDays: z.string().trim().min(3).max(100),
        enabled: z.boolean(),
      })
      .refine((value) => value.opensAt < value.closesAt, {
        message: "Closing time must be later than opening time",
        path: ["closesAt"],
      })
      .parse(req.body);
    const result = await query(
      `UPDATE hospitals SET donation_open_time=$1,donation_close_time=$2,
      donation_days=$3,donations_enabled=$4 WHERE id=$5
      RETURNING donation_open_time AS "opensAt",donation_close_time AS "closesAt",
      donation_days AS "donationDays",donations_enabled AS enabled`,
      [input.opensAt, input.closesAt, input.donationDays, input.enabled, id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/staff", async (req, res, next) => {
  try {
    const id = hospital(req);
    if (!id) return res.status(400).json({ message: "Hospital is required" });
    const result = await query(
      `SELECT id,email,full_name AS "fullName",phone,role,active,created_at AS "createdAt" FROM users WHERE hospital_id=$1 AND role IN ('hospital_staff','hospital_manager') ORDER BY CASE role WHEN 'hospital_manager' THEN 0 ELSE 1 END,full_name`,
      [id],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/staff", async (req, res, next) => {
  try {
    const id = hospital(req);
    if (!id) return res.status(400).json({ message: "Hospital is required" });
    const input = z
      .object({
        fullName: z.string().trim().min(2).max(100),
        email: z.email(),
        phone: z.string().trim().min(7).max(30),
        password: z.string().min(8),
      })
      .parse(req.body);
    const hash = await bcrypt.hash(input.password, 10);
    const result = await query(
      `INSERT INTO users (email,password_hash,full_name,phone,role,hospital_id) VALUES (lower($1),$2,$3,$4,'hospital_staff',$5) RETURNING id,email,full_name AS "fullName",phone,role,active`,
      [input.email, hash, input.fullName, input.phone, id],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/staff/:id", async (req, res, next) => {
  try {
    const hospitalId = hospital(req);
    if (!hospitalId)
      return res.status(400).json({ message: "Hospital is required" });
    const input = z
      .object({
        fullName: z.string().trim().min(2).max(100),
        email: z.email(),
        phone: z.string().trim().min(7).max(30),
        active: z.boolean(),
        password: z.string().min(8).optional(),
      })
      .parse(req.body);
    const hash = input.password ? await bcrypt.hash(input.password, 10) : null;
    const result = await query(
      `UPDATE users SET email=lower($1),full_name=$2,phone=$3,active=$4,password_hash=coalesce($5,password_hash) WHERE id=$6 AND hospital_id=$7 AND role='hospital_staff' RETURNING id,email,full_name AS "fullName",phone,role,active`,
      [
        input.email,
        input.fullName,
        input.phone,
        input.active,
        hash,
        req.params.id,
        hospitalId,
      ],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "Staff account not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/staff/:id", async (req, res, next) => {
  try {
    const hospitalId = hospital(req);
    if (!hospitalId)
      return res.status(400).json({ message: "Hospital is required" });
    const result = await query(
      `UPDATE users SET active=false WHERE id=$1 AND hospital_id=$2 AND role='hospital_staff' RETURNING id`,
      [req.params.id, hospitalId],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "Staff account not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
