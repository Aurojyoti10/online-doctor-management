

const express = require('express');
const router = express.Router();

const {
  createPayment,
  getPayments,
  confirmDemoPayment,
} = require('../controllers/paymentController');

const {
  authenticateToken,
  authorizeRoles,
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getPayments);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('patient', 'admin'),
  createPayment
);

router.post(
  '/:id/confirm-demo',
  authenticateToken,
  authorizeRoles('patient', 'admin'),
  confirmDemoPayment
);

module.exports = router;
