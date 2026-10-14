
const express = require('express');
const router = express.Router();

const {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointmentController');

const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getAllAppointments);
router.get('/:id', authenticateToken, getAppointmentById);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('doctor', 'admin'),
  createAppointment
);

router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('doctor', 'admin'),
  updateAppointment
);

router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  deleteAppointment
);

module.exports = router;
