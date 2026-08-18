# Blood Bank Central - System Specification

## 1. Project Summary

Blood Bank Central is a college demonstration of a centralised Maldives blood
bank network. It connects public donors and patients with hospitals and blood
banks while maintaining a common patient identity through Maldives ID cards.
The current release is designed for local development and testing, not clinical
or production use.

## 2. System Architecture

The system has three tiers:

1. An Expo React Native mobile client in `apps/mobile`.
2. A REST API built with Express in `apps/api`.
3. A PostgreSQL relational database accessed through the `pg` driver.

The API issues JSON Web Tokens after authentication. Passwords are stored as
bcrypt hashes. Role checks on API routes control access to public, hospital staff,
hospital manager, and application administrator functions.

## 3. User Roles

| Role | Scope |
| --- | --- |
| Public user | Maintains a donor/patient profile, views availability and nearby facilities, creates and edits blood requests, and reviews donation eligibility/history |
| Hospital staff | Acts on behalf of one hospital group; manages inventory, patients, history, requests, donors, and assignments |
| Hospital manager | Has staff capabilities plus hospital settings and staff-account administration for their hospital |
| App administrator | Manages and approves hospitals and oversees application-level accounts and activity |

Authentication uses one sign-in form. The API determines the account role and
the client presents the appropriate interface. Staff profiles must show their
hospital group.

## 4. Functional Requirements

### Authentication and identity

- Public users can create accounts with name, email, phone, password confirmation,
  blood type, atoll, and island.
- A Maldives ID card or passport identifies a patient; Maldives ID is the primary
  shared identifier for matching history across facilities.
- A staff-created walk-in patient can later register with the same ID and receive
  access to the existing linked history.
- Forms return field-specific validation messages for missing or invalid values.
- Atolls and islands are selected from controlled Maldives location data rather
  than entered as unrestricted text.

### Hospitals and staff

- A hospital is the parent account/group.
- Hospital managers create and manage multiple staff proxy accounts belonging to
  that hospital.
- Hospitals store address, atoll, island, coordinates, phone, donation opening and
  closing hours, donation days, enabled state, and approval state.
- Staff access is restricted to authorised hospital workflows, with network-wide
  visibility only where the feature requires it.

### Donors and patients

- Staff can create, search, view, and edit donor/patient records.
- Donor profiles store blood type, birth date, last donation date, eligibility,
  deferral reason, temporary/permanent deferral type, and an optional end date.
- Patient history supports add, view, edit, and audit attribution to the hospital
  and staff member that created or changed an entry.
- History entries support clinical notes, diagnoses, procedures, transfusions,
  and other events.
- A completed donation or donation assignment makes the donor temporarily
  ineligible for three months and records the change in history.

### Blood inventory

- Staff can create, scan, view, edit, filter, and delete blood-bag records.
- A bag records its unique code, donor, blood type, component, volume, collection
  and expiry dates, hospital, storage location, notes, and status.
- Supported statuses are available, reserved, issued, quarantined, expired, and
  disposed.
- Reserved or issued stock can optionally be assigned to a patient.
- Reservation and issue records show the responsible staff member, facility,
  patient, and timestamps.
- Inventory views separate status groups and support search and blood-type filters.
- Assignment choices prioritise compatible units that expire soonest.
- Staff can generate a QR blood-bag tag and open the device print service.

### Blood availability and proximity

- Availability summaries can be filtered by blood type and a clearly labelled
  stock/expiry period.
- Users can filter facilities by region or search within 2.5 km, 5 km, 10 km, or
  25 km.
- Hospital/blood-bank details show current blood types, stock, location, and
  donation hours.
- The system displays available donor counts for the selected area and blood type.

### Blood requests

- Public users and staff can create requests containing patient identity, blood
  type, units, urgency, required date, region, receiving hospital, contact details,
  visibility, and additional information.
- Contact details may be public or staff-only. Staff can see either value when
  authorised. Selecting staff-only hides the contact detail from public users;
  it does not hide the blood request itself.
- Users can view and edit their previous requests.
- Staff can search requests, filter between their hospital and other hospitals,
  edit requests, assign compatible blood bags or donors, and mark requests complete.
- Active and completed requests are displayed separately, and request cards open
  a complete details view with permitted contact actions.

### Donation workflow

- Donation is walk-in only; appointment and booking functionality is not part of
  the current system.
- The Donate view shows nearby hospitals/blood banks, donation hours, and public
  blood needs.
- Public users can create a blood request from the Donate view.

### Audit

- Significant inventory, request, donor eligibility, history, hospital, and
  account actions create audit-log records.
- An audit entry records the actor, action, entity type, entity ID, structured
  details, and timestamp.

## 5. Data Model

| Entity | Purpose |
| --- | --- |
| `hospitals` | Facility identity, Maldives location, donation hours, and approval |
| `users` | Authentication, role, contact details, ID document, location, and hospital membership |
| `donor_profiles` | Blood type and donation eligibility information |
| `patient_history_entries` | Hospital-attributed clinical and donation history |
| `blood_bags` | Traceable inventory from donor through reservation or issue |
| `blood_requests` | Patient blood needs, location, facility, urgency, and visibility |
| `request_blood_bag_assignments` | Blood bags allocated to requests |
| `request_donor_assignments` | Donors allocated to requests |
| `audit_logs` | Immutable-style activity records for accountability |

Primary records use PostgreSQL UUIDs. Blood bag codes are unique. Emails are
unique, and identification type plus normalised identification number is unique
when supplied. Foreign keys preserve donor, patient, hospital, staff, request,
and inventory relationships.

## 6. Demo Dataset

Running `npm run db:seed` creates:

- 6 Maldives hospitals
- 1 app administrator
- 6 hospital managers and 6 hospital staff members
- 16 public donor/patient users across all eight blood groups
- 16 donor profiles with eligible, temporary, and permanent eligibility examples
- 36 blood bags with varied components and statuses
- 6 active/completed blood requests
- 7 patient history entries
- 4 blood-bag assignments and 3 donor assignments
- 7 audit-log entries

Names of hospitals are used for the academic demonstration. All individual names,
ID numbers, phone numbers, records, and credentials are fictional.

## 7. Non-Functional Requirements

- The interface must remain usable on common Android phone sizes without clipped
  controls or overlapping text.
- API validation must reject malformed or incomplete data with useful messages.
- Passwords must never be stored in plain text in PostgreSQL.
- Authorisation must be enforced by the API, not only hidden in the mobile client.
- Database changes should use migrations, and demo data must remain reproducible.
- Inventory and patient operations must retain actor and facility attribution.
- Proximity calculations require valid controlled locations or coordinates.
- Personally identifying and clinical data must not be treated as production-safe
  until encryption, privacy policy, retention, backup, monitoring, and a formal
  security review are implemented.

## 8. Current Boundaries

- Local development is the supported deployment model.
- The system contains fictional data and is not approved for real patient care.
- Expo Go requires a client compatible with Expo SDK 54; a newer incompatible Expo
  Go build requires upgrading the project or installing a matching development client.
- Network URLs can change when the computer changes Wi-Fi networks unless tunnel
  mode, a stable hostname, or a deployed API is used.
- No appointment tables or appointment workflow are included because donations
  are walk-in only.
