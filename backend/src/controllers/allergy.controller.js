const { DISCLAIMER } = require('../messages/resultMessages');
const { parsePositiveInt, parseSeverity } = require('../utils/validators');

function createAllergyController({ allergyService }) {
  return {
    async listIngredients(req, res) {
      const q = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 50) : '';
      res.json({ ingredients: await allergyService.listIngredients(q) });
    },

    async listAllergies(req, res) {
      res.json({ allergies: await allergyService.listAllergies(req.user.id) });
    },

    async addAllergy(req, res) {
      const body = req.body || {};
      const ingredientId = parsePositiveInt(body.ingredientId, 'ingredientId');
      const severity = parseSeverity(body.severity);
      const allergy = await allergyService.addAllergy(req.user.id, ingredientId, severity);
      res.status(201).json(allergy);
    },

    async removeAllergy(req, res) {
      const allergyId = parsePositiveInt(req.params.id, 'id');
      await allergyService.removeAllergy(req.user.id, allergyId);
      res.status(204).end();
    },

    async checkMedicine(req, res) {
      const medicineId = parsePositiveInt(req.query.medicineId, 'medicineId');
      const result = await allergyService.checkMedicine(req.user.id, medicineId);
      res.json({ ...result, disclaimer: DISCLAIMER });
    },
  };
}

module.exports = { createAllergyController };
