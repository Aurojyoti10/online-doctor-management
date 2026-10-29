const pool = require('../config/database');
const crypto = require('crypto');

const getAvailableSlots = async (req, res) => {
  try {
    const { doctor_id, date } = req.query;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') ||
        !Number.isInteger(Number(doctor_id)) || Number(doctor_id) < 1) {
      return res.status(400).json({ success: false, message: 'Valid doctor_id and date are required' });
    }

    const dt = new Date(date + 'T00:00:00Z');
    if (Number.isNaN(dt.getTime()) || dt.toISOString().slice(0, 10) !== date) {
      return res.status(400).json({ success: false, message: 'Invalid date' });
    }

    const [doctors] = await pool.query('SELECT id FROM doctors WHERE id = ?', [Number(doctor_id)]);
    if (!doctors.length) return res.status(404).json({ success: false, message: 'Doctor not found' });

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const [schedules] = await pool.query(
      'SELECT start_time, end_time FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ? AND is_available = 1 ORDER BY start_time',
      [Number(doctor_id), days[dt.getUTCDay()]]
    );
    const [booked] = await pool.query(
  `SELECT start_time, end_time
   FROM appointments
   WHERE doctor_id = ?
     AND appointment_date = ?
     AND status IN ('scheduled', 'confirmed', 'pending')`,
  [Number(doctor_id), date]
);

    const mins = t => { const p = String(t).slice(0, 8).split(':').map(Number); return p[0] * 60 + p[1]; };
    const sqlTime = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') + ':00';
    const label = m => { const h = Math.floor(m / 60); return String(h % 12 || 12).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0') + (h < 12 ? ' AM' : ' PM'); };

    const now = new Date();
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
    const current = now.getHours() * 60 + now.getMinutes();
    const data = [];

    for (const s of schedules) {
      for (let m = mins(s.start_time); m + 30 <= mins(s.end_time); m += 30) {
        if (date === today && m <= current) continue;
        if (booked.some(b => mins(b.start_time) < m + 30 && mins(b.end_time) > m)) continue;
        data.push({ start_time: sqlTime(m), end_time: sqlTime(m + 30), label: label(m) });
      }
    }
    return res.json({ success: true, data });
  } catch (e) {
    console.error('Availability error:', e);
    return res.status(500).json({ success: false, message: 'Failed to fetch availability' });
  }
};




