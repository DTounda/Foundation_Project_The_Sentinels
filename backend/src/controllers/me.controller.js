const {
  parseContactName,
  parseEmail,
  parseFullName,
  parseMedicationName,
  parsePhone,
  parsePositiveInt,
} = require('../utils/validators');

function parseOptionalEmail(value) {
  if (value === undefined || value === null || value === '') return null;
  return parseEmail(value);
}

function createMeController({ meService, medicationService }) {
  return {
    getProfile: async (req, res) => res.json(await meService.getProfile(req.user.id)),

    updateAccount: async (req, res) => {
      const body = req.body || {};
      const result = await meService.updateAccount(req.user.id, {
        fullName: parseFullName(body.fullName),
        email: parseEmail(body.email),
        phone: parsePhone(body.phone),
      });
      res.json(result);
    },

    updateDoctor: async (req, res) => {
      const body = req.body || {};
      const doctor = {
        name: parseContactName(body.name),
        phone: parsePhone(body.phone),
        email: parseOptionalEmail(body.email),
      };
      res.json(await meService.updateDoctor(req.user.id, doctor));
    },

    updatePharmacy: async (req, res) => {
      const body = req.body || {};
      const pharmacy = {
        name: parseContactName(body.name),
        phone: parsePhone(body.phone),
      };
      res.json(await meService.updatePharmacy(req.user.id, pharmacy));
    },

    listMedications: async (req, res) => {
      res.json({ medications: await medicationService.list(req.user.id) });
    },

    createMedication: async (req, res) => {
      const medication = await medicationService.create(
        req.user.id,
        parseMedicationName((req.body || {}).name),
      );
      res.status(201).json(medication);
    },

    getMedication: async (req, res) => {
      const id = parsePositiveInt(req.params.id, 'id');
      res.json(await medicationService.get(req.user.id, id));
    },

    updateMedication: async (req, res) => {
      const id = parsePositiveInt(req.params.id, 'id');
      const medication = await medicationService.update(
        req.user.id,
        id,
        parseMedicationName((req.body || {}).name),
      );
      res.json(medication);
    },

    deleteMedication: async (req, res) => {
      const id = parsePositiveInt(req.params.id, 'id');
      await medicationService.remove(req.user.id, id);
      res.status(204).end();
    },
  };
}

module.exports = { createMeController };