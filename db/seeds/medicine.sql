USE medicheck;

INSERT IGNORE INTO Ingredients (name, description)
VALUES
('Aspirin', 'Pain relief and anti-inflammatory ingredient'),
('Metformin', 'Used to manage blood sugar'),
('Omeprazole', 'Reduces stomach acid'),
('Azithromycin', 'Antibiotic ingredient'),
('Vitamin C', 'Vitamin supplement ingredient'),
('Caffeine', 'Stimulant ingredient');

INSERT IGNORE INTO Medicines
(brand_name, generic_name, dosage_form, strength, manufacturer,
 registration_number, status, name, barcode, verified_status)
VALUES
('DemoAspirin', 'Aspirin', 'Tablet', '100 mg', 'Demo Manufacturer',
 'DEMO-RW-0007', 'approved', 'DemoAspirin (Aspirin)', 'DEMO-MC-0007', 'verified'),

('DemoMet', 'Metformin', 'Tablet', '500 mg', 'Demo Manufacturer',
 'DEMO-RW-0008', 'approved', 'DemoMet (Metformin)', 'DEMO-MC-0008', 'verified'),

('DemoOmez', 'Omeprazole', 'Capsule', '20 mg', 'Demo Manufacturer',
 'DEMO-RW-0009', 'approved', 'DemoOmez (Omeprazole)', 'DEMO-MC-0009', 'unverified'),

('DemoAzithro', 'Azithromycin', 'Tablet', '250 mg', 'Demo Manufacturer',
 'DEMO-RW-0010', 'approved', 'DemoAzithro (Azithromycin)', 'DEMO-MC-0010', 'verified'),

('DemoVitamin', 'Vitamin C', 'Tablet', '500 mg', 'Demo Manufacturer',
 'DEMO-RW-0011', 'approved', 'DemoVitamin (Vitamin C)', 'DEMO-MC-0011', 'unverified'),

('DemoCaffeine', 'Caffeine', 'Tablet', '100 mg', 'Demo Manufacturer',
 'DEMO-RW-0012', 'approved', 'DemoCaffeine (Caffeine)', 'DEMO-MC-0012', 'verified'),

('DemoPain', 'Aspirin', 'Tablet', '300 mg', 'Demo Manufacturer',
 'DEMO-RW-0013', 'recalled', 'DemoPain (Aspirin)', 'DEMO-MC-0013', 'flagged'),

('DemoSugar', 'Metformin', 'Tablet', '850 mg', 'Demo Manufacturer',
 'DEMO-RW-0014', 'approved', 'DemoSugar (Metformin)', 'DEMO-MC-0014', 'unverified'),

('DemoAcid', 'Omeprazole', 'Capsule', '40 mg', 'Demo Manufacturer',
 'DEMO-RW-0015', 'suspended', 'DemoAcid (Omeprazole)', 'DEMO-MC-0015', 'flagged');

 INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '100 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Aspirin'
WHERE m.registration_number = 'DEMO-RW-0007';

INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '500 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Metformin'
WHERE m.registration_number = 'DEMO-RW-0008';

INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '20 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Omeprazole'
WHERE m.registration_number = 'DEMO-RW-0009';

INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '250 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Azithromycin'
WHERE m.registration_number = 'DEMO-RW-0010';

INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '500 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Vitamin C'
WHERE m.registration_number = 'DEMO-RW-0011';

INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '100 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Caffeine'
WHERE m.registration_number = 'DEMO-RW-0012';

INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '300 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Aspirin'
WHERE m.registration_number = 'DEMO-RW-0013';

INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '850 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Metformin'
WHERE m.registration_number = 'DEMO-RW-0014';

INSERT IGNORE INTO MedicineIngredients
(medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id, '40 mg'
FROM Medicines m
JOIN Ingredients i ON i.name = 'Omeprazole'
WHERE m.registration_number = 'DEMO-RW-0015';

