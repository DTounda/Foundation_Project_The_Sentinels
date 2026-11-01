# MediCheck mobile app (React Native / Expo)

Owners: Dorcase (Expo setup, navigation, result screen), Tasnim (search/scan screen, Figma), Annabel (allergy profile screen, report screen).

Create the Expo app **inside this folder** (do this once, on one branch, then everyone pulls):

```bash
npx create-expo-app@latest . --template blank
```

Suggested structure so branches do not clash:

```
mobile/
  src/
    screens/      SearchScanScreen (Tasnim), ResultScreen (Dorcase)
                  AllergyProfileScreen, ReportScreen (Annabel)
    components/   DisclaimerBanner (shared, built by Dorcase)
    services/     api.js   (all fetch calls to the backend)
    config.js     API_BASE_URL
```

Talk to the backend through the contract in [`docs/API.md`](../docs/API.md). Every result screen must show the disclaimer: *MediCheck gives information only. It doesn't replace advice from your doctor or pharmacist.*
