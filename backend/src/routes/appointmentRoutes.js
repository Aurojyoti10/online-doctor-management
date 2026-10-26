const express = require('express');
const router = express.Router();

const {
  getAvailableSlots,
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
} = require('../controllers/appointmentController');

const { authenticateToken, authorizeRoles } =
  require('../middleware/authMiddleware');

router.get('/availability', getAvailableSlots);
router.get('/', authenticateToken, getAllAppointments);
router.get('/:id', authenticateToken, getAppointmentById);

// Patients can book; doctors/admins can also create appointments.
router.post(
  '/',
  authenticateToken,
  authorizeRoles('patient', 'doctor', 'admin'),
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
  authorizeRoles('patient', 'admin'),
  deleteAppointment
);

module.exports = router;
