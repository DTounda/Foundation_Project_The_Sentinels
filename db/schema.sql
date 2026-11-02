
CREATE DATABASE IF NOT EXISTS medicheck
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE medicheck;

CREATE TABLE Users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('user', 'pharmacist', 'admin') NOT NULL DEFAULT 'user',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE Ingredients (
    ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
) ENGINE=InnoDB;

CREATE TABLE Medicines (
    medicine_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    manufacturer VARCHAR(150) NOT NULL,
    registration_number VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(50) NOT NULL UNIQUE,
    verified_status ENUM('verified', 'unverified', 'flagged')
        NOT NULL DEFAULT 'unverified',
    INDEX idx_medicines_name (name)
) ENGINE=InnoDB;

CREATE TABLE UserAllergies (
    user_allergy_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    severity ENUM('mild', 'moderate', 'severe') NOT NULL,
    CONSTRAINT uq_user_ingredient UNIQUE (user_id, ingredient_id),
    CONSTRAINT fk_allergies_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_allergies_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE MedicineIngredients (
    medicine_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    strength VARCHAR(50),
    PRIMARY KEY (medicine_id, ingredient_id),
    CONSTRAINT fk_medicine_ingredients_medicine
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_medicine_ingredients_ingredient
        FOREIGN KEY (ingredient_id) REFERENCES Ingredients(ingredient_id)
        ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE VerificationLogs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    medicine_id INT NULL,
    method ENUM('scan', 'search') NOT NULL,
    result VARCHAR(50) NOT NULL,
    allergy_warning BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_logs_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_logs_medicine
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE SuspiciousReports (
    report_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    medicine_id INT NULL,
    description TEXT NOT NULL,
    location VARCHAR(150),
    status ENUM('new', 'under review', 'resolved')
        NOT NULL DEFAULT 'new',
    reported_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reports_user
        FOREIGN KEY (user_id) REFERENCES Users(user_id)
        ON DELETE SET NULL,
    CONSTRAINT fk_reports_medicine
        FOREIGN KEY (medicine_id) REFERENCES Medicines(medicine_id)
        ON DELETE SET NULL
) ENGINE=InnoDB;
