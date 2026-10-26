const pool = require('../config/database');

const getAllDoctors = async (req, res) => {
  try {
    const [doctors] = await pool.query(`

SELECT
  d.id,
  d.user_id,
  u.name,
  u.email,
  d.specialization,
  d.qualification,
  d.experience_years,
  d.consultation_fee,
  d.city,
d.hospital,
d.about,
d.languages,
  d.created_at,
  d.updated_at
FROM doctors d
JOIN users u ON d.user_id = u.id

    `);

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });

  } catch (error) {
    console.error('Error fetching doctors:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors'
    });
  }
};


const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const [doctors] = await pool.query(`

SELECT
  d.id,
  d.user_id,
  u.name,
  u.email,
  d.specialization,
  d.qualification,
  d.experience_years,
  d.consultation_fee,
  d.city,
d.hospital,
d.about,
d.languages,
  d.created_at,
  d.updated_at
FROM doctors d
JOIN users u ON d.user_id = u.id
WHERE d.id = ?

    `, [id]);

    if (doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctors[0]
    });

  } catch (error) {
    console.error('Error fetching doctor:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor'
    });
  }
};



const bcrypt = require('bcryptjs');

const createDoctor = async (req, res) => {
  let connection;

  try {
    const {
      name,
      email,
      password,
      specialization,
      qualification,
      experience_years = 0,
      consultation_fee = 0
    } = req.body;

    if (
      !name?.trim() ||
      !email?.trim() ||
      !password ||
      !specialization?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and specialization are required'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must contain at least 8 characters'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const experience = Number(experience_years);
    const fee = Number(consultation_fee);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Enter a valid email address'
      });
    }

    if (
      !Number.isInteger(experience) ||
      experience < 0 ||
      !Number.isFinite(fee) ||
      fee < 0
    ) {
      return res.status(400).json({
        success: false,
        message: 'Experience and consultation fee must be valid non-negative numbers'
      });
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [normalizedEmail]
    );

    if (existingUsers.length) {
      await connection.rollback();

      return res.status(409).json({
        success: false,
        message: 'This email address is already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [userResult] = await connection.query(
      `INSERT INTO users (name, email, password, role)
       VALUES (?, ?, ?, 'doctor')`,
      [name.trim(), normalizedEmail, hashedPassword]
    );

    const userId = userResult.insertId;

    const [doctorResult] = await connection.query(
      `INSERT INTO doctors
        (user_id, specialization, qualification,
         experience_years, consultation_fee)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        specialization.trim(),
        qualification?.trim() || null,
        experience,
        fee
      ]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Doctor account created successfully',
      data: {
        id: doctorResult.insertId,
        user_id: userId,
        name: name.trim(),
        email: normalizedEmail,
        specialization: specialization.trim(),
        qualification: qualification?.trim() || null,
        experience_years: experience,
        consultation_fee: fee
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'This email address is already registered'
      });
    }

    console.error('Create doctor error:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create doctor account'
    });
  } finally {
    if (connection) connection.release();
  }
};

const updateDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      specialization,
      qualification,
      experience_years,
      consultation_fee
    } = req.body;

    const [result] = await pool.query(`
      UPDATE doctors
      SET
        specialization = ?,
        qualification = ?,
        experience_years = ?,
        consultation_fee = ?
      WHERE id = ?
    `, [
      specialization,
      qualification,
      experience_years,
      consultation_fee,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const [doctors] = await pool.query(`
      SELECT
        id,
        user_id,
        specialization,
        qualification,
        experience_years,
        consultation_fee,
        created_at,
        updated_at
      FROM doctors
      WHERE id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctors[0]
    });

  } catch (error) {
    console.error('Error updating doctor:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update doctor'
    });
  }
};
const deleteDoctor = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      'DELETE FROM doctors WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Doctor deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting doctor:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor'
    });
  }
};
module.exports = {
  getAllDoctors,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor
};