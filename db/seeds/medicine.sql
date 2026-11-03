USE medicheck;

-- Fictional demonstration data for MediCheck. These are NOT real medicine
-- registrations, manufacturer records, or barcodes.

INSERT IGNORE INTO Ingredients (name, description)
VALUES
('Aspirin', 'Pain relief and anti-inflammatory ingredient'),
('Metformin', 'Used to manage blood sugar'),
('Omeprazole', 'Reduces stomach acid'),
('Azithromycin', 'Antibiotic ingredient'),
('Vitamin C', 'Vitamin supplement ingredient'),
('Caffeine', 'Stimulant ingredient');

INSERT IGNORE INTO Medicines
(name, manufacturer, registration_number, barcode, verified_status)
VALUES
('DemoAspirin (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0007', 'DEMO-MC-0007', 'verified'),
('DemoMet (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0008', 'DEMO-MC-0008', 'verified'),
('DemoOmez (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0009', 'DEMO-MC-0009', 'unverified'),
('DemoAzithro (Azithromycin)', 'Demo Manufacturer', 'DEMO-RW-0010', 'DEMO-MC-0010', 'verified'),
('DemoVitamin (Vitamin C)', 'Demo Manufacturer', 'DEMO-RW-0011', 'DEMO-MC-0011', 'unverified'),
('DemoCaffeine (Caffeine)', 'Demo Manufacturer', 'DEMO-RW-0012', 'DEMO-MC-0012', 'verified'),
('DemoPain (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0013', 'DEMO-MC-0013', 'flagged'),
('DemoSugar (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0014', 'DEMO-MC-0014', 'unverified'),
('DemoAcid (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0015', 'DEMO-MC-0015', 'flagged'),
('DemoMedicine016 (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0016', 'DEMO-MC-0016', 'unverified'),
('DemoMedicine017 (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0017', 'DEMO-MC-0017', 'unverified'),
('DemoMedicine018 (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0018', 'DEMO-MC-0018', 'unverified'),
('DemoMedicine019 (Azithromycin)', 'Demo Manufacturer', 'DEMO-RW-0019', 'DEMO-MC-0019', 'unverified'),
('DemoMedicine020 (Vitamin C)', 'Demo Manufacturer', 'DEMO-RW-0020', 'DEMO-MC-0020', 'unverified'),
('DemoMedicine021 (Caffeine)', 'Demo Manufacturer', 'DEMO-RW-0021', 'DEMO-MC-0021', 'unverified'),
('DemoMedicine022 (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0022', 'DEMO-MC-0022', 'unverified'),
('DemoMedicine023 (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0023', 'DEMO-MC-0023', 'unverified'),
('DemoMedicine024 (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0024', 'DEMO-MC-0024', 'unverified'),
('DemoMedicine025 (Azithromycin)', 'Demo Manufacturer', 'DEMO-RW-0025', 'DEMO-MC-0025', 'unverified'),
('DemoMedicine026 (Vitamin C)', 'Demo Manufacturer', 'DEMO-RW-0026', 'DEMO-MC-0026', 'unverified'),
('DemoMedicine027 (Caffeine)', 'Demo Manufacturer', 'DEMO-RW-0027', 'DEMO-MC-0027', 'unverified'),
('DemoMedicine028 (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0028', 'DEMO-MC-0028', 'unverified'),
('DemoMedicine029 (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0029', 'DEMO-MC-0029', 'unverified'),
('DemoMedicine030 (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0030', 'DEMO-MC-0030', 'unverified'),
('DemoMedicine031 (Azithromycin)', 'Demo Manufacturer', 'DEMO-RW-0031', 'DEMO-MC-0031', 'unverified'),
('DemoMedicine032 (Vitamin C)', 'Demo Manufacturer', 'DEMO-RW-0032', 'DEMO-MC-0032', 'unverified'),
('DemoMedicine033 (Caffeine)', 'Demo Manufacturer', 'DEMO-RW-0033', 'DEMO-MC-0033', 'unverified'),
('DemoMedicine034 (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0034', 'DEMO-MC-0034', 'unverified'),
('DemoMedicine035 (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0035', 'DEMO-MC-0035', 'unverified'),
('DemoMedicine036 (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0036', 'DEMO-MC-0036', 'unverified'),
('DemoMedicine037 (Azithromycin)', 'Demo Manufacturer', 'DEMO-RW-0037', 'DEMO-MC-0037', 'unverified'),
('DemoMedicine038 (Vitamin C)', 'Demo Manufacturer', 'DEMO-RW-0038', 'DEMO-MC-0038', 'unverified'),
('DemoMedicine039 (Caffeine)', 'Demo Manufacturer', 'DEMO-RW-0039', 'DEMO-MC-0039', 'unverified'),
('DemoMedicine040 (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0040', 'DEMO-MC-0040', 'unverified'),
('DemoMedicine041 (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0041', 'DEMO-MC-0041', 'unverified'),
('DemoMedicine042 (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0042', 'DEMO-MC-0042', 'unverified'),
('DemoMedicine043 (Azithromycin)', 'Demo Manufacturer', 'DEMO-RW-0043', 'DEMO-MC-0043', 'unverified'),
('DemoMedicine044 (Vitamin C)', 'Demo Manufacturer', 'DEMO-RW-0044', 'DEMO-MC-0044', 'unverified'),
('DemoMedicine045 (Caffeine)', 'Demo Manufacturer', 'DEMO-RW-0045', 'DEMO-MC-0045', 'unverified'),
('DemoMedicine046 (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0046', 'DEMO-MC-0046', 'unverified'),
('DemoMedicine047 (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0047', 'DEMO-MC-0047', 'unverified'),
('DemoMedicine048 (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0048', 'DEMO-MC-0048', 'unverified'),
('DemoMedicine049 (Azithromycin)', 'Demo Manufacturer', 'DEMO-RW-0049', 'DEMO-MC-0049', 'unverified'),
('DemoMedicine050 (Vitamin C)', 'Demo Manufacturer', 'DEMO-RW-0050', 'DEMO-MC-0050', 'unverified'),
('DemoMedicine051 (Caffeine)', 'Demo Manufacturer', 'DEMO-RW-0051', 'DEMO-MC-0051', 'unverified'),
('DemoMedicine052 (Aspirin)', 'Demo Manufacturer', 'DEMO-RW-0052', 'DEMO-MC-0052', 'unverified'),
('DemoMedicine053 (Metformin)', 'Demo Manufacturer', 'DEMO-RW-0053', 'DEMO-MC-0053', 'unverified'),
('DemoMedicine054 (Omeprazole)', 'Demo Manufacturer', 'DEMO-RW-0054', 'DEMO-MC-0054', 'unverified'),
('DemoMedicine055 (Azithromycin)', 'Demo Manufacturer', 'DEMO-RW-0055', 'DEMO-MC-0055', 'unverified'),
('DemoMedicine056 (Vitamin C)', 'Demo Manufacturer', 'DEMO-RW-0056', 'DEMO-MC-0056', 'unverified');