const getAllAppointments = async (req, res) => {
  try {
    if (!['admin', 'doctor', 'patient'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    let query = `
      SELECT
        a.id,
        a.patient_id,
        pu.name AS patient_name,
        a.doctor_id,
        du.name AS doctor_name,
        d.specialization,
        d.consultation_fee AS fee,
        DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.reason,
        a.created_at,
        a.updated_at
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN users pu ON pu.id = p.user_id
      JOIN doctors d ON d.id = a.doctor_id
      JOIN users du ON du.id = d.user_id
    `;

    const params = [];
    const conditions = [];

    if (req.user.role === 'patient') {
      conditions.push('p.user_id = ?');
      params.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      conditions.push('d.user_id = ?');
      params.push(req.user.id);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `;

    const [appointments] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
};


const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    let query = `
      SELECT a.id, a.patient_id, a.doctor_id,
             a.appointment_date, a.start_time, a.end_time,
             a.status, a.reason, a.created_at, a.updated_at
      FROM appointments a
      WHERE a.id = ?
    `;
    const params = [id];

    if (req.user.role === 'patient') {
      query += `
        AND EXISTS (
          SELECT 1 FROM patients p
          WHERE p.id = a.patient_id AND p.user_id = ?
        )
      `;
      params.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      query += `
        AND EXISTS (
          SELECT 1 FROM doctors d
          WHERE d.id = a.doctor_id AND d.user_id = ?
        )
      `;
      params.push(req.user.id);
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [appointments] = await pool.query(query, params);

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: appointments[0]
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch appointment'
    });
  }
};



const createAppointment = async (req, res) => {
  try {
    const {
      patient_id,
      doctor_id,
      appointment_date,
      start_time,
      end_time,
      reason
    } = req.body;

    if (!doctor_id || !appointment_date || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: 'doctor_id, appointment_date, start_time and end_time are required'
      });
    }

    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    let actualPatientId = patient_id;

    if (req.user.role === 'patient') {
      const [patients] = await pool.query(
        'SELECT id FROM patients WHERE user_id = ?',
        [req.user.id]
      );

      if (patients.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found for this account'
        });
      }

      actualPatientId = patients[0].id;
    }

    if (!actualPatientId) {
      return res.status(400).json({
        success: false,
        message: 'patient_id is required for doctor/admin bookings'
      });
    }

    const [patients] = await pool.query(
      'SELECT id FROM patients WHERE id = ?',
      [actualPatientId]
    );

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const [doctors] = await pool.query(
      'SELECT id FROM doctors WHERE id = ?',
      [doctor_id]
    );

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const dateString = String(appointment_date);
    const dt = new Date(dateString + 'T00:00:00Z');

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(dateString) ||
      Number.isNaN(dt.getTime()) ||
      dt.toISOString().slice(0, 10) !== dateString
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment date'
      });
    }

    const days = [
      'sunday', 'monday', 'tuesday', 'wednesday',
      'thursday', 'friday', 'saturday'
    ];

    const [scheduleRows] = await pool.query(
      `SELECT start_time, end_time
       FROM doctor_schedules
       WHERE doctor_id = ?
         AND day_of_week = ?
         AND is_available = 1`,
      [doctor_id, days[dt.getUTCDay()]]
    );

    const mins = (time) => {
      const parts = String(time).slice(0, 8).split(':').map(Number);
      return parts[0] * 60 + parts[1];
    };

    const startM = mins(start_time);
    const endM = mins(end_time);

    const valid = scheduleRows.some((slot) =>
      startM >= mins(slot.start_time) &&
      endM <= mins(slot.end_time) &&
      (startM - mins(slot.start_time)) % 30 === 0 &&
      endM - startM === 30
    );

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: 'Time is outside the doctor schedule or is not a 30-minute slot'
      });
    }

    const now = new Date();
    const today =
      now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');

    if (
      dateString < today ||
      (
        dateString === today &&
        startM <= now.getHours() * 60 + now.getMinutes()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: 'Choose a future appointment time'
      });
    }

    // Scheduled, confirmed AND completed appointments block their time.
    // Only cancelled appointments release their slots.
    // Only active appointments block their time slots.
const [conflicts] = await pool.query(
  `SELECT id
   FROM appointments
   WHERE doctor_id = ?
     AND appointment_date = ?
     AND status IN ('scheduled', 'confirmed', 'pending')
     AND start_time < ?
     AND end_time > ?`,
  [doctor_id, dateString, end_time, start_time]
);

    if (conflicts.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Doctor is already booked for this time'
      });
    }

    const [result] = await pool.query(
      `INSERT INTO appointments
       (patient_id, doctor_id, appointment_date, start_time, end_time, status, reason)
       VALUES (?, ?, ?, ?, ?, 'scheduled', ?)`,
      [
        actualPatientId,
        doctor_id,
        dateString,
        start_time,
        end_time,
        reason || null
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        id: result.insertId,
        patient_id: actualPatientId,
        doctor_id,
        appointment_date: dateString,
        start_time,
        end_time,
        status: 'scheduled',
        reason: reason || null
      }
    });
  } catch (error) {
    console.error('Error creating appointment:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create appointment'
    });
  }
};
const updateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      appointment_date,
      start_time,
      end_time,
      status,
      reason
    } = req.body;

    if (
      !appointment_date ||
      !start_time ||
      !end_time ||
      !status
    ) {
      return res.status(400).json({
        success: false,
        message: 'Date, start time, end time and status are required'
      });
    }

    if (start_time >= end_time) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time'
      });
    }

    const [current] = await pool.query(
      'SELECT id, doctor_id FROM appointments WHERE id = ?',
      [id]
    );

    if (current.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    if (req.user.role === 'doctor') {
  const [doctor] = await pool.query(
    'SELECT id FROM doctors WHERE user_id = ?',
    [req.user.id]
  );

  if (
    doctor.length === 0 ||
    doctor[0].id !== current[0].doctor_id
  ) {
    return res.status(403).json({
      success: false,
      message: 'You can only update your own appointments'
    });
  }
}
    if (['scheduled', 'confirmed'].includes(status)) {
      const [conflicts] = await pool.query(
        `SELECT id FROM appointments
         WHERE doctor_id = ?
           AND appointment_date = ?
           AND status IN ('scheduled', 'confirmed')
           AND start_time < ?
           AND end_time > ?
           AND id <> ?`,
        [
          current[0].doctor_id,
          appointment_date,
          end_time,
          start_time,
          id
        ]
      );

      if (conflicts.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Doctor is already booked for this time'
        });
      }
    }

    await pool.query(
      `UPDATE appointments
       SET appointment_date = ?,
           start_time = ?,
           end_time = ?,
           status = ?,
           reason = ?
       WHERE id = ?`,
      [appointment_date, start_time, end_time, status, reason ?? null, id]
    );

    const [appointments] = await pool.query(
      'SELECT * FROM appointments WHERE id = ?',
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointments[0]
    });
  } catch (error) {
    console.error('Error updating appointment:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update appointment'
    });
  }
};



const deleteAppointment = async (req, res) => {
  let connection;

  try {
    const { id } = req.params;

    if (!/^\d+$/.test(String(id)) || Number(id) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID',
      });
    }

    if (!['patient', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Only patients or admins can cancel appointments',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [appointments] = await connection.query(
      `SELECT a.id, a.patient_id, a.status,
              p.user_id AS patient_user_id
       FROM appointments a
       JOIN patients p ON p.id = a.patient_id
       WHERE a.id = ?
       FOR UPDATE`,
      [Number(id)]
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
        message: 'You can only cancel your own appointments',
      });
    }

    if (appointment.status === 'cancelled') {
      await connection.rollback();
      return res.status(200).json({
        success: true,
        message: 'Appointment is already cancelled',
        data: {
          appointment_id: Number(id),
          status: 'cancelled',
          refund_status: 'unchanged',
          refund_amount: 0,
        },
      });
    }

    const [payments] = await connection.query(
      `SELECT id, amount, status, refund_status
       FROM payments
       WHERE appointment_id = ?
       FOR UPDATE`,
      [Number(id)]
    );

    let refundAmount = 0;
    let refundedPaymentCount = 0;

    for (const payment of payments) {
      // Only completed payments are eligible for a refund.
      if (payment.status !== 'completed') {
        continue;
      }

      // Never refund a payment twice.
      if (payment.refund_status === 'completed') {
        continue;
      }

      const amount = Number(payment.amount);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error(`Invalid amount for payment ${payment.id}`);
      }

      const refundReference =
        `DEMO-REFUND-${crypto.randomUUID()}`;

      // Simulated refund: no real money is transferred.
      const [refundResult] = await connection.query(
        `UPDATE payments
         SET refund_status = 'completed',
             refund_amount = amount,
             refund_reference = ?,
             refunded_at = CURRENT_TIMESTAMP
         WHERE id = ?
           AND status = 'completed'
           AND refund_status <> 'completed'`,
        [refundReference, payment.id]
      );

      if (refundResult.affectedRows === 1) {
        refundAmount += amount;
        refundedPaymentCount += 1;
      }
    }

    await connection.query(
      `UPDATE appointments
       SET status = 'cancelled'
       WHERE id = ?`,
      [Number(id)]
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: refundAmount > 0
        ? 'Appointment cancelled and simulated refund completed'
        : 'Appointment cancelled successfully; no refund was required',
      data: {
        appointment_id: Number(id),
        status: 'cancelled',
        refund_status: refundAmount > 0
          ? 'completed'
          : 'not_required',
        refund_amount: Number(refundAmount.toFixed(2)),
        refunded_payments: refundedPaymentCount,
        simulated: true,
      },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error('Cancel appointment error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment',
    });
  } finally {
    if (connection) connection.release();
  }
};



module.exports = {
  getAvailableSlots,
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};