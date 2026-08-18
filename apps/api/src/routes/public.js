import { Router } from "express";
import { z } from "zod";
import { query } from "../db/pool.js";

const router = Router();

router.get("/availability", async (req, res, next) => {
  try {
    const bloodType = String(req.query.bloodType || "");
    const atoll = String(req.query.atoll || "");
    const island = String(req.query.island || "");
    const latitude = Number(req.query.latitude || 0);
    const longitude = Number(req.query.longitude || 0);
    const radiusKm = Math.min(Number(req.query.radiusKm || 0), 1000);
    const windowDays = [7, 30].includes(Number(req.query.windowDays))
      ? Number(req.query.windowDays)
      : 0;
    const result = await query(
      `SELECT h.id AS "hospitalId", h.name AS hospital, h.city, h.atoll, h.island,
      h.latitude,h.longitude,b.blood_type AS "bloodType", count(*)::int AS units,
      count(*) FILTER (WHERE b.expires_at<=current_date+7)::int AS "expiringSoon",
      CASE WHEN $4::numeric<>0 AND h.latitude IS NOT NULL THEN round((6371*acos(least(1,cos(radians($4::numeric))*cos(radians(h.latitude))*cos(radians(h.longitude)-radians($5::numeric))+sin(radians($4::numeric))*sin(radians(h.latitude)))))::numeric,1) END AS "distanceKm"
      FROM blood_bags b JOIN hospitals h ON h.id=b.hospital_id
      WHERE b.status='available' AND b.expires_at > current_date AND h.approved
      AND ($1='' OR b.blood_type=$1) AND ($2='' OR h.atoll=$2) AND ($3='' OR h.island=$3)
      AND ($6::numeric=0 OR (h.latitude IS NOT NULL AND 6371*acos(least(1,cos(radians($4::numeric))*cos(radians(h.latitude))*cos(radians(h.longitude)-radians($5::numeric))+sin(radians($4::numeric))*sin(radians(h.latitude)))) <= $6::numeric))
      AND ($7::integer=0 OR b.expires_at<=current_date+$7::integer)
      GROUP BY h.id,h.name,h.city,h.atoll,h.island,b.blood_type
      ORDER BY CASE WHEN $6::numeric>0 THEN CASE WHEN h.latitude IS NULL THEN 1 ELSE 0 END ELSE 0 END,
        CASE WHEN h.island=$3 THEN 0 WHEN h.atoll=$2 THEN 1 ELSE 2 END,h.name,b.blood_type`,
      [bloodType, atoll, island, latitude, longitude, radiusKm, windowDays],
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/donors/count", async (req, res, next) => {
  try {
    const result = await query(
      `SELECT count(*)::int AS count FROM donor_profiles d JOIN users u ON u.id=d.user_id
      WHERE (d.eligible OR (d.ineligibility_type='temporary' AND d.ineligible_until <= current_date)) AND ($1='' OR d.blood_type=$1) AND ($2='' OR u.atoll=$2) AND ($3='' OR u.island=$3)`,
      [
        String(req.query.bloodType || ""),
        String(req.query.atoll || ""),
        String(req.query.island || ""),
      ],
    );
    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.get("/hospitals", async (_req, res, next) => {
  try {
    const result = await query(
      "SELECT id,name,address,city,atoll,island,phone,latitude,longitude FROM hospitals WHERE approved ORDER BY name",
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get("/donation-centres", async (_req, res, next) => {
  try {
    const result = await query(
      `SELECT id,name,address,city,atoll,island,phone,latitude,longitude,
      donation_open_time AS "opensAt",donation_close_time AS "closesAt",
      donation_days AS "donationDays"
      FROM hospitals WHERE approved AND donations_enabled
      ORDER BY atoll,island,name`,
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post("/hospitals/register", async (req, res, next) => {
  try {
    const input = z
      .object({
        name: z.string().trim().min(3),
        address: z.string().trim().min(5),
        atoll: z.string().trim().min(2),
        island: z.string().trim().min(2),
        phone: z.string().trim().min(7).max(30),
      })
      .parse(req.body);
    const result = await query(
      `INSERT INTO hospitals (name,address,city,atoll,island,phone,approved)
      VALUES ($1,$2,$3,$4,$3,$5,false) RETURNING id,name,atoll,island,approved`,
      [input.name, input.address, input.island, input.atoll, input.phone],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
