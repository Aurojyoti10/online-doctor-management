
const pool = require('../config/database');

// Get all patients (Admin only)
const getAllPatients = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.*,
        u.name,
        u.email
      FROM patients p
      INNER JOIN users u ON u.id = p.user_id
      ORDER BY p.id DESC
    `);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error('getAllPatients error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve patients.',
    });
  }
};

// Get a patient by patient ID (Admin only)
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(
      `SELECT p.*, u.name, u.email
       FROM patients p
       INNER JOIN users u ON u.id = p.user_id
       WHERE p.id = ?
       LIMIT 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('getPatientById error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve patient.',
    });
  }
};

// Create a patient (Admin only)
const createPatient = async (req, res) => {
  try {
    const {
      user_id,
      date_of_birth,
      gender,
      phone,
      address,
    } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required.',
      });
    }

    const [users] = await pool.query(
      `SELECT id FROM users WHERE id = ? AND role = 'patient' LIMIT 1`,
      [user_id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient user account not found.',
      });
    }

    const [existing] = await pool.query(
      'SELECT id FROM patients WHERE user_id = ? LIMIT 1',
      [user_id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'A patient profile already exists for this user.',
      });
    }

    const [result] = await pool.query(
      `INSERT INTO patients
       (user_id, date_of_birth, gender, phone, address)
       VALUES (?, ?, ?, ?, ?)`,
      [
        user_id,
        date_of_birth || null,
        gender || null,
        phone || null,
        address || null,
      ]
    );

    const [rows] = await pool.query(
      `SELECT p.*, u.name, u.email
       FROM patients p
       INNER JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Patient created successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('createPatient error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'A duplicate patient record already exists.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create patient.',
    });
  }
};

// Update a patient by patient ID (Admin only)
const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date_of_birth,
      gender,
      phone,
      address,
    } = req.body;

    const [result] = await pool.query(
      `UPDATE patients
       SET date_of_birth = ?,
           gender = ?,
           phone = ?,
           address = ?
       WHERE id = ?`,
      [
        date_of_birth || null,
        gender || null,
        phone || null,
        address || null,
        id,
      ]
    );

    if (result.affectedRows === 0) {
      const [rows] = await pool.query(
        'SELECT id FROM patients WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found.',
        });
      }
    }

    const [rows] = await pool.query(
      `SELECT p.*, u.name, u.email
       FROM patients p
       INNER JOIN users u ON u.id = p.user_id
       WHERE p.id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: 'Patient updated successfully.',
      data: rows[0],
    });
  } catch (error) {
    console.error('updatePatient error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update patient.',
    });
  }
};

// Delete a patient by patient ID (Admin only)
const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM patients WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Patient deleted successfully.',
    });
  } catch (error) {
    console.error('deletePatient error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete patient.',
    });
  }
};

// Get the logged-in patient's own profile
const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT
         u.id AS user_id,
         u.name,
         u.email,
         p.id AS patient_id,
         p.date_of_birth,
         p.gender,
         p.phone,
         p.address
       FROM users u
       INNER JOIN patients p ON p.user_id = u.id
       WHERE u.id = ?
         AND u.role = 'patient'
       LIMIT 1`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error('getMyProfile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your profile.',
    });
  }
};

// Update the logged-in patient's own profile
const updateMyProfile = async (req, res) => {
  let connection;

  try {
    const userId = req.user.id;

    const {
      name,
      email,
      date_of_birth,
      gender,
      phone,
      address,
    } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name and email are required.',
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [users] = await connection.query(
      `SELECT id
       FROM users
       WHERE id = ? AND role = 'patient'
       LIMIT 1`,
      [userId]
    );

    if (users.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Patient account not found.',
      });
    }

    const [patients] = await connection.query(
      'SELECT id FROM patients WHERE user_id = ? LIMIT 1',
      [userId]
    );

    if (patients.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: 'Patient profile not found.',
      });
    }

    await connection.query(
      `UPDATE users
       SET name = ?, email = ?
       WHERE id = ?`,
      [name.trim(), email.trim(), userId]
    );

    await connection.query(
      `UPDATE patients
       SET date_of_birth = ?,
           gender = ?,
           phone = ?,
           address = ?
       WHERE user_id = ?`,
      [
        date_of_birth || null,
        gender || null,
        typeof phone === 'string' ? phone.trim() || null : null,
        typeof address === 'string' ? address.trim() || null : null,
        userId,
      ]
    );

    await connection.commit();

    const [rows] = await pool.query(
      `SELECT
         u.id AS user_id,
         u.name,
         u.email,
         p.id AS patient_id,
         p.date_of_birth,
         p.gender,
         p.phone,
         p.address
       FROM users u
       INNER JOIN patients p ON p.user_id = u.id
       WHERE u.id = ?
         AND u.role = 'patient'
       LIMIT 1`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: rows[0],
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error('updateMyProfile error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'That email address is already in use.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to update your profile.',
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getMyProfile,
  updateMyProfile,
};
