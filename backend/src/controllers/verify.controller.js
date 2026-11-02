
const { parseBarcode, parseSearchQuery } = require('../utils/validators');

function createVerifyController({ verificationService }) {
  return {
    async verifyBarcode(req, res) {
      const barcode = parseBarcode(req.body && req.body.barcode);
      const userId = req.user ? req.user.id : null;
      const result = await verificationService.verifyByBarcode({ barcode, userId });
      res.status(200).json(result);
    },

    async searchMedicines(req, res) {
      const query = parseSearchQuery(req.query.q);
      const userId = req.user ? req.user.id : null;
      const result = await verificationService.searchByName({ query, userId });
      res.status(200).json(result);
    },
  };
}

module.exports = { createVerifyController };
