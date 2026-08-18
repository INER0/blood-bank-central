# Blood Bank Central

Blood Bank Central is a Maldives-focused centralised blood bank application built
as a college project. It connects donors and patients with hospitals and blood
banks, tracks blood inventory from donation to issue, and uses Maldives ID cards
as a common identifier for patient history across facilities.

The project consists of an Expo React Native mobile client, an Express REST API,
and a PostgreSQL database. It currently runs locally with fictional demonstration
records and is not intended for real clinical use.

## Installation and Run Instructions

### Prerequisites

- Node.js 20 LTS or newer and npm 10 or newer
- PostgreSQL 16, or Docker Desktop with Docker Compose
- Expo Go compatible with Expo SDK 54, or an Android emulator
- Git

### Installation

```powershell
git clone <repository-url>
cd "Blood Bank Central"
Copy-Item .env.example .env
npm ci
docker compose up -d
npm run db:migrate
npm run db:seed
```

`npm run db:seed` clears existing application rows before recreating the fictional
demo dataset. Do not run it against a production database. A separately installed
PostgreSQL server can be used by changing `DATABASE_URL` in `.env`.

### Running the application

Start the API in one terminal:

```powershell
npm run dev:api
```

Start Expo in another terminal:

```powershell
npm run dev:mobile
```

Press `a` to open an Android emulator or scan the QR code with Expo Go. For a
physical phone, set `EXPO_PUBLIC_API_URL` to the computer's LAN address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api
```

The phone and computer must share a network and TCP port `4000` must be allowed
through the firewall. Tunnel mode is also available:

```powershell
npm run dev:mobile -- --tunnel
```

All demo accounts use `Password123!`. See [`DEMO_LOGINS.txt`](DEMO_LOGINS.txt)
for the complete public, staff, manager, and administrator account list.

Run development checks with:

```powershell
npm run typecheck
npm test
```

## Features

- **Single role-based login:** One form signs in public users, hospital staff,
  hospital managers, and app administrators, then displays permitted functions.
- **Maldives identity matching:** Maldives ID card or passport numbers connect a
  patient's records across participating facilities.
- **Controlled locations:** Atoll and island selectors prevent inconsistent
  free-text locations and support proximity searches.
- **Donor profiles:** Blood type, contact details, location, donation history, and
  current eligibility are maintained for public users.
- **Nearby donation locations:** Users find hospitals within 2.5, 5, 10, or 25 km
  and view their donation days and opening hours.
- **Blood availability:** Stock is reviewed by blood type, period, region,
  facility, and nearby available donor count.
- **Walk-in donations:** The Donate area shows facilities and current blood needs
  without an appointment or booking workflow.
- **Blood requests:** Users create and edit requests with identity, region,
  hospital, blood type, urgency, units, contact privacy, and notes.
- **Hospital request queue:** Staff search active/completed requests, compare
  facilities, and assign compatible blood bags or donors.
- **Inventory CRUD:** Staff create, scan, edit, filter, reserve, issue, quarantine,
  expire, dispose of, and delete blood bags.
- **Expiry prioritisation:** Compatible stock that expires sooner is prioritised
  when staff reserve or issue blood.
- **Bag traceability:** Each bag links to its donor, optional patient, responsible
  staff, facility, status, notes, and reservation/issue timestamps.
- **QR labels and printing:** Staff generate QR bag tags and use the device's print
  service.
- **Patient history:** Staff create walk-in users, edit patient details, and add or
  update medical history attributed to a hospital and staff member.
- **Eligibility management:** Temporary and permanent deferrals are supported; a
  completed donation produces a three-month ineligibility period.
- **Hospital groups:** Hospital managers administer staff proxy accounts belonging
  to the same hospital group.
- **Application administration:** App administrators manage hospitals, approvals,
  accounts, and central system activity.
- **Audit trail:** Important operations retain the actor, affected entity, details,
  and timestamp.

## Screenshots

Actual screenshots must be captured from the final emulator build before project
submission. No screenshots are currently stored in the repository, so these are
marked pending rather than showing inaccurate mockups.

| Main screen | Required content | File to add |
| --- | --- | --- |
| Authentication | Sign in, registration, ID and location fields | `docs/screenshots/01-auth.png` |
| Public home | User summary, eligibility, nearby stock and needs | `docs/screenshots/02-public-home.png` |
| Donate | Nearby hospitals, hours, radius filters and requests | `docs/screenshots/03-donate.png` |
| Create request | Hospital, region, blood details and contact privacy | `docs/screenshots/04-create-request.png` |
| Staff home | Hospital group and operational statistics | `docs/screenshots/05-staff-home.png` |
| Inventory | Status tabs, search, blood filters and bag actions | `docs/screenshots/06-inventory.png` |
| Patients/history | Patient search, details and attributed history | `docs/screenshots/07-patients.png` |
| Request queue | Active/completed views and assignments | `docs/screenshots/08-staff-requests.png` |
| Hospital management | Hospital settings, hours and staff accounts | `docs/screenshots/09-hospital-admin.png` |
| App administration | Hospital approvals and central management | `docs/screenshots/10-app-admin.png` |
| Profile/settings | Account, role, hospital group and settings | `docs/screenshots/11-profile-settings.png` |

After adding each capture, embed it with Markdown such as
`![Public home](docs/screenshots/02-public-home.png)`.

### Navigation flow

```text
Authentication
  -> Public: Home -> Availability -> Donate/Requests -> History -> Profile/Settings
  -> Staff: Overview -> Inventory -> Patients -> Requests -> Profile/Settings
  -> Manager: Staff workspace + Hospital and Staff Management
  -> App Admin: Central Administration and Hospital Approval
