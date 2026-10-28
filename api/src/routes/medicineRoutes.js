
const express = require("express");
const { searchMedicine } = require("../controllers/medicineController");

const router = express.Router();

router.get("/search", searchMedicine);

module.exports = router;

