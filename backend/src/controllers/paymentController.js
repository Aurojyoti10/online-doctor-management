
const pool = require('../config/database');
const crypto = require('crypto');

const createPayment = async (req, res) => {
  try {
    const { appointment_id, amount, payment_method } = req.body;

    if (!appointment_id || amount == null || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'appointment_id, amount and payment_method are required'
      });
    }

    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a positive number'
      });
    }

    if (!['card', 'upi', 'cash'].includes(payment_method)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    const [appointments] = await pool.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.status,
              d.user_id AS doctor_user_id,
              p.user_id AS patient_user_id
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN patients p ON p.id = a.patient_id
       WHERE a.id = ?`,
      [appointment_id]
    );

    if (!appointments.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const appointment = appointments[0];

    if (
      req.user.role === 'patient' &&
      appointment.patient_user_id !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only pay for your own appointments'
      });
    }

    if (req.user.role !== 'patient' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only patients or admins can create payments'
      });
    }

    const [existing] = await pool.query(
      `SELECT id FROM payments
       WHERE appointment_id = ? AND status = 'completed'`,
      [appointment_id]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: 'This appointment is already marked as paid'
      });
    }

    // Demo only: this simulates a successful payment.
    const transactionRef = `DEMO-${crypto.randomUUID()}`;

    const [result] = await pool.query(
      `INSERT INTO payments
       (appointment_id, amount, payment_method, status, transaction_ref)
       VALUES (?, ?, ?, 'completed', ?)`,
      [appointment_id, Number(amount), payment_method, transactionRef]
    );

    res.status(201).json({
      success: true,
      message: 'Demo payment completed successfully',
      data: {
        id: result.insertId,
        appointment_id: Number(appointment_id),
        amount: Number(amount),
        payment_method,
        status: 'completed',
        transaction_ref: transactionRef
      }
    });
  } catch (error) {
    console.error('Create payment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment'
    });
  }
};

const getPayments = async (req, res) => {
  try {
    let query = `
      SELECT pay.id, pay.appointment_id, pay.amount,
             pay.payment_method, pay.status, pay.transaction_ref,
             pay.created_at
      FROM payments pay
      JOIN appointments a ON a.id = pay.appointment_id
      JOIN patients p ON p.id = a.patient_id
      JOIN doctors d ON d.id = a.doctor_id
    `;
    const params = [];

    if (req.user.role === 'patient') {
      query += ' WHERE p.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      query += ' WHERE d.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [rows] = await pool.query(query, params);
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('Fetch payments error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments'
    });
  }
};

module.exports = { createPayment, getPayments };
