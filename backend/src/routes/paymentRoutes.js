
const express = require('express');
const router = express.Router();

const {
  createPayment,
  getPayments
} = require('../controllers/paymentController');

const {
  authenticateToken,
  authorizeRoles
} = require('../middleware/authMiddleware');

router.get('/', authenticateToken, getPayments);
router.post('/', authenticateToken, authorizeRoles('patient', 'admin'), createPayment);

module.exports = router;
