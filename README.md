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

- [Node.js](https://nodejs.org/en/download) 20 LTS or newer (including npm 10
  or newer)
- One database option:
  - [Docker Desktop](https://www.docker.com/products/docker-desktop/) with
    Docker Compose (recommended for the easiest setup). On Windows, Docker
    also requires hardware virtualisation and WSL 2.
  - PostgreSQL 16
- [Expo Go](https://expo.dev/go) compatible with Expo SDK 54, or an Android
  emulator configured through Android Studio
- [Git](https://git-scm.com/downloads)

After installing the prerequisites, open a new PowerShell window and verify them:

```powershell
node --version
npm --version
git --version
docker --version
docker compose version
```

The two Docker commands are required only when using the recommended Docker
database option. If a command is not recognised after installation, restart
PowerShell (and, if necessary, Windows) so the updated `PATH` is loaded. Make
sure Docker Desktop is running before continuing.

#### Windows preparation for Docker Desktop

Docker Desktop runs this project's Linux PostgreSQL container through WSL 2.
Before continuing on Windows:

1. Open **Task Manager > Performance > CPU** and confirm that
   **Virtualization** says **Enabled**. If it is disabled, enable Intel VT-x,
   AMD-V, or SVM Mode in the computer's BIOS/UEFI settings.
2. Open PowerShell as Administrator and run:

   ```powershell
   wsl --install
   ```

3. Restart Windows when requested, open Docker Desktop, and wait until its
   engine reports that it is running.
4. Verify WSL and the Docker engine:

   ```powershell
   wsl --status
   docker info
   ```

If Docker Desktop reports `Virtualization support not detected`, complete steps
1-3 before trying `docker compose`. On a managed computer, an administrator may
need to enable virtualisation. Installing PostgreSQL directly with Option B
avoids the Docker and WSL requirement.

#### PowerShell note for npm

Some Windows PowerShell installations block `npm.ps1` with a message that
running scripts is disabled. In that case, use `npm.cmd` in place of `npm` for
every command in this README; this does not require weakening the PowerShell
execution policy. For example:

```powershell
npm.cmd ci
npm.cmd run db:migrate
npm.cmd run dev:api
```

### Installation

```powershell
git clone <repository-url>
cd blood-bank-central
npm ci
# Create the backend API configuration
Copy-Item .env.example apps/api/.env

# Create the separate mobile app configuration
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Replace `<repository-url>` with the repository's Git URL. If Git creates a
directory with a different name, change `cd blood-bank-central` to that name.

The project contains two applications, and each one needs its own configuration:

- `apps/api/.env` configures the backend and database.
- `apps/mobile/.env` tells the mobile app where it can reach the backend.

Do not copy the root `.env.example` into `apps/mobile`; it contains backend-only
settings.

#### Required: configure the mobile API address

Do this now, before starting Expo. Open the new mobile environment file:

```powershell
notepad apps/mobile/.env
```

If you will use a physical phone, first run `ipconfig` and find the computer's
Wi-Fi adapter **IPv4 Address**. Replace `YOUR_COMPUTER_IP` with that address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api
```

`192.168.1.20` is only an example; do not copy it unless it is actually your
computer's address. The phone and computer must be connected to the same Wi-Fi.
This LAN address normally also works in the Android emulator, so it is the
recommended setting when testing both a phone and an emulator.

If you will use only an Android Studio emulator, use this instead:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:4000/api
```

For web or an iOS simulator running on the same computer, use:

```env
EXPO_PUBLIC_API_URL=http://localhost:4000/api
```

#### Option A: PostgreSQL with Docker (recommended)

Start PostgreSQL and wait until it is healthy before running the database setup:

```powershell
docker compose up -d --wait
npm run db:migrate
npm run db:seed
```

`npm run db:seed` clears existing application rows before recreating the fictional
demo dataset. Do not run it against a production database.

If your Docker Compose version does not support `--wait`, run
`docker compose up -d`, wait until `docker compose ps` reports the database as
healthy, and then run the migration and seed commands.

#### Option B: A locally installed PostgreSQL server

Create a PostgreSQL user and database using pgAdmin or `psql`. The default
development values expected by this project are:

```text
Database: bloodbank
User: bloodbank
Password: bloodbank
Host: localhost
Port: 5432
```

Alternatively, use your own values and update `DATABASE_URL` in
`apps/api/.env`. Once PostgreSQL is running and the database exists, run:

```powershell
npm run db:migrate
npm run db:seed
```

### Running the application

Start the API in one terminal:

```powershell
npm run dev:api
```

Start Expo in another terminal:

```powershell
npm run dev:mobile
```

The mobile API address must already be configured in `apps/mobile/.env` as
described in the installation section. Do not start Expo while
`YOUR_COMPUTER_IP` is still unchanged.

Restart Expo after changing `.env`. Then press `a` in the Expo terminal to open
an already-configured Android emulator, or scan the QR code using Expo Go.

For a physical phone, the phone and computer must share a network and TCP port
`4000` must be allowed through the computer's firewall. Expo tunnel mode can
help the phone reach the Expo development server, but the app still needs a
reachable API address:

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
