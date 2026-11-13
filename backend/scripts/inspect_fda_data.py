import sys
from pathlib import Path
from openpyxl import load_workbook

FILE_PATH = Path.home() / "Desktop" / "Rwanda_FDA_Medicines.xlsx"

REQUIRED_COLUMNS = [
    "SN",
    "Registration No.",
    "Brand Name",
    "Generic Name",
    "Manufacturer",
    "Country",
]


def inspect_fda_data():
    if not FILE_PATH.exists():
        print(f"ERROR: File not found: {FILE_PATH}")
        sys.exit(1)

    workbook = load_workbook(
        FILE_PATH,
        read_only=True,
        data_only=True,
    )

    sheet = workbook.active

    headers = [
        cell.value
        for cell in sheet.iter_rows(
            min_row=3,
            max_row=3,
        ).__next__()
    ]

    missing_columns = [
        name for name in REQUIRED_COLUMNS
        if name not in headers
    ]

    if missing_columns:
        workbook.close()
        raise ValueError(f"Missing columns: {missing_columns}")

    positions = {
        name: headers.index(name)
        for name in REQUIRED_COLUMNS
    }

    # Ignore completely empty spreadsheet rows.
    records = [
        row
        for row in sheet.iter_rows(
            min_row=4,
            values_only=True,
        )
        if any(value is not None for value in row)
    ]

    serials = []
    registrations = []

    for row in records:
        serial = row[positions["SN"]]
        registration = row[positions["Registration No."]]

        if serial is not None:
            serials.append(serial)

        if registration is not None:
            registrations.append(str(registration).strip())

    print("\n===== RWANDA FDA DATA INSPECTION =====")
    print(f"Actual records: {len(records)}")
    print(f"Unique FDA serial numbers: {len(set(serials))}")
    print(f"Duplicate FDA serial numbers: {len(serials) - len(set(serials))}")
    print(f"Missing FDA serial numbers: {len(records) - len(serials)}")
    print(f"Unique registration numbers: {len(set(registrations))}")
    print(f"Duplicate registration numbers: {len(registrations) - len(set(registrations))}")

    print("\nMissing required field values:")

    for column in REQUIRED_COLUMNS:
        missing = sum(
            1
            for row in records
            if row[positions[column]] is None
            or str(row[positions[column]]).strip() == ""
        )
        print(f"{column}: {missing}")

    workbook.close()
    print("\n===== INSPECTION COMPLETED =====")


if __name__ == "__main__":
    inspect_fda_data()