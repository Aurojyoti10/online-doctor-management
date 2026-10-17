
const pool = require('../config/database');

const getPrescriptions = async (req, res) => {
  try {
    let query = `
      SELECT pr.*, a.patient_id, a.doctor_id
      FROM prescriptions pr
      JOIN appointments a ON pr.appointment_id = a.id
    `;
    const params = [];

    if (req.user.role === 'patient') {
      query += `
        JOIN patients p ON a.patient_id = p.id
        WHERE p.user_id = ?
      `;
      params.push(req.user.id);
    } else if (req.user.role === 'doctor') {
      query += `
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.user_id = ?
      `;
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
    console.error('Fetch prescriptions error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prescriptions'
    });
  }
};

const createPrescription = async (req, res) => {
  try {
    const { appointment_id, diagnosis, medications, instructions } = req.body;

    if (!appointment_id || !diagnosis?.trim() || !medications?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment, diagnosis and medications are required'
      });
    }

    const [appointments] = await pool.query(
      'SELECT id, doctor_id FROM appointments WHERE id = ?',
      [appointment_id]
    );

    if (!appointments.length) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    if (req.user.role === 'doctor') {
      const [doctors] = await pool.query(
        'SELECT id FROM doctors WHERE user_id = ?',
        [req.user.id]
      );

      if (!doctors.length || doctors[0].id !== appointments[0].doctor_id) {
        return res.status(403).json({
          success: false,
          message: 'You can only prescribe for your own appointments'
        });
      }
    }

    const [result] = await pool.query(
      `INSERT INTO prescriptions
       (appointment_id, diagnosis, medications, instructions)
       VALUES (?, ?, ?, ?)`,
      [appointment_id, diagnosis.trim(), medications.trim(), instructions || null]
    );

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      data: { id: result.insertId, appointment_id, diagnosis, medications, instructions }
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A prescription already exists for this appointment'
      });
    }

    console.error('Create prescription error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create prescription'
    });
  }
};

module.exports = { getPrescriptions, createPrescription };
