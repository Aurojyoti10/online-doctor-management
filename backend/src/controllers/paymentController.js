
const pool = require('../config/database');
const crypto = require('crypto');

const createPayment = async (req, res) => {
  let connection;

  try {
    const { appointment_id, payment_method } = req.body;

    if (
      !Number.isInteger(Number(appointment_id)) ||
      Number(appointment_id) < 1 ||
      !['upi', 'cash'].includes(payment_method)
    ) {
      return res.status(400).json({
        success: false,
        message: 'A valid appointment_id and payment_method (upi or cash) are required',
      });
    }

    if (!['patient', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only patients or admins can initiate payments',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [appointments] = await connection.query(
      `SELECT a.id, a.patient_id, a.doctor_id, a.status,
              d.consultation_fee,
              p.user_id AS patient_user_id
       FROM appointments a
       JOIN doctors d ON d.id = a.doctor_id
       JOIN patients p ON p.id = a.patient_id
       WHERE a.id = ?
       FOR UPDATE`,
      [Number(appointment_id)]
    );

    if (!appointments.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
      });
    }

    const appointment = appointments[0];

    if (
      req.user.role === 'patient' &&
      Number(appointment.patient_user_id) !== Number(req.user.id)
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You can only pay for your own appointments',
      });
    }

    if (appointment.status === 'cancelled') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'A cancelled appointment cannot be paid for',
      });
    }

    const [existing] = await connection.query(
      `SELECT id, status
       FROM payments
       WHERE appointment_id = ?
       FOR UPDATE`,
      [Number(appointment_id)]
    );

    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'A payment record already exists for this appointment',
      });
    }

    const amount = Number(appointment.consultation_fee);

    if (!Number.isFinite(amount) || amount <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'The doctor does not have a valid consultation fee',
      });
    }

    const transactionRef = `DEMO-${crypto.randomUUID()}`;
    const status = payment_method === 'cash' ? 'pending' : 'pending';

    const [result] = await connection.query(
      `INSERT INTO payments
       (appointment_id, amount, payment_method, status, transaction_ref)
       VALUES (?, ?, ?, ?, ?)`,
      [Number(appointment_id), amount, payment_method, status, transactionRef]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: payment_method === 'cash'
        ? 'Cash payment recorded as pending'
        : 'Demo payment created. Complete the simulated payment to confirm it.',
      data: {
        id: result.insertId,
        appointment_id: Number(appointment_id),
        doctor_id: appointment.doctor_id,
        amount,
        payment_method,
        status,
        transaction_ref: transactionRef,
      },
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('Create payment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create payment',
    });
  } finally {
    if (connection) connection.release();
  }
};

const getPayments = async (req, res) => {
  try {
    let query = `
      SELECT pay.id, pay.appointment_id, pay.amount,
             pay.payment_method, pay.status, pay.transaction_ref,
             pay.created_at, a.doctor_id, a.appointment_date,
             a.start_time, u.name AS doctor_name
      FROM payments pay
      JOIN appointments a ON a.id = pay.appointment_id
      JOIN patients p ON p.id = a.patient_id
      JOIN doctors d ON d.id = a.doctor_id
      JOIN users u ON u.id = d.user_id
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
        message: 'Access denied',
      });
    }

    query += ' ORDER BY pay.created_at DESC';

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('Fetch payments error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
    });
  }
};

const confirmDemoPayment = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;

    if (!/^\d+$/.test(String(id))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment ID',
      });
    }

    if (req.user.role !== 'patient' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `SELECT pay.id, pay.status, pay.payment_method,
              p.user_id AS patient_user_id
       FROM payments pay
       JOIN appointments a ON a.id = pay.appointment_id
       JOIN patients p ON p.id = a.patient_id
       WHERE pay.id = ?
       FOR UPDATE`,
      [Number(id)]
    );

    if (!rows.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    const payment = rows[0];

    if (
      req.user.role === 'patient' &&
      Number(payment.patient_user_id) !== Number(req.user.id)
    ) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: 'You can only confirm your own demo payment',
      });
    }

    if (payment.payment_method !== 'upi') {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Only demo online payments can use this confirmation endpoint',
      });
    }

    if (payment.status === 'completed') {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Payment is already completed',
      });
    }

    const [result] = await connection.query(
      `UPDATE payments
       SET status = 'completed'
       WHERE id = ? AND status = 'pending'`,
      [Number(id)]
    );

    if (!result.affectedRows) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Payment status could not be updated',
      });
    }

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: 'Demo payment completed successfully',
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('Confirm demo payment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to confirm demo payment',
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {
  createPayment,
  getPayments,
  confirmDemoPayment,
};
