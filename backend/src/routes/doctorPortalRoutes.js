
const express = require('express');
const router = express.Router();

const { authenticateToken, authorizeRoles } =
  require('../middleware/authMiddleware');

const controller = require('../controllers/doctorPortalController');

router.use(authenticateToken, authorizeRoles('doctor'));

router.get('/dashboard', controller.dashboard);

router.get('/appointments', controller.appointments);
router.patch('/appointments/:id/status', controller.updateAppointmentStatus);

router.get('/patients', controller.patients);
router.get('/patients/:id', controller.patientDetail);

router.get('/availability', controller.getSchedule);
router.put('/availability', controller.saveSchedule);

router.get('/profile', controller.getProfile);
router.put('/profile', controller.updateProfile);

router.get('/earnings', controller.earnings);

// Reviews cannot be fetched until a reviews table exists.
router.get('/reviews', (req, res) => {
  res.json({
    success: true,
    data: [],
    message: 'Patient reviews are not configured yet.'
  });
});

module.exports = router;
