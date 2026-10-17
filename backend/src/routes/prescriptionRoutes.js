
const express = require('express');
const router = express.Router();

const {
  getPrescriptions,
  createPrescription
} = require('../controllers/prescriptionController');

const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getPrescriptions);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('doctor', 'admin'),
  createPrescription
);

module.exports = router;
