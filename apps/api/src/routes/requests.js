import { Router } from "express";
import { z } from "zod";
import { pool, query } from "../db/pool.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validMaldivesLocation } from "../data/maldivesLocations.js";
import { deferDonor } from "../services/donorDeferral.js";

const router = Router();
router.use(authenticate);

router.get("/community", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT r.id,r.blood_type AS "bloodType",r.units,r.urgency,r.needed_by AS "neededBy",
    CASE WHEN r.visibility='public' THEN r.contact_detail ELSE NULL END AS "contactDetail",
    r.notes,h.name AS hospital,r.request_atoll AS atoll,r.request_island AS island
    FROM blood_requests r JOIN hospitals h ON h.id=r.hospital_id LEFT JOIN users u ON u.id=$1
    WHERE r.status IN ('pending','accepted')
    ORDER BY CASE WHEN r.request_island=u.island THEN 0 WHEN r.request_atoll=u.atoll THEN 1 ELSE 2 END,
    CASE r.urgency WHEN 'critical' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END,r.created_at DESC`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const staff = req.user.role !== "public";
    const result = await query(
      `SELECT r.id,r.patient_name AS "patientName",r.patient_id_type AS "patientIdType",
      r.patient_id_number AS "patientIdNumber",r.blood_type AS "bloodType",r.units,r.urgency,r.status,
      r.needed_by AS "neededBy",r.request_atoll AS atoll,r.request_island AS island,r.contact_detail AS "contactDetail",
      r.notes,r.visibility,r.created_at AS "createdAt",h.id AS "hospitalId",h.name AS hospital,
      coalesce((SELECT json_agg(json_build_object('id',b.id,'code',b.code,'bloodType',b.blood_type,'status',b.status)) FROM request_blood_bag_assignments a JOIN blood_bags b ON b.id=a.bag_id WHERE a.request_id=r.id),'[]'::json) AS "assignedBags",
      coalesce((SELECT json_agg(json_build_object('id',u.id,'fullName',u.full_name,'bloodType',d.blood_type,'phone',u.phone,'identificationNumber',u.identification_number)) FROM request_donor_assignments a JOIN users u ON u.id=a.donor_id LEFT JOIN donor_profiles d ON d.user_id=u.id WHERE a.request_id=r.id),'[]'::json) AS "assignedDonors"
      FROM blood_requests r JOIN hospitals h ON h.id=r.hospital_id
      WHERE ${staff ? "TRUE" : "r.requester_id=$1"}
      ORDER BY CASE r.urgency WHEN 'critical' THEN 1 WHEN 'urgent' THEN 2 ELSE 3 END,r.created_at DESC`,
      staff ? [] : [req.user.id],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get(
  "/:id/candidates",
  authorize("hospital_staff", "hospital_manager", "admin"),
  async (req, res, next) => {
    try {
      const requestResult = await query(
        `SELECT id,hospital_id,blood_type,request_atoll,request_island FROM blood_requests WHERE id=$1`,
        [req.params.id],
      );
      if (!requestResult.rowCount)
        return res.status(404).json({ message: "Request not found" });
      const item = requestResult.rows[0];
      const [bags, donors] = await Promise.all([
        query(
          `SELECT b.id,b.code,b.blood_type AS "bloodType",b.component,b.expires_at AS "expiresAt",b.storage_location AS "storageLocation" FROM blood_bags b WHERE b.hospital_id=$1 AND b.blood_type=$2 AND b.status='available' AND NOT EXISTS (SELECT 1 FROM request_blood_bag_assignments a WHERE a.bag_id=b.id) ORDER BY b.expires_at`,
          [item.hospital_id, item.blood_type],
        ),
        query(
          `SELECT u.id,u.full_name AS "fullName",u.phone,u.identification_number AS "identificationNumber",u.atoll,u.island,d.blood_type AS "bloodType",d.last_donation_date AS "lastDonationDate" FROM users u JOIN donor_profiles d ON d.user_id=u.id WHERE u.role='public' AND u.active AND (d.eligible OR (d.ineligibility_type='temporary' AND d.ineligible_until <= current_date)) AND d.blood_type=$1 AND NOT EXISTS (SELECT 1 FROM request_donor_assignments a WHERE a.request_id=$2 AND a.donor_id=u.id) ORDER BY CASE WHEN u.island=$3 THEN 0 WHEN u.atoll=$4 THEN 1 ELSE 2 END,u.full_name`,
          [item.blood_type, item.id, item.request_island, item.request_atoll],
        ),
      ]);
      res.json({ bags: bags.rows, donors: donors.rows });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/:id/assignments",
  authorize("hospital_staff", "hospital_manager", "admin"),
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      const input = z
        .object({ kind: z.enum(["bag", "donor"]), targetId: z.uuid() })
        .parse(req.body);
      await client.query("BEGIN");
      const requestResult = await client.query(
        `SELECT id,hospital_id,blood_type FROM blood_requests WHERE id=$1 AND status IN ('pending','accepted') FOR UPDATE`,
        [req.params.id],
      );
      if (!requestResult.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Active request not found" });
      }
      const requestItem = requestResult.rows[0];
      if (input.kind === "bag") {
        const bag = await client.query(
          `SELECT id FROM blood_bags WHERE id=$1 AND hospital_id=$2 AND blood_type=$3 AND status='available' FOR UPDATE`,
          [input.targetId, requestItem.hospital_id, requestItem.blood_type],
        );
        if (!bag.rowCount) {
          await client.query("ROLLBACK");
          return res.status(409).json({
            message: "This matching blood bag is no longer available",
          });
        }
        await client.query(
          `INSERT INTO request_blood_bag_assignments (request_id,bag_id,assigned_by) VALUES ($1,$2,$3)`,
          [req.params.id, input.targetId, req.user.id],
        );
        await client.query(
          `UPDATE blood_bags SET status='reserved',reserved_by=$2,reserved_at=now() WHERE id=$1`,
          [input.targetId, req.user.id],
        );
      } else {
        const donor = await client.query(
          `SELECT u.id FROM users u JOIN donor_profiles d ON d.user_id=u.id WHERE u.id=$1 AND u.role='public' AND u.active AND (d.eligible OR (d.ineligibility_type='temporary' AND d.ineligible_until <= current_date)) AND d.blood_type=$2`,
          [input.targetId, requestItem.blood_type],
        );
        if (!donor.rowCount) {
          await client.query("ROLLBACK");
          return res.status(409).json({
            message:
              "This donor is not currently eligible for the requested blood type",
          });
        }
        await client.query(
          `INSERT INTO request_donor_assignments (request_id,donor_id,assigned_by) VALUES ($1,$2,$3)`,
          [req.params.id, input.targetId, req.user.id],
        );
        await deferDonor({
          client,
          donorId: input.targetId,
          hospitalId: requestItem.hospital_id,
          actorId: req.user.id,
          eventDate: new Date().toISOString().slice(0, 10),
          event: "assignment",
        });
      }
      await client.query(
        `UPDATE blood_requests SET status='accepted' WHERE id=$1 AND status='pending'`,
        [req.params.id],
      );
      await client.query("COMMIT");
      res.status(201).json({ assigned: true });
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  },
);

router.delete(
  "/:id/assignments/:kind/:targetId",
  authorize("hospital_staff", "hospital_manager", "admin"),
  async (req, res, next) => {
    const client = await pool.connect();
    try {
      const kind = z.enum(["bag", "donor"]).parse(req.params.kind);
      await client.query("BEGIN");
      const owned = await client.query(
        `SELECT 1 FROM blood_requests WHERE id=$1`,
        [req.params.id],
      );
      if (!owned.rowCount) {
        await client.query("ROLLBACK");
        return res.status(404).json({ message: "Request not found" });
      }
      if (kind === "bag") {
        const removed = await client.query(
          `DELETE FROM request_blood_bag_assignments WHERE request_id=$1 AND bag_id=$2 RETURNING bag_id`,
          [req.params.id, req.params.targetId],
        );
        if (removed.rowCount)
          await client.query(
            `UPDATE blood_bags SET status='available',reserved_by=NULL,reserved_at=NULL WHERE id=$1 AND status='reserved'`,
            [req.params.targetId],
          );
      } else
        await client.query(
          `DELETE FROM request_donor_assignments WHERE request_id=$1 AND donor_id=$2`,
          [req.params.id, req.params.targetId],
        );
      await client.query("COMMIT");
      res.status(204).end();
    } catch (error) {
      await client.query("ROLLBACK");
      next(error);
    } finally {
      client.release();
    }
  },
);

router.post("/", async (req, res, next) => {
  try {
    const input = z
      .object({
        hospitalId: z.uuid(),
        patientName: z.string().min(2),
        patientIdType: z.enum(["maldives_id", "passport"]),
        patientIdNumber: z.string().trim().min(5).max(30),
        bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
        units: z.number().int().min(1).max(20),
        urgency: z.enum(["normal", "urgent", "critical"]),
        neededBy: z.iso.date(),
        atoll: z.string().trim().min(2).max(80),
        island: z.string().trim().min(2).max(80),
        contactDetail: z.string().trim().min(7).max(120),
        visibility: z.enum(["public", "staff_only"]),
        notes: z.string().trim().max(500).optional(),
      })
      .refine((value) => validMaldivesLocation(value.atoll, value.island), {
        message: "Select a valid island for the chosen atoll",
        path: ["island"],
      })
      .refine(
        (value) =>
          value.patientIdType !== "maldives_id" ||
          /^A\d{6}$/i.test(value.patientIdNumber),
        {
          message: "Maldives ID must be A followed by 6 digits",
          path: ["patientIdNumber"],
        },
      )
      .parse(req.body);
    const result = await query(
      `INSERT INTO blood_requests (requester_id,hospital_id,patient_name,patient_id_type,patient_id_number,blood_type,units,urgency,needed_by,request_atoll,request_island,contact_detail,visibility,notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id,status`,
      [
        req.user.id,
        input.hospitalId,
        input.patientName,
        input.patientIdType,
        input.patientIdNumber.toUpperCase(),
        input.bloodType,
        input.units,
        input.urgency,
        input.neededBy,
        input.atoll,
        input.island,
        input.contactDetail,
        input.visibility,
        input.notes || null,
      ],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/:id",
  authorize("public", "hospital_staff", "hospital_manager", "admin"),
  async (req, res, next) => {
    try {
      const input = z
        .object({
          patientName: z.string().trim().min(2).max(120),
          patientIdType: z.enum(["maldives_id", "passport"]),
          patientIdNumber: z.string().trim().min(5).max(30),
          bloodType: z.enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]),
          units: z.number().int().min(1).max(20),
          urgency: z.enum(["normal", "urgent", "critical"]),
          neededBy: z.iso.date(),
          contactDetail: z.string().trim().max(120),
          visibility: z.enum(["public", "staff_only"]),
          notes: z.string().trim().max(500).optional(),
        })
        .refine(
          (value) =>
            value.patientIdType !== "maldives_id" ||
            /^A\d{6}$/i.test(value.patientIdNumber),
          {
            message: "Maldives ID must be A followed by 6 digits",
            path: ["patientIdNumber"],
          },
        )
        .parse(req.body);
      const result = await query(
        `UPDATE blood_requests SET patient_name=$1,patient_id_type=$2,patient_id_number=$3,blood_type=$4,units=$5,urgency=$6,needed_by=$7,contact_detail=$8,visibility=$9,notes=$10
         WHERE id=$11 AND status<>'fulfilled' AND ($12::boolean OR requester_id=$13) RETURNING id`,
        [
          input.patientName,
          input.patientIdType,
          input.patientIdNumber.toUpperCase(),
          input.bloodType,
          input.units,
          input.urgency,
          input.neededBy,
          input.contactDetail,
          input.visibility,
          input.notes || null,
          req.params.id,
          req.user.role !== "public",
          req.user.id,
        ],
      );
      if (!result.rowCount)
        return res.status(404).json({
          message: "Request not found, completed, or not owned by this account",
        });
      await query(
        "INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES ($1,'blood_request_updated','blood_request',$2,$3)",
        [req.user.id, req.params.id, JSON.stringify(input)],
      );
      res.json({ updated: true });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/status",
  authorize("hospital_staff", "hospital_manager", "admin"),
  async (req, res, next) => {
    try {
      const status = z
        .enum(["accepted", "rejected", "fulfilled"])
        .parse(req.body.status);
      const result = await query(
        "UPDATE blood_requests SET status=$1 WHERE id=$2 RETURNING id,status",
        [status, req.params.id],
      );
      if (!result.rowCount)
        return res.status(404).json({ message: "Request not found" });
      await query(
        "INSERT INTO audit_logs (actor_id,action,entity_type,entity_id,details) VALUES ($1,'request_status_changed','blood_request',$2,$3)",
        [req.user.id, req.params.id, JSON.stringify({ status })],
      );
      if (status === "fulfilled")
        await query(
          `UPDATE blood_bags b SET status='issued',assigned_patient_id=patient.id,issued_by=$2,issued_at=now() FROM request_blood_bag_assignments a JOIN blood_requests r ON r.id=a.request_id LEFT JOIN users patient ON upper(patient.identification_number)=upper(r.patient_id_number) AND patient.role='public' WHERE a.bag_id=b.id AND a.request_id=$1`,
          [req.params.id, req.user.id],
        );
      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
