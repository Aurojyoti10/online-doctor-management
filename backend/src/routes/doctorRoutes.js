

const express = require('express');
const router = express.Router();

const {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} = require('../controllers/doctorController');

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');

// Public doctor directory: patients must be able to find doctors.
router.get('/', getAllDoctors);
router.get('/:id', getDoctorById);

// Only admins can create, modify, or delete doctor accounts.
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  createDoctor
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  updateDoctor
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  deleteDoctor
);

module.exports = router;