```

## Technologies Used

| Layer | Technologies |
| --- | --- |
| Mobile | Expo SDK 54, React 19, React Native 0.81, TypeScript |
| UI | Lucide React Native, React Native Safe Area Context |
| Device APIs | Expo Camera, Expo Location, Expo Print, Expo Status Bar |
| Local storage | React Native Async Storage |
| QR codes | React Native QR Code SVG and React Native SVG |
| API | Node.js, Express 5, CORS, Zod |
| Authentication | JSON Web Tokens and bcrypt password hashing |
| Database | PostgreSQL 16, UUIDs, constraints, indexes, foreign keys |
| Database access | `pg` driver with project migration and seed scripts |
| Development | npm workspaces, Docker Compose, Expo CLI |

The app does not use an external clinical API. Camera and location access use
Expo device APIs; application data comes from the local Express API and PostgreSQL.

## Known Issues and Future Improvements

- **Local-only deployment:** A hosted HTTPS API is needed for easy remote testing
  and to avoid changing the API address when Wi-Fi networks change.
- **Expo compatibility:** Expo Go must support SDK 54. A dedicated development
  build or future Expo upgrade would make testing more predictable.
- **Limited automated tests:** Type checking is configured, but comprehensive API,
  permission, integration, and mobile end-to-end tests remain future work.
- **No production security review:** Real use requires secrets management,
  encryption policy, consent, retention rules, backups, monitoring, and a formal
  security and privacy assessment.
- **Fictional data only:** Hospital names support the academic scenario; all people,
  IDs, phone numbers, histories, and credentials are fictional.
- **Print-service dependency:** Label printing depends on services available on the
  mobile device and is not integrated with a dedicated label printer.
- **Location accuracy:** Results depend on location permission, GPS quality, and
  accurate facility coordinates.
- **No offline synchronisation:** Offline caching, synchronisation, and conflict
  resolution are not yet implemented.
- **Future reporting:** Forecasting, wastage reports, notifications, emergency donor
  alerts, national dashboards, CI/CD, monitoring, and disaster recovery can be added.

## Additional Documentation

- [`SOFTWARE_REQUIREMENTS.md`](SOFTWARE_REQUIREMENTS.md): prerequisites, environment
  variables, dependency versions, and setup details.
- [`SYSTEM_SPECIFICATION.md`](SYSTEM_SPECIFICATION.md): roles, workflows, data model,
  functional requirements, and system boundaries.
- [`DEMO_LOGINS.txt`](DEMO_LOGINS.txt): fictional accounts for testing each role.
