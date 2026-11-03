
USE medicheck;

-- 1. Preserve existing ingredients and add the new description field.
ALTER TABLE Ingredients
ADD COLUMN description TEXT NULL;

-- 2. Add the medicine name required by the new backend.
ALTER TABLE Medicines
ADD COLUMN name VARCHAR(150) NULL,
ADD COLUMN barcode VARCHAR(50) NULL,
ADD COLUMN verified_status
    ENUM('verified', 'unverified', 'flagged')
    NOT NULL DEFAULT 'unverified';

-- Preserve the old brand and generic names in the new name field.
UPDATE Medicines
SET name = CONCAT(brand_name, ' (', generic_name, ')');

-- These are fictional demo identifiers, not real product barcodes.
UPDATE Medicines
SET barcode = CONCAT('DEMO-MC-', LPAD(medicine_id, 4, '0'));

-- Existing demo medicines use fictional barcodes, so keep them unverified.
UPDATE Medicines
SET verified_status = 'unverified';


ALTER TABLE Medicines
MODIFY name VARCHAR(150) NOT NULL,
MODIFY barcode VARCHAR(50) NOT NULL,
ADD UNIQUE KEY uq_medicines_barcode (barcode),
ADD INDEX idx_medicines_name (name);

-- 3. Rename the relationship strength column without losing its data.
ALTER TABLE MedicineIngredients
CHANGE COLUMN amount strength VARCHAR(50) NULL;

-- Match the new schema's ingredient deletion rule.
ALTER TABLE MedicineIngredients
DROP FOREIGN KEY medicineingredients_ibfk_2;

ALTER TABLE MedicineIngredients
ADD CONSTRAINT fk_medicine_ingredients_ingredient
FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
ON DELETE CASCADE;

-- 4. Create the user allergy table.
CREATE TABLE UserAllergies (
    user_allergy_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    severity ENUM('mild', 'moderate', 'severe') NOT NULL,
    CONSTRAINT uq_user_ingredient UNIQUE (user_id, ingredient_id),
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Create verification logs.
CREATE TABLE VerificationLogs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    medicine_id INT NULL,
    method ENUM('scan', 'search') NOT NULL,
    result VARCHAR(50) NOT NULL,
    allergy_warning BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE SET NULL,
    FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Create suspicious reports.
CREATE TABLE SuspiciousReports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    medicine_id INT NULL,
    description TEXT NOT NULL,
    location VARCHAR(150),
    status ENUM('new', 'under review', 'resolved')
        NOT NULL DEFAULT 'new',
    reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE SET NULL,
    FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;
