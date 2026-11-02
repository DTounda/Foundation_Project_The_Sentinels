const { Router } = require('express');

function createAllergyRoutes({ allergyController, requireAuth }) {
  const router = Router();
  router.get('/ingredients', allergyController.listIngredients); // public: feeds the allergy picker
  router.get('/allergies', requireAuth, allergyController.listAllergies);
  router.post('/allergies', requireAuth, allergyController.addAllergy);
  router.get('/allergies/check', requireAuth, allergyController.checkMedicine);
  router.delete('/allergies/:id', requireAuth, allergyController.removeAllergy);
  return router;
}

module.exports = { createAllergyRoutes };
