const { parsePhoto } = require('../utils/validators');

function createPhotoController({ photoService }) {
  return {
    async verifyPhoto(req, res) {
      const image = parsePhoto(req.body && req.body.image);
      const result = await photoService.verifyPhoto(image);
      res.status(200).json(result);
    },
  };
}

module.exports = { createPhotoController };
