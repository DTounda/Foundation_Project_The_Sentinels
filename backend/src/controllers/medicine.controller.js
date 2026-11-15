const { parsePositiveInt } = require('../utils/validators');

function createMedicineController({ medicineService, interactionService }) {
  return {
    async getMedicine(req, res) {
      const medicineId = parsePositiveInt(req.params.id, 'id');
      const result = await medicineService.getMedicineDetails(medicineId);
      res.status(200).json(result);
    },

    async getInteractions(req, res) {
      const medicineId = parsePositiveInt(req.params.id, 'id');
      const interactions = await interactionService.getInteractions(medicineId, req.user.id);
      res.status(200).json({ interactions });
    },
  };
}

module.exports = { createMedicineController };