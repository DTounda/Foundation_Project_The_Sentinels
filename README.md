# MediCheck

MediCheck is a mobile app for people in Kigali, Rwanda. You search for a medicine by name or take a photo of its box, and the app tells you whether the product is on the Rwanda FDA list of authorised medicines. It also warns you if the medicine contains something you are allergic to, or may interact with medicines you already take.

> MediCheck gives information only. It does not replace advice from your doctor or pharmacist, laboratory testing, or official regulatory inspection.

**Live API:** https://medicheck-api-x1pd.onrender.com/api/v1/health
The API runs on Render's free tier. After 15 minutes without use it goes to sleep, and the first request takes about 30 to 50 seconds to wake it.

**Android app (APK):** _add the EAS build link here_

## Features

- **Search by name:** finds medicines in the Rwanda FDA register (2,532 products).
- **Verify by photo:** reads the name on the box (OCR) and shows up to 5 possible matches. The user picks one, or chooses "None of these match my pack" and searches by name instead. The photo is never stored.
- **Clear result:** each product is shown as **Registered**, **Could not confirm** or **Not found**, with a short explanation. "Registered" means the product is on the FDA list. It does not prove that a particular pack is genuine.
- **Allergy check:** users save their allergies, and every result warns them if the medicine contains one of those ingredients. When we don't have a product's ingredient list, the app says so instead of looking "safe".
- **Interaction check:** users list the medicines they already take, and the result warns about Major or Moderate interactions (from DDInter).
- **Report a product:** users can report a suspicious product, with an optional location.
- **Pharmacies and hospitals:** a searchable directory of 1,222 health facilities, with Kimironko and Gasabo first.
- **Account and profile:** sign-up and log-in, plus the user's doctor, regular pharmacy and current medications.

## Tech stack

| Part | Technology |
| --- | --- |
| Mobile app | React Native with Expo (SDK 58), React Navigation |
| API | Node.js 20+, Express 5 |
| Database | MongoDB Atlas (MySQL repositories are kept as a fallback) |
| Photo reading | OCR.space API |
| Hosting | Render (API), EAS Build (Android APK) |
| Quality | Jest and ESLint, run by GitHub Actions on every pull request to `main` |

## Repository structure

```
backend/           Express API (src/), tests (tests/), data import scripts (scripts/)
mobile/            Expo app: screens, navigation, API client (src/)
docs/API.md        API contract: every endpoint, request and response
docs/              Proposal, diagrams, FDA data assessment
postman/           Postman collection
.github/workflows/ CI: backend lint and tests
```

## Getting started

### Requirements

- Node.js 20 or later
- The Expo Go app on your phone (for development)
- A MongoDB connection string and an OCR.space API key (ask the team, never commit them)

### Run the API locally

```bash
cd backend
npm install
cp .env.example .env
```

In `backend/.env`, set `DB_DRIVER=mongo`, `MONGODB_URI`, `MONGODB_DB`, `JWT_SECRET` and `OCR_API_KEY`. Then start the API:

```bash
npm start
```

Check it works: http://localhost:3000/api/v1/health should show `"database":"up"`.

The shared Atlas database already holds the FDA register and the interaction data. Run `scripts/seed.js` and `scripts/import_interactions.js` only to rebuild a database from scratch. They need the FDA export and the DDInter files, which are not stored in the repo.

### Run the mobile app

```bash
cd mobile
npm install
npx expo start
```

Scan the QR code with Expo Go. The app uses the live API by default. To use a local API, change `API_BASE_URL` in `mobile/src/config.js` to `http://<your laptop's Wi-Fi IP>:3000/api/v1`. The phone and the laptop must be on the same Wi-Fi.

### Build the Android APK

```bash
cd mobile
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

The build runs on Expo's servers. When it finishes, it gives you a download link for the APK.

## Tests

```bash
cd backend
npm test
npm run lint
```

There are 148 backend tests (unit and integration). They use in-memory repositories, so they need no database.

## Data sources

- **Rwanda FDA register of human medicines.** Product status comes from this list. 2,068 of 2,532 products have their ingredients extracted; the rest are flagged for review and shown with an "ingredients unknown" note.
- **DDInter** (https://ddinter2.scbdd.com). Drug-drug interaction pairs, CC BY-NC-SA 4.0. Only Major and Moderate pairs are used.
- **Eden Care** facility list. The pharmacy and hospital directory.

## Changes since the proposal

- **Barcode scanning was replaced by photo verification**, because the Rwanda FDA register has no barcodes.
- **"Verified" became "Registered"**, so the app never claims a pack is genuine.
- **MySQL became MongoDB**, to model ingredients and interaction pairs. The MySQL code is kept as a fallback.
- **Added:** accounts, the profile, interaction checks and the pharmacy directory.
- **Moved to future work:** history of past checks, an admin view of reports, offline access, and app store releases.

## Team 5: The Sentinels

| Member | Role |
| --- | --- |
| Dorcase Lesly Nana Tounda | Project Manager |
| Tchatchum Stephane | Lead Developer |
| Tasnim Rosa | UI/UX Engineer |
| Annabel Kemasuode | Frontend Developer |
| Ephraim Mulilo | Backend Developer |
| Olivier Migisha | Backend Developer |
