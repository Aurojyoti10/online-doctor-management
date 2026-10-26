

const express = require('express');
const router = express.Router();

const {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMyProfile,
  updateMyProfile,
} = require('../controllers/patientController');

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');

// All patient endpoints require authentication.
router.use(authenticateToken);

// Patient self-service profile endpoints.
router.get('/me', authorizeRoles('patient'), getMyProfile);
router.put('/me', authorizeRoles('patient'), updateMyProfile);

// Admin-only patient management.
router.get('/', authorizeRoles('admin'), getAllPatients);
router.get('/:id', authorizeRoles('admin'), getPatientById);
router.post('/', authorizeRoles('admin'), createPatient);
router.put('/:id', authorizeRoles('admin'), updatePatient);
router.delete('/:id', authorizeRoles('admin'), deletePatient);

module.exports = router;
