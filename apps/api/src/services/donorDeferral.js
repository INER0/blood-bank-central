export async function deferDonor({
  client,
  donorId,
  hospitalId,
  actorId,
  eventDate,
  event,
}) {
  const result = await client.query(
    `UPDATE donor_profiles
     SET eligible=false,
         eligibility_note=$2,
         ineligibility_type='temporary',
         ineligible_until=($1::date + interval '3 months')::date,
         last_donation_date=CASE WHEN $3='donation' THEN $1::date ELSE last_donation_date END
     WHERE user_id=$4
     RETURNING ineligible_until::text AS ineligible_until`,
    [
      eventDate,
      event === "donation"
        ? "Three-month deferral following a blood donation"
        : "Three-month deferral after assignment to donate",
      event,
      donorId,
    ],
  );
  if (!result.rowCount) throw new Error("Donor profile not found");
  const until = result.rows[0].ineligible_until;
  await client.query(
    `INSERT INTO patient_history_entries
      (patient_id,hospital_id,created_by,entry_type,title,details,occurred_at)
     VALUES ($1,$2,$3,'procedure',$4,$5,$6)`,
    [
      donorId,
      hospitalId,
      actorId,
      event === "donation" ? "Blood donation recorded" : "Assigned to donate",
      event === "donation"
        ? `Donation recorded. Not eligible to donate again until ${until}.`
        : `Assigned as a donor. Not eligible to donate again until ${until}.`,
      eventDate,
    ],
  );
  return until;
}

export const effectiveEligibilitySql = `(d.eligible OR (d.ineligibility_type='temporary' AND d.ineligible_until <= current_date))`;
