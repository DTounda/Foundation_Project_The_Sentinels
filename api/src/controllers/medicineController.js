const { searchMedicineByName } = require("../services/medicineService");

async function searchMedicine(req, res) {
  const name = req.query.name;

  if (typeof name !== "string" || !name.trim()) {
    return res.status(400).json({
      message: "Please provide a medicine name"
    });
  }

  try {
    const medicines = await searchMedicineByName(name.trim());

    return res.json({
      message: "Medicine search completed",
      results: medicines
    });
  } catch (error) {
    console.error("Medicine search failed:", error.message);

    return res.status(500).json({
      message: "Unable to search medicines"
    });
  }
}

module.exports = { searchMedicine };
