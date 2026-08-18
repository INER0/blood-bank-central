import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { query } from "../db/pool.js";
import { config } from "../config.js";
import { authenticate } from "../middleware/auth.js";
import { validMaldivesLocation } from "../data/maldivesLocations.js";

const router = Router();
const credentials = z.object({ email: z.email(), password: z.string().min(8) });

function session(user) {
  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    hospitalId: user.hospital_id,
    identificationType: user.identification_type,
    identificationNumber: user.identification_number,
    atoll: user.atoll,
    island: user.island,
  };
  return {
    user: safeUser,
    token: jwt.sign(safeUser, config.jwtSecret, { expiresIn: "7d" }),
  };
}

router.post("/register", async (req, res, next) => {
  try {
    const input = z
      .object({
        fullName: z.string().min(2).max(100),
        email: z.email(),
        password: z.string().min(8),
        passwordConfirmation: z.string().min(8),
        temporaryPassword: z.string().optional(),
        phone: z
          .string()
          .trim()
          .min(7, "Phone number must contain at least 7 characters")
          .max(30),
        bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
        atoll: z.string().trim().min(2),
        island: z.string().trim().min(2),
        identificationType: z.enum(["maldives_id", "passport"]),
        identificationNumber: z.string().trim().min(5).max(30),
      })
      .refine((value) => validMaldivesLocation(value.atoll, value.island), {
        message: "Select a valid island for the chosen atoll",
        path: ["island"],
      })
      .refine((value) => value.password === value.passwordConfirmation, {
        message: "Passwords do not match",
        path: ["passwordConfirmation"],
      })
      .refine(
        (value) =>
          value.identificationType !== "maldives_id" ||
          /^A\d{6}$/i.test(value.identificationNumber),
        {
          message: "Maldives ID must be A followed by 6 digits",
          path: ["identificationNumber"],
        },
      )
      .parse(req.body);
    const hash = await bcrypt.hash(input.password, 10);
    const client = await (await import("../db/pool.js")).pool.connect();
    try {
      await client.query("BEGIN");
      const identificationNumber = input.identificationNumber.toUpperCase();
      const existing = await client.query(
        `SELECT * FROM users WHERE identification_type=$1 AND upper(identification_number)=upper($2) FOR UPDATE`,
        [input.identificationType, identificationNumber],
      );
      let result;
      if (existing.rowCount) {
        const walkIn = existing.rows[0];
        if (!walkIn.email.endsWith("@walkin.local")) {
          await client.query("ROLLBACK");
          return res.status(409).json({
            message: "An account already exists for this identification number",
          });
        }
        if (
          !input.temporaryPassword ||
          !(await bcrypt.compare(input.temporaryPassword, walkIn.password_hash))
        ) {
          await client.query("ROLLBACK");
          return res.status(403).json({
            message:
              "Enter the temporary password provided by hospital staff to claim this walk-in record",
          });
        }
        result = await client.query(
          `UPDATE users SET email=lower($1),password_hash=$2,full_name=$3,phone=$4,atoll=$5,island=$6
           WHERE id=$7 RETURNING *`,
          [
            input.email,
            hash,
            input.fullName,
            input.phone,
            input.atoll,
            input.island,
            walkIn.id,
          ],
        );
        await client.query(
          `UPDATE donor_profiles SET blood_type=$1,eligible=true,eligibility_note=NULL,ineligibility_type=NULL,ineligible_until=NULL WHERE user_id=$2`,
          [input.bloodType, walkIn.id],
        );
        await client.query(
          `INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details)
           VALUES ($1,'walk_in_account_claimed','patient',$2,$3)`,
          [
            walkIn.id,
            walkIn.id,
            JSON.stringify({ email: input.email.toLowerCase() }),
          ],
        );
      } else {
        result = await client.query(
          `INSERT INTO users (email,password_hash,full_name,phone,atoll,island,identification_type,identification_number)
          VALUES (lower($1),$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
          [
            input.email,
            hash,
            input.fullName,
            input.phone,
            input.atoll,
            input.island,
            input.identificationType,
            identificationNumber,
          ],
        );
        await client.query(
          "INSERT INTO donor_profiles (user_id,blood_type) VALUES ($1,$2)",
          [result.rows[0].id, input.bloodType],
        );
      }
      await client.query("COMMIT");
      res.status(201).json(session(result.rows[0]));
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const input = credentials.parse(req.body);
    const result = await query("SELECT * FROM users WHERE email=lower($1)", [
      input.email,
    ]);
    const user = result.rows[0];
    if (!user || !(await bcrypt.compare(input.password, user.password_hash)))
      return res.status(401).json({ message: "Incorrect email or password" });
    if (!user.active)
      return res.status(403).json({
        message:
          "This staff account has been deactivated by the hospital administrator",
      });
    res.json(session(user));
  } catch (error) {
    next(error);
  }
});

router.get("/me", authenticate, async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id,u.email,u.full_name AS "fullName",u.phone,u.role,u.hospital_id AS "hospitalId",
      u.atoll,u.island,u.identification_type AS "identificationType",u.identification_number AS "identificationNumber",
      d.blood_type AS "bloodType",d.last_donation_date AS "lastDonationDate",CASE WHEN d.ineligibility_type='temporary' AND d.ineligible_until <= current_date THEN true ELSE d.eligible END AS eligible,d.eligibility_note AS "eligibilityNote",d.ineligible_until AS "ineligibleUntil",
      h.name AS "hospitalName"
      FROM users u LEFT JOIN donor_profiles d ON d.user_id=u.id LEFT JOIN hospitals h ON h.id=u.hospital_id WHERE u.id=$1`,
      [req.user.id],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
