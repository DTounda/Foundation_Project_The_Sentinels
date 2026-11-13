# MediCheck API contract (v1)

Base URL (local): `http://localhost:3000/api/v1`. All bodies are JSON. This is the contract the mobile app builds against.

Every medicine result carries `status` and a `disclaimer`. MediCheck **gives information only**; it never tells anyone to take or stop a medicine.

## Result statuses

| `status` | Meaning | Shown to the user |
| --- | --- | --- |
| `verified` | Barcode matches a registered record with `verified_status = 'verified'` | Verified |
| `unconfirmed` | Record exists but is `unverified` or `flagged` | We could not confirm this product is authentic. Please check with your pharmacist and report it. |
| `not_found` | No record for this barcode | Not found in our records. Ask your pharmacist. |

## Errors

All errors use the same shape:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "barcode is required" } }
```

Codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `NOT_FOUND` (404), `CONFLICT` (409), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

## Auth

Send `Authorization: Bearer <token>` on protected routes.

### `POST /auth/register`
Body: `{ "fullName": "Aline Uwase", "email": "aline@example.com", "password": "min 8 chars" }`
201: `{ "user": { "id": 1, "fullName": "...", "email": "...", "role": "user" }, "token": "..." }`
409 if the email already exists. New accounts are always role `user`.

### `POST /auth/login`
Body: `{ "email": "aline@example.com", "password": "..." }`
200: `{ "user": { "id": 1, "fullName": "...", "email": "...", "role": "user" }, "token": "..." }`
401 `UNAUTHORIZED` "Invalid email or password". The message is the same whether the email or the password is wrong.

## Health

### `GET /health`
200: `{ "status": "ok", "service": "medicheck-api", "database": "up", "uptimeSeconds": 12, "timestamp": "..." }`
503 with `"status": "degraded", "database": "down"` when the database is unreachable.

## Verify

### `POST /verify/barcode`  (token optional)
Body: `{ "barcode": "6001234567890" }`
If a valid token is sent, the response also contains the user's allergy alerts. Without a token the check is anonymous (no allergy alerts, logged without a user).

200:
```json
{
  "status": "verified",
  "message": "Verified: this product matches a registered, authentic record.",
  "medicine": { "id": 1, "name": "Paracetamol 500 mg tablets", "manufacturer": "Example Pharma Ltd",
                "registrationNumber": "RW-0001", "barcode": "6001234567890" },
  "allergyAlerts": [
    { "ingredientId": 2, "ingredient": "Amoxicillin", "severity": "severe",
      "message": "Contains Amoxicillin, which you listed as an allergy. Talk to your doctor or pharmacist before use." }
  ],
  "disclaimer": "MediCheck gives information only. It doesn't replace advice from your doctor or pharmacist."
}
```
For `not_found`, `medicine` is `null` and `allergyAlerts` is `[]`.


### `POST /verify/photo`
Body: `{ "image": "<base64 JPEG, no data: prefix>" }`. Up to 5 MB. The photo is read and discarded, never stored.
200: ranked candidates, best first, up to 5. Never a single verdict: the user picks one.
```json
{ "candidates": [ { "medicineId": 1, "name": "Panadol", "manufacturer": "GSK", "confidence": 0.92 } ],
  "disclaimer": "..." }
```
`confidence` is from 0 to 1. 422 `UNREADABLE` when no text is found or nothing matches a medicine. 400 if `image` is missing or not base64.

### `POST /verify/medicine`  (token optional)
Body: `{ "medicineId": 1 }`. Used after the user picks one of the photo candidates.
200: the same shape as `POST /verify/barcode` (status, message, medicine, allergyAlerts, disclaimer). 404 if the medicine is unknown, 400 if `medicineId` is not a positive whole number.

## Allergy profile (token required, each user sees only their own)

### `GET /ingredients?q=amox`
Public list used by the allergy picker. 200: `{ "ingredients": [ { "id": 2, "name": "Amoxicillin" } ] }`

### `GET /allergies`
200: `{ "allergies": [ { "id": 1, "ingredientId": 2, "ingredient": "Amoxicillin", "severity": "severe" } ] }`

### `POST /allergies`
Body: `{ "ingredientId": 2, "severity": "severe" }`. Severity is `mild`, `moderate` or `severe`.
201: `{ "id": 1, "ingredientId": 2, "ingredient": "Amoxicillin", "severity": "severe" }`
400 if the severity is invalid, 404 if the ingredient is unknown, 409 if it is already in your list.

### `DELETE /allergies/:id`
204. 404 if it is not yours.

### `GET /allergies/check?medicineId=1`
200: `{ "medicineId": 1, "hasAlert": true, "allergyAlerts": [ ... ], "disclaimer": "..." }`

## Medicines and reports

### `GET /medicines/search?q=parac`  (token optional)
200: `{ "results": [ { "status": "verified", "message": "...", "medicine": { ... }, "allergyAlerts": [] } ], "disclaimer": "..." }`
Same allergy behaviour as `/verify/barcode`. `q` needs at least 2 characters.

### `GET /medicines/:id`
Details for the result screen. 200: `{ "medicine": { ...same fields as above, "verifiedStatus": "verified" }, "ingredients": [ { "id": 1, "name": "Paracetamol", "strength": "500 mg" } ], "disclaimer": "..." }`. 404 if unknown.

### `POST /reports`  (token optional)
Body: `{ "medicineId": 1, "description": "Packaging looks different", "location": "Kimironko" }`
201: `{ "report": { "id": 1, "status": "new" } }`
- `medicineId` is optional. Send it when the product is in our records. If the product is not in our records, leave it out and write the product name in `description`.
- `description` is required, 5 to 1000 characters.
- `location` is optional, up to 150 characters.

400 `VALIDATION_ERROR` if `description` is missing or out of range, or if `medicineId` is sent but is not a positive integer. 404 if `medicineId` is sent but unknown.