
const { searchMedicineByName } = require("../services/medicineService");

function searchMedicine(req, res) {
  const name = req.query.name;

  if (!name || !name.trim()) {
    return res.status(400).json({
      message: "Please provide a medicine name"
    });
  }

  const medicines = searchMedicineByName(name.trim());

  res.json({
    message: "Medicine search completed",
    results: medicines
  });
}

module.exports = { searchMedicine };

