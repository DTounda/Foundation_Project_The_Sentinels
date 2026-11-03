const { parsePositiveInt } = require('../utils/validators');

function createMedicineController({ medicineService }) {
  return {
    async getMedicine(req, res) {
      const medicineId = parsePositiveInt(req.params.id, 'id');
      const result = await medicineService.getMedicineDetails(medicineId);
      res.status(200).json(result);
    },
  };
}

module.exports = { createMedicineController };