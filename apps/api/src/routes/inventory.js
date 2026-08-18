import { Router } from "express";
import { z } from "zod";
import { pool, query } from "../db/pool.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { deferDonor } from "../services/donorDeferral.js";

const router = Router();
router.use(
  authenticate,
  authorize("hospital_staff", "hospital_manager", "admin"),
);

router.get("/", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.id,b.code,b.blood_type AS "bloodType",b.component,b.volume_ml AS "volumeMl",
      b.collected_at AS "collectedAt",b.expires_at AS "expiresAt",b.status,b.storage_location AS "storageLocation",b.notes,h.name AS hospital,
      u.id AS "donorId",u.full_name AS "donorName",u.identification_number AS "donorIdentification",u.phone AS "donorPhone",
      recipient.id AS "assignedPatientId",coalesce(recipient.full_name,request_record.patient_name) AS "assignedPatientName",coalesce(recipient.identification_number,request_record.patient_id_number) AS "assignedPatientIdentification",request_record.id AS "requestId",
      b.reserved_at AS "reservedAt",reserved_staff.full_name AS "reservedByName",b.issued_at AS "issuedAt",issued_staff.full_name AS "issuedByName"
      FROM blood_bags b JOIN hospitals h ON h.id=b.hospital_id JOIN users u ON u.id=b.donor_id LEFT JOIN users recipient ON recipient.id=b.assigned_patient_id
      LEFT JOIN request_blood_bag_assignments request_assignment ON request_assignment.bag_id=b.id LEFT JOIN blood_requests request_record ON request_record.id=request_assignment.request_id
      LEFT JOIN users reserved_staff ON reserved_staff.id=b.reserved_by LEFT JOIN users issued_staff ON issued_staff.id=b.issued_by WHERE ($1::uuid IS NULL OR b.hospital_id=$1)
      ORDER BY b.expires_at,b.blood_type`,
      [req.user.hospitalId || null],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/:code", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.id,b.code,b.donor_id AS "donorId",u.full_name AS "donorName",u.identification_number AS "donorIdentification",b.assigned_patient_id AS "assignedPatientId",coalesce(recipient.full_name,request_record.patient_name) AS "assignedPatientName",coalesce(recipient.identification_number,request_record.patient_id_number) AS "assignedPatientIdentification",request_record.id AS "requestId",
      b.blood_type AS "bloodType",b.component,b.volume_ml AS "volumeMl",b.collected_at AS "collectedAt",b.expires_at AS "expiresAt",b.status,b.storage_location AS "storageLocation",b.notes,
      h.name AS hospital,b.reserved_at AS "reservedAt",reserved_staff.full_name AS "reservedByName",b.issued_at AS "issuedAt",issued_staff.full_name AS "issuedByName"
      FROM blood_bags b JOIN hospitals h ON h.id=b.hospital_id JOIN users u ON u.id=b.donor_id LEFT JOIN users recipient ON recipient.id=b.assigned_patient_id
      LEFT JOIN request_blood_bag_assignments request_assignment ON request_assignment.bag_id=b.id LEFT JOIN blood_requests request_record ON request_record.id=request_assignment.request_id
      LEFT JOIN users reserved_staff ON reserved_staff.id=b.reserved_by LEFT JOIN users issued_staff ON issued_staff.id=b.issued_by WHERE b.code=$1 AND ($2::uuid IS NULL OR b.hospital_id=$2)`,
      [req.params.code, req.user.hospitalId || null],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "Blood bag not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  const client = await pool.connect();
  try {
    const input = z
      .object({
        code: z.string().min(4),
        donorId: z.uuid(),
        bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
        component: z.string().default("Whole Blood"),
        volumeMl: z.number().int().positive().default(450),
        collectedAt: z.iso.date(),
        expiresAt: z.iso.date(),
        storageLocation: z.string().optional(),
        notes: z.string().trim().max(1000).optional(),
        assignedPatientId: z.uuid().nullable().optional(),
        hospitalId: z.uuid().optional(),
      })
      .parse(req.body);
    const hospitalId = req.user.hospitalId || input.hospitalId;
    if (!hospitalId)
      return res.status(400).json({ message: "Hospital is required" });
    await client.query("BEGIN");
    const result = await client.query(
      `INSERT INTO blood_bags (code,donor_id,blood_type,component,volume_ml,collected_at,expires_at,hospital_id,storage_location,notes,assigned_patient_id)
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11 WHERE EXISTS (SELECT 1 FROM users WHERE id=$2 AND role='public') RETURNING *`,
      [
        input.code,
        input.donorId,
        input.bloodType,
        input.component,
        input.volumeMl,
        input.collectedAt,
        input.expiresAt,
        hospitalId,
        input.storageLocation || null,
        input.notes || null,
        null,
      ],
    );
    if (!result.rowCount) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "Select a registered donor" });
    }
    await deferDonor({
      client,
      donorId: input.donorId,
      hospitalId,
      actorId: req.user.id,
      eventDate: input.collectedAt,
      event: "donation",
    });
    await client.query("COMMIT");
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query("ROLLBACK");
    next(error);
  } finally {
    client.release();
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const input = z
      .object({
        donorId: z.uuid(),
        bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
        component: z.string().min(2).max(80),
        volumeMl: z.number().int().positive(),
        collectedAt: z.iso.date(),
        expiresAt: z.iso.date(),
        storageLocation: z.string().max(100).optional(),
        notes: z.string().trim().max(1000).optional(),
        assignedPatientId: z.uuid().nullable().optional(),
        status: z.enum([
          "available",
          "reserved",
          "issued",
          "expired",
          "quarantined",
          "disposed",
        ]),
      })
      .refine((value) => value.expiresAt > value.collectedAt, {
        message: "Expiry date must be after collection date",
        path: ["expiresAt"],
      })
      .parse(req.body);
    if (
      ["reserved", "issued"].includes(input.status) &&
      input.assignedPatientId
    ) {
      const patient = await query(
        "SELECT 1 FROM users WHERE id=$1 AND role='public' AND active",
        [input.assignedPatientId],
      );
      if (!patient.rowCount)
        return res.status(400).json({
          message: "Assigned patient must be an active registered patient",
        });
    }
    const result = await query(
      `UPDATE blood_bags SET donor_id=$1,blood_type=$2,component=$3,volume_ml=$4,collected_at=$5,expires_at=$6,storage_location=$7,status=$8::bag_status,notes=$9,assigned_patient_id=$10,
       reserved_by=CASE WHEN $8::text='reserved' AND (status<>'reserved' OR reserved_by IS NULL) THEN $13 ELSE reserved_by END,
       reserved_at=CASE WHEN $8::text='reserved' AND (status<>'reserved' OR reserved_at IS NULL) THEN now() ELSE reserved_at END,
       issued_by=CASE WHEN $8::text='issued' AND (status<>'issued' OR issued_by IS NULL) THEN $13 ELSE issued_by END,
       issued_at=CASE WHEN $8::text='issued' AND (status<>'issued' OR issued_at IS NULL) THEN now() ELSE issued_at END
      WHERE id=$11 AND ($12::uuid IS NULL OR hospital_id=$12) RETURNING id,code`,
      [
        input.donorId,
        input.bloodType,
        input.component,
        input.volumeMl,
        input.collectedAt,
        input.expiresAt,
        input.storageLocation || null,
        input.status,
        input.notes || null,
        ["reserved", "issued"].includes(input.status)
          ? input.assignedPatientId || null
          : null,
        req.params.id,
        req.user.hospitalId || null,
        req.user.id,
      ],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "Blood bag not found" });
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const result = await query(
      "DELETE FROM blood_bags WHERE id=$1 AND ($2::uuid IS NULL OR hospital_id=$2) RETURNING id,code",
      [req.params.id, req.user.hospitalId || null],
    );
    if (!result.rowCount)
      return res.status(404).json({ message: "Blood bag not found" });
    await query(
      "INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES ($1,'blood_bag_deleted','blood_bag',$2,$3)",
      [
        req.user.id,
        req.params.id,
        JSON.stringify({ code: result.rows[0].code }),
      ],
    );
    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

export default router;
