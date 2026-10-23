# ReactATBusNative

Expo React Native app for bus timetable lookups using the same backend API contracts as the web frontend.

## Features

- Region, route, stop, and timetable selection
- Live and static timetable modes
- Media ad loading from backend
- User login state and backend user sync hook
- Native app layout ready for Expo

## Scripts

- `npm start` — start Expo dev server
- `npm run android` — launch Android emulator
- `npm run ios` — launch iOS simulator
- `npm run web` — run in browser
- `npm run typecheck` — TypeScript validation
- `npm run doctor` — Expo health check

## Setup

```bash
npm install
npm start
```

## Project structure

```text
src/
  features/
    auth/
      useAuth.ts
    timetable/
      TimetableScreen.tsx
  services/
    api.ts
  api.ts
  useAuth.ts
App.tsx
```

## Why this structure

- `features/` keeps page-specific logic isolated and easier to extend.
- `services/` centralizes API and backend integration concerns.
- root `App.tsx` stays as a lightweight entry point.
- compatibility re-export files (`src/api.ts`, `src/useAuth.ts`) keep older imports stable while the app moves toward a cleaner architecture.

## Notes

This project keeps the same endpoint patterns as the existing web app:

- `GET /api/regions`
- `GET /api/routes?regionId={id}`
- `GET /api/routes/{routeId}/timetables?serviceType={type}`
- `GET /api/media`
- `POST /api/user/login`

## Privacy

Read the [AT Hop privacy policy](https://raprapolores.github.io/ATBusSchedule/PRIVACY_POLICY.md).

## Environment

This project is intended to be used as a standalone repository. The app still uses the same runtime API base URL as the legacy frontend.
