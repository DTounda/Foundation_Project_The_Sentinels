# Database (MySQL)

Owner: Olivier (`schema.sql` and `seed.sql`), using the tables and ERD in the project proposal (section 3.5, Figure 6).

Seven tables, **named exactly like this** (MySQL on Linux is case-sensitive, and the backend queries use these names):

`Users`, `UserAllergies`, `Medicines`, `Ingredients`, `MedicineIngredients`, `VerificationLogs`, `SuspiciousReports`

Column names are in the proposal, section 3.5 (Tables 1 to 7). Summary of what the backend relies on:

| Table | Columns used by the backend |
| --- | --- |
| Users | user_id, full_name, email (UNIQUE), password_hash, role ENUM('user','pharmacist','admin'), created_at |
| UserAllergies | user_allergy_id, user_id, ingredient_id, severity ENUM('mild','moderate','severe') |
| Medicines | medicine_id, name, manufacturer, registration_number (UNIQUE), barcode (UNIQUE), verified_status ENUM('verified','unverified','flagged') |
| Ingredients | ingredient_id, name (UNIQUE), description |
| MedicineIngredients | medicine_id, ingredient_id, strength (PK = both ids) |
| VerificationLogs | log_id, user_id NULL, medicine_id NULL, method ENUM('scan','search'), result VARCHAR(50), allergy_warning BOOLEAN, checked_at |
| SuspiciousReports | report_id, user_id NULL, medicine_id NULL, description, location, status ENUM('new','under review','resolved'), reported_at |

Recommended in `schema.sql`: `UNIQUE (user_id, ingredient_id)` on `UserAllergies` (no duplicate allergies), foreign keys with `ON DELETE` rules, and an index on `Medicines.name` for search.

Run locally:

```bash
mysql -u root -p -e "CREATE DATABASE medicheck CHARACTER SET utf8mb4;"
mysql -u root -p medicheck < database/schema.sql
mysql -u root -p medicheck < database/seed.sql
```