# Rwanda FDA Medicine Register – Import Assessment

## 1. Objective

Preparing the official Rwanda FDA Human Medicinal Products Register for integration into the MediCheck database.

## 2. Data Source

- Source: Rwanda FDA Human Medicinal Products Register
- Records collected: 2,621
- Columns: 14
- Format: Excel (.xlsx)

## 3. Current Database Structure

The current MediCheck database contains seven tables:

- Users
- Ingredients
- Medicines
- UserAllergies
- MedicineIngredients
- VerificationLogs
- SuspiciousReports

## 4. Identified Data Integration Gaps

The current Medicines table does not contain all fields available in the Rwanda FDA register.

Additional fields to consider:

- Generic name
- Dosage form
- Strength
- Pack size
- Shelf life
- Country of manufacture
- Local agent / MAH
- Registration date
- Expiry date

## 5. Data Quality Considerations

Initial inspection identified:

- Repeated registration numbers that require investigation.
- Missing values in some medicine records.
- Inconsistent date formats.
- Differences in naming and formatting.

Records should be validated before import. Missing values should not be invented, and possible duplicates should not be deleted without verification.

## 6. Recommendations

1. Review the database schema with the API Manager.
2. Agree on the additional medicine fields.
3. Separate regulatory registration status from MediCheck verification results.
4. Review the unique barcode constraint because the FDA register does not provide barcode values.
5. Build a validated import script.
6. Test the import using a small sample before importing the complete register.

## 7. Current Progress

The official register has been collected and initially inspected. Database integration requirements have been identified. The import script and database changes are still pending team review.