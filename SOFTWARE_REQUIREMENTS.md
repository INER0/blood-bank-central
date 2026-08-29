# Blood Bank Central - Software Requirements

## Purpose

This document lists the software and configuration needed to run Blood Bank
Central locally. The project contains an Expo React Native mobile app, an Express
API, and a PostgreSQL database.

## Required Software

| Software | Required version | Purpose |
| --- | --- | --- |
| Node.js | 20 LTS or newer | Runs the API, Expo tooling, migrations, and seed script |
| npm | 10 or newer | Installs and runs the npm workspace |
| PostgreSQL | 16 recommended | Stores all application data |
| Git | Current stable version | Clones and versions the project |
| Expo Go | A version compatible with Expo SDK 54 | Runs the app on a physical Android/iOS device |

Docker Desktop with Docker Compose is optional, but it is the simplest way to
start PostgreSQL with the included `docker-compose.yml`. PostgreSQL can also be
installed and configured directly.

For Android emulation, install Android Studio, the Android SDK, platform tools,
and an Android Virtual Device. Hardware virtualisation must be enabled. A physical
phone and computer must be on the same network when Expo uses LAN mode.

## Application Stack

### Mobile client

- Expo SDK `~54.0.0`
- React `19.1.0`
- React Native `0.81.5`
- TypeScript `~5.9.2`
- Async Storage `^2.2.0`
- Expo Camera `~17.0.10`
- Expo Location `~19.0.8`
- Expo Print `~15.0.8`
- Expo Status Bar `~3.0.9`
- Lucide React Native `^1.30.0`
- React Native QR Code SVG `^6.3.21`
- React Native Safe Area Context `~5.6.0`
- React Native SVG `15.12.1`

### API server

- Node.js using ECMAScript modules
- Express `^5.1.0`
- PostgreSQL driver (`pg`) `^8.16.3`
- bcryptjs `^3.0.2`
- JSON Web Token `^9.0.2`
- Zod `^4.0.17`
- CORS `^2.8.5`
- dotenv `^17.2.1`

Exact resolved packages are recorded in `package-lock.json`. Use `npm ci` for a
reproducible installation after cloning.

## Environment Variables

The API and mobile app use separate environment files. Create them from their
respective examples:

```powershell
Copy-Item .env.example apps/api/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

The API file contains:

```env
DATABASE_URL=postgresql://bloodbank:bloodbank@localhost:5432/bloodbank
JWT_SECRET=replace-this-for-real-use
PORT=4000
```

`JWT_SECRET` must be replaced with a long random secret outside local testing.
Do not commit either real `.env` file.

Before starting Expo, edit `apps/mobile/.env` and replace
`YOUR_COMPUTER_IP` with the computer's Wi-Fi IPv4 address:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000/api
```

The address above is only an example. Run `ipconfig` to find the correct address
for the current computer and network.

API address rules:

- Android emulator: use `http://10.0.2.2:4000/api` when localhost forwarding is unavailable.
- Physical phone: use the computer's current LAN IP, such as `http://192.168.1.20:4000/api`.
- The phone and computer must share a network, and the firewall must allow TCP port `4000`.
- Expo tunnel mode helps the phone reach Metro, but the API URL must still be
  reachable from the phone.

## Fresh Installation

```powershell
git clone <repository-url>
cd blood-bank-central
npm ci
Copy-Item .env.example apps/api/.env
Copy-Item apps/mobile/.env.example apps/mobile/.env
```

Edit `apps/mobile/.env` as described above. Then start the Docker database and
wait for it to become healthy:

```powershell
docker compose up -d --wait
npm run db:migrate
npm run db:seed
```

Start the API and mobile client in separate terminals:

```powershell
npm run dev:api
```

```powershell
npm run dev:mobile
```

Scan the Expo QR code with Expo Go or press `a` in Expo CLI to open a configured
Android emulator.

## Database Commands

| Command | Result |
| --- | --- |
| `npm run db:migrate` | Creates or updates the PostgreSQL schema |
| `npm run db:seed` | Deletes application rows and recreates the complete demo dataset |
| `docker compose up -d` | Starts the included PostgreSQL container |
| `docker compose down` | Stops the container without deleting its named data volume |

The seed command is destructive and must only be used on development or test
databases. The seed data is defined in `apps/api/src/db/seed.js`. Demo credentials
are listed in `DEMO_LOGINS.txt` and all accounts use `Password123!`.

## Development Checks

```powershell
npm run typecheck
npm test
```

The mobile client requires camera permission for scanning, location permission
for proximity features, and access to the platform print service for blood-bag
labels. Microsoft Print to PDF is available only through a host/platform print
dialog; it is not a physical mobile printer.

## Repository Files That Must Be Committed

- Application source under `apps/`
- `package.json` and `package-lock.json`
- `docker-compose.yml`
- `.env.example` but not `.env`
- PostgreSQL schema/migrations and `apps/api/src/db/seed.js`
- `DEMO_LOGINS.txt`
- This requirements document and `SYSTEM_SPECIFICATION.md`
