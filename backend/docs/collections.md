# MediCheck MongoDB Collections

This document defines the MongoDB collections used by the MediCheck backend.

The MongoDB implementation should preserve the existing API repository method names and return structures wherever possible.

## 1. Medicines

Stores registered medicines imported from the Rwanda FDA register.

**Fields:**
- `_id`: MongoDB document ID
- `id`: Numeric medicine ID used by the backend
- `registrationNumber`: Rwanda FDA registration number
- `fdaSerialNumber`: Unique serial number from the FDA spreadsheet
- `brandName`: Medicine brand name
- `genericName`: Generic medicine name
- `name`: Main searchable medicine name
- `strength`: Medicine strength
- `dosageForm`: Tablet, syrup, injection, etc.
- `packSize`: Package size
- `shelfLife`: Product shelf life
- `manufacturer`: Manufacturer name
- `country`: Country of manufacture
- `marketingAuthorizationHolder`: Local agent or authorization holder
- `ltr`: FDA LTR value
- `registrationDate`: FDA registration date
- `expiryDate`: Registration expiry date
- `source`: Data source, such as Rwanda FDA

**Indexes:**
- Unique sparse index on `fdaSerialNumber`
- Non-unique index on `registrationNumber`
- Index on `name`
- Text index on `brandName` and `genericName` if required by the agreed search implementation

Registration numbers are not unique. Multiple medicine records may share the same registration number.

Barcode scanning is not part of the current product scope. Do not fabricate barcode values.

## 2. Ingredients

Stores active ingredients found in medicines.

**Fields:**
- `_id`: MongoDB document ID
- `id`: Numeric ingredient ID used by the backend
- `name`: Ingredient name
- `normalizedName`: Standardized ingredient name

**Indexes:**
- Unique index on `normalizedName`

## 3. MedicineIngredients

Connects medicines to their active ingredients.

**Fields:**
- `_id`: MongoDB document ID
- `medicineId`: Numeric medicine ID reference
- `ingredientId`: Numeric ingredient ID reference
- `strength`: Ingredient strength in the medicine

**Indexes:**
- Index on `medicineId`
- Index on `ingredientId`
- Unique compound index on `medicineId` and `ingredientId`

## 4. Users

Stores registered application users.

**Fields:**
- `_id`: MongoDB document ID
- `id`: Numeric user ID used by the backend
- `name`: User name
- `email`: User email
- `passwordHash`: Hashed password
- `role`: User role
- `createdAt`: Account creation date

**Indexes:**
- Unique index on `email`

Passwords must always be stored as secure hashes, never as plain text.

## 5. UserAllergies

Stores ingredients that users have reported as allergies.

**Fields:**
- `_id`: MongoDB document ID
- `id`: Numeric user allergy ID used by the backend
- `userId`: Numeric reference to a user
- `ingredientId`: Numeric reference to an ingredient
- `severity`: Allergy severity (mild, moderate, severe)
- `createdAt`: Date allergy was added

**Indexes:**
- Index on `userId`
- Unique compound index on `userId` and `ingredientId`

Every allergy query must filter by the owning user ID to protect private health information.

Duplicate allergies for the same user and ingredient must be prevented.

## 6. VerificationLogs

Stores medicine verification activity.

**Fields:**
- `_id`: MongoDB document ID
- `id`: Numeric verification log ID used by the backend
- `userId`: User who performed verification; nullable for anonymous checks
- `medicineId`: Medicine that was checked; nullable if not identified
- `method`: Verification method
- `result`: Verification result
- `allergyWarning`: Whether an allergy warning was triggered
- `createdAt`: Verification date

**Indexes:**
- Index on `userId`
- Index on `medicineId`
- Index on `createdAt`

## 7. SuspiciousReports

Stores user reports about medicines that may require investigation.

**Fields:**
- `_id`: MongoDB document ID
- `id`: Numeric report ID used by the backend
- `userId`: User who submitted the report
- `medicineId`: Related medicine, if identified
- `description`: Report details
- `status`: Report review status
- `createdAt`: Report submission date

**Indexes:**
- Index on `userId`
- Index on `medicineId`
- Index on `status`
- Index on `createdAt`

## General MongoDB Design Rules

1. MongoDB `_id` values remain the internal document identifiers.
2. Numeric `id` fields preserve compatibility with existing backend services.
3. References between collections use the agreed numeric IDs consistently.
4. FDA serial numbers identify individual imported FDA records.
5. Registration numbers must not have unique constraints.
6. FDA imports must be repeatable without creating duplicate records.
7. Allergy records must remain private to their respective users.
8. All database credentials must be stored in environment variables.
9. MongoDB repository methods must preserve the existing API contracts.
10. Barcode values must not be invented or treated as proof of medicine authenticity.