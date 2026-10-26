

const express = require('express');
const router = express.Router();

const { getDashboardStats } = require('../controllers/adminController');
const {
  getSchedules,
  saveDaySchedule,
} = require('../controllers/adminScheduleController');

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');

router.use(authenticateToken, authorizeRoles('admin'));

router.get('/dashboard', getDashboardStats);

router.get('/schedules', getSchedules);
router.put('/doctors/:doctorId/schedules/:day', (req, res, next) => {
  // Keep the URL weekday and request body consistent.
  if (req.params.day !== req.body.day_of_week) {
    return res.status(400).json({
      success: false,
      message: 'URL weekday and body weekday must match',
    });
  }
  next();
}, saveDaySchedule);

module.exports = router;
