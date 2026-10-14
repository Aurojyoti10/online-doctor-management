const pool = require('../config/database');


const getAllAppointments = async (req, res) => {
  try {
    let query = `
      SELECT a.id, a.patient_id, a.doctor_id,
             a.appointment_date, a.start_time, a.end_time,
             a.status, a.reason, a.created_at, a.updated_at
      FROM appointments a
    `;
    const params = [];

    if (req.user.role === 'patient') {
      query += ' JOIN patients p ON a.patient_id = p.id WHERE p.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      query += ' JOIN doctors d ON a.doctor_id = d.id WHERE d.user_id = ?';
      params.push(req.user.id);
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

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
      status,
      reason
    } = req.body;
    if (!patient_id || !doctor_id || !appointment_date || !start_time || !end_time) {
    return res.status(400).json({
      success: false,
      message: 'patient_id, doctor_id, appointment_date, start_time and end_time are required'
    });
  }
  if (start_time >= end_time) {
  return res.status(400).json({
    success: false,
    message: 'End time must be after start time'
  });
}
// Check if patient exists
const [patients] = await pool.query(
  `SELECT id FROM patients WHERE id = ?`,
  [patient_id]
);

if (patients.length === 0) {
  return res.status(404).json({
    success: false,
    message: 'Patient not found'
  });
}
// Check if doctor exists
const [doctors] = await pool.query(
  `SELECT id FROM doctors WHERE id = ?`,
  [doctor_id]
);

if (doctors.length === 0) {
  return res.status(404).json({
    success: false,
    message: 'Doctor not found'
  });
}
// Check if doctor already has an overlapping appointment
const [existingAppointments] = await pool.query(
  `
  SELECT id
  FROM appointments
  WHERE doctor_id = ?
    AND appointment_date = ?
    AND status IN ('scheduled', 'confirmed')
    AND start_time < ?
    AND end_time > ?
  `,
  [
    doctor_id,
    appointment_date,
    end_time,
    start_time
  ]
);

if (existingAppointments.length > 0) {
  return res.status(409).json({
    success: false,
    message: 'Doctor is already booked for this time'
  });
}
    const [result] = await pool.query(
      `
      INSERT INTO appointments
      (
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status,
        reason
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status || 'scheduled',
        reason
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: {
        id: result.insertId,
        patient_id,
        doctor_id,
        appointment_date,
        start_time,
        end_time,
        status: status || 'scheduled',
        reason
      }
    });

  } catch (error) {
    console.error('Error creating appointment:', error);

    res.status(500).json({
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
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM appointments
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Appointment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting appointment:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete appointment'
    });
  }
};


module.exports = {
  getAllAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment
};