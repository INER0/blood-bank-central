import { Router } from "express";
import { query } from "../db/pool.js";
import { pool } from "../db/pool.js";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { validMaldivesLocation } from "../data/maldivesLocations.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

const router = Router();
router.use(
  authenticate,
  authorize("hospital_staff", "hospital_manager", "admin"),
);

router.get("/", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const result = await query(
      `SELECT u.id,u.full_name AS "fullName",u.phone,u.email,u.atoll,u.island,
      u.identification_type AS "identificationType",u.identification_number AS "identificationNumber",
      d.blood_type AS "bloodType",CASE WHEN d.ineligibility_type='temporary' AND d.ineligible_until <= current_date THEN true ELSE d.eligible END AS eligible,d.last_donation_date AS "lastDonationDate",
      count(DISTINCT b.id)::int AS "donationCount"
      FROM users u JOIN donor_profiles d ON d.user_id=u.id LEFT JOIN blood_bags b ON b.donor_id=u.id
        AND ($1::uuid IS NULL OR b.hospital_id=$1)
      WHERE u.role='public' AND ($2='' OR u.full_name ILIKE '%'||$2||'%' OR u.identification_number ILIKE '%'||$2||'%' OR u.phone ILIKE '%'||$2||'%')
      GROUP BY u.id,d.user_id ORDER BY u.full_name LIMIT 100`,
      [req.user.hospitalId || null, search],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const input = z
      .object({
        registrationType: z.enum(["patient", "donor"]),
        fullName: z.string().trim().min(2).max(100),
        email: z.union([z.email(), z.literal("")]).optional(),
        phone: z.string().trim().min(7).max(30),
        atoll: z.string().trim().min(2).max(80),
        island: z.string().trim().min(2).max(80),
        identificationType: z.enum(["maldives_id", "passport"]),
        identificationNumber: z.string().trim().min(5).max(30),
        bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
      })
      .refine((value) => validMaldivesLocation(value.atoll, value.island), {
        message: "Select a valid island for the chosen atoll",
        path: ["island"],
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
    if (!req.user.hospitalId)
      return res.status(400).json({ message: "Staff hospital is required" });
    const identificationNumber = input.identificationNumber.toUpperCase();
    const generatedEmail = `${identificationNumber.toLowerCase().replace(/[^a-z0-9]/g, "")}@walkin.local`;
    const email = (input.email || generatedEmail).toLowerCase();
    const temporaryPassword = `BBC-${randomBytes(5).toString("hex")}`;
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const user = await client.query(
        `INSERT INTO users (email,password_hash,full_name,phone,atoll,island,identification_type,identification_number)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,email,full_name AS "fullName"`,
        [
          email,
          passwordHash,
          input.fullName,
          input.phone,
          input.atoll,
          input.island,
          input.identificationType,
          identificationNumber,
        ],
      );
      const donorEligible = input.registrationType === "donor";
      await client.query(
        `INSERT INTO donor_profiles (user_id,blood_type,eligible,eligibility_note,ineligibility_type)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          user.rows[0].id,
          input.bloodType,
          donorEligible,
          donorEligible ? null : "Registered as a patient only",
          donorEligible ? null : "permanent",
        ],
      );
      await client.query(
        `INSERT INTO patient_history_entries (patient_id,hospital_id,created_by,entry_type,title,details,occurred_at)
         VALUES ($1,$2,$3,'other',$4,$5,current_date)`,
        [
          user.rows[0].id,
          req.user.hospitalId,
          req.user.id,
          donorEligible
            ? "Walk-in donor registered"
            : "Walk-in patient registered",
          `Registered by hospital staff as a walk-in ${input.registrationType}.`,
        ],
      );
      await client.query(
        `INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details)
         VALUES ($1,'walk_in_user_created','patient',$2,$3)`,
        [
          req.user.id,
          user.rows[0].id,
          JSON.stringify({ registrationType: input.registrationType, email }),
        ],
      );
      await client.query("COMMIT");
      res.status(201).json({
        ...user.rows[0],
        temporaryPassword,
        registrationType: input.registrationType,
      });
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

router.get("/:id", async (req, res, next) => {
  try {
    const profile = await query(
      `SELECT u.id,u.full_name AS "fullName",u.phone,u.email,u.atoll,u.island,
      u.identification_type AS "identificationType",u.identification_number AS "identificationNumber",
      d.blood_type AS "bloodType",d.date_of_birth AS "dateOfBirth",CASE WHEN d.ineligibility_type='temporary' AND d.ineligible_until <= current_date THEN true ELSE d.eligible END AS eligible,d.eligibility_note AS "eligibilityNote",
      d.ineligibility_type AS "ineligibilityType",d.ineligible_until AS "ineligibleUntil",d.last_donation_date AS "lastDonationDate"
      FROM users u JOIN donor_profiles d ON d.user_id=u.id WHERE u.id=$1 AND u.role='public'`,
      [req.params.id],
    );
    if (!profile.rowCount)
      return res.status(404).json({ message: "Patient not found" });
    const hospitalId = req.user.hospitalId || null;
    const [
      donations,
      receivedBags,
      manualHistory,
      changes,
      requests,
    ] = await Promise.all([
      query(
        `SELECT b.id,b.code,b.blood_type AS "bloodType",b.component,b.volume_ml AS "volumeMl",b.collected_at AS date,b.status,h.name AS hospital
        FROM blood_bags b JOIN hospitals h ON h.id=b.hospital_id WHERE b.donor_id=$1 AND ($2::uuid IS NULL OR b.hospital_id=$2) ORDER BY b.collected_at DESC`,
        [req.params.id, hospitalId],
      ),
      query(
        `SELECT b.id,b.code,b.blood_type AS "bloodType",b.component,b.status,b.collected_at AS date,h.name AS hospital
          FROM blood_bags b JOIN hospitals h ON h.id=b.hospital_id WHERE b.assigned_patient_id=$1
          AND b.status IN ('reserved','issued') AND ($2::uuid IS NULL OR b.hospital_id=$2) ORDER BY b.created_at DESC`,
        [req.params.id, hospitalId],
      ),
      query(
        `SELECT e.id,e.entry_type AS "entryType",e.title,e.details,e.occurred_at AS date,e.created_at AS "createdAt",
        e.updated_at AS "updatedAt",h.name AS hospital,u.full_name AS "staffName",editor.full_name AS "updatedByName"
        FROM patient_history_entries e JOIN hospitals h ON h.id=e.hospital_id JOIN users u ON u.id=e.created_by LEFT JOIN users editor ON editor.id=e.updated_by
        WHERE e.patient_id=$1 AND ($2::uuid IS NULL OR e.hospital_id=$2) ORDER BY e.occurred_at DESC,e.created_at DESC`,
        [req.params.id, hospitalId],
      ),
      query(
        `SELECT l.id,l.created_at AS date,l.details->'changes' AS changes,u.full_name AS "staffName",
        coalesce(h.name,'Network administration') AS hospital
        FROM audit_logs l JOIN users u ON u.id=l.actor_id LEFT JOIN hospitals h ON h.id=u.hospital_id
        WHERE l.entity_type='patient' AND l.entity_id=$1 AND l.action='patient_updated'
        AND ($2::uuid IS NULL OR u.hospital_id=$2) ORDER BY l.created_at DESC`,
        [req.params.id, hospitalId],
      ),
      query(
        `SELECT r.id,r.blood_type AS "bloodType",r.units,r.urgency,r.status,r.needed_by AS date,h.name AS hospital
        FROM blood_requests r JOIN hospitals h ON h.id=r.hospital_id JOIN users patient ON patient.id=$1
        WHERE (r.requester_id=$1 OR upper(r.patient_id_number)=upper(patient.identification_number))
        AND ($2::uuid IS NULL OR r.hospital_id=$2) ORDER BY r.created_at DESC`,
        [req.params.id, hospitalId],
      ),
    ]);
    res.json({
      ...profile.rows[0],
      donations: donations.rows,
      requests: requests.rows,
      changes: changes.rows,
      manualHistory: manualHistory.rows,
      receivedBags: receivedBags.rows,
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const input = z
      .object({
        fullName: z.string().trim().min(2).max(100),
        phone: z.string().trim().min(7).max(30),
        atoll: z.string().trim().min(2).max(80),
        island: z.string().trim().min(2).max(80),
        identificationType: z.enum(["maldives_id", "passport"]),
        identificationNumber: z.string().trim().min(5).max(30),
        bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
        eligible: z.boolean(),
        eligibilityNote: z.string().trim().max(300).optional(),
        ineligibilityType: z
          .enum(["temporary", "permanent"])
          .nullable()
          .optional(),
        ineligibleUntil: z.iso.date().nullable().optional(),
      })
      .refine((v) => validMaldivesLocation(v.atoll, v.island), {
        message: "Select a valid island for the chosen atoll",
        path: ["island"],
      })
      .refine(
        (v) =>
          v.identificationType !== "maldives_id" ||
          /^A\d{6}$/i.test(v.identificationNumber),
        {
          message: "Maldives ID must be A followed by 6 digits",
          path: ["identificationNumber"],
        },
      )
      .parse(req.body);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const before = (
        await client.query(
          `SELECT u.full_name AS "fullName",u.phone,u.atoll,u.island,u.identification_type AS "identificationType",u.identification_number AS "identificationNumber",d.blood_type AS "bloodType",d.eligible,d.eligibility_note AS "eligibilityNote",d.ineligibility_type AS "ineligibilityType",d.ineligible_until::text AS "ineligibleUntil" FROM users u JOIN donor_profiles d ON d.user_id=u.id WHERE u.id=$1 AND u.role='public' FOR UPDATE`,
          [req.params.id],
        )
      ).rows[0];
      if (!before) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Patient not found" });
      }
      if (!input.eligible && !input.ineligibilityType)
        return res
          .status(400)
          .json({ message: "Choose temporary or permanent ineligibility" });
      if (
        !input.eligible &&
        input.ineligibilityType === "temporary" &&
        !input.ineligibleUntil
      )
        return res
          .status(400)
          .json({ message: "Temporary ineligibility requires an end date" });
      const normalized = {
        ...input,
        identificationNumber: input.identificationNumber.toUpperCase(),
        eligibilityNote: input.eligibilityNote || null,
        ineligibilityType: input.eligible ? null : input.ineligibilityType,
        ineligibleUntil:
          !input.eligible && input.ineligibilityType === "temporary"
            ? input.ineligibleUntil
            : null,
      };
      const changes = {};
      for (const key of Object.keys(normalized)) {
        if ((before[key] ?? null) !== (normalized[key] ?? null))
          changes[key] = {
            from: before[key] ?? null,
            to: normalized[key] ?? null,
          };
      }
      await client.query(
        `UPDATE users SET full_name=$1,phone=$2,atoll=$3,island=$4,identification_type=$5,identification_number=$6 WHERE id=$7`,
        [
          normalized.fullName,
          normalized.phone,
          normalized.atoll,
          normalized.island,
          normalized.identificationType,
          normalized.identificationNumber,
          req.params.id,
        ],
      );
      await client.query(
        `UPDATE donor_profiles SET blood_type=$1,eligible=$2,eligibility_note=$3,ineligibility_type=$4,ineligible_until=$5 WHERE user_id=$6`,
        [
          normalized.bloodType,
          normalized.eligible,
          normalized.eligibilityNote,
          normalized.ineligibilityType,
          normalized.ineligibleUntil,
          req.params.id,
        ],
      );
      if (Object.keys(changes).length)
        await client.query(
          `INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES ($1,'patient_updated','patient',$2,$3)`,
          [req.user.id, req.params.id, JSON.stringify({ changes })],
        );
      await client.query("COMMIT");
      res.json({ id: req.params.id, changes });
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

const historyInput = z.object({
  entryType: z.enum([
    "clinical_note",
    "diagnosis",
    "procedure",
    "transfusion",
    "other",
  ]),
  title: z.string().trim().min(2).max(120),
  details: z.string().trim().min(2).max(2000),
  occurredAt: z.iso.date(),
});

router.post("/:id/history", async (req, res, next) => {
  try {
    const input = historyInput.parse(req.body);
    if (!req.user.hospitalId)
      return res.status(400).json({ message: "Hospital is required" });
    const result = await query(
      `INSERT INTO patient_history_entries (patient_id,hospital_id,created_by,entry_type,title,details,occurred_at) SELECT $1,$2,$3,$4,$5,$6,$7 WHERE EXISTS (SELECT 1 FROM users WHERE id=$1 AND role='public') RETURNING id`,
      [
        req.params.id,
        req.user.hospitalId,
        req.user.id,
        input.entryType,
        input.title,
        input.details,
        input.occurredAt,
      ],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "Patient not found" });
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch("/:id/history/:historyId", async (req, res, next) => {
  try {
    const input = historyInput.parse(req.body);
    const result = await query(
      `UPDATE patient_history_entries SET entry_type=$1,title=$2,details=$3,occurred_at=$4,updated_at=now(),updated_by=$5 WHERE id=$6 AND patient_id=$7 AND ($8::uuid IS NULL OR hospital_id=$8) RETURNING id`,
      [
        input.entryType,
        input.title,
        input.details,
        input.occurredAt,
        req.user.id,
        req.params.historyId,
        req.params.id,
        req.user.hospitalId || null,
      ],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "History entry not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id/history/:historyId", async (req, res, next) => {
  try {
    const result = await query(
      `DELETE FROM patient_history_entries WHERE id=$1 AND patient_id=$2 AND ($3::uuid IS NULL OR hospital_id=$3) RETURNING id`,
      [req.params.historyId, req.params.id, req.user.hospitalId || null],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "History entry not found" });
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