-- Link each of the 50 demo medicines to one ingredient.
-- Existing medicines 0007-0015 use their original strengths.
INSERT IGNORE INTO MedicineIngredients (medicine_id, ingredient_id, strength)
SELECT m.medicine_id, i.ingredient_id,
       CASE m.registration_number
         WHEN 'DEMO-RW-0007' THEN '100 mg'
         WHEN 'DEMO-RW-0008' THEN '500 mg'
         WHEN 'DEMO-RW-0009' THEN '20 mg'
         WHEN 'DEMO-RW-0010' THEN '250 mg'
         WHEN 'DEMO-RW-0011' THEN '500 mg'
         WHEN 'DEMO-RW-0012' THEN '100 mg'
         WHEN 'DEMO-RW-0013' THEN '300 mg'
         WHEN 'DEMO-RW-0014' THEN '850 mg'
         WHEN 'DEMO-RW-0015' THEN '40 mg'
         ELSE 'Demo strength'
       END
FROM Medicines m
JOIN Ingredients i
  ON i.name = CASE MOD(CAST(RIGHT(m.registration_number, 4) AS UNSIGNED), 6)
       WHEN 0 THEN 'Aspirin'
       WHEN 1 THEN 'Metformin'
       WHEN 2 THEN 'Omeprazole'
       WHEN 3 THEN 'Azithromycin'
       WHEN 4 THEN 'Vitamin C'
       WHEN 5 THEN 'Caffeine'
     END
WHERE m.registration_number BETWEEN 'DEMO-RW-0007' AND 'DEMO-RW-0056';
