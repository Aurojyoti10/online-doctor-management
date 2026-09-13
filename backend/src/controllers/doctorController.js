const pool = require('../config/database');

const getAllDoctors = async (req, res) => {
  try {
    const [doctors] = await pool.query(`
      SELECT
        d.id,
        d.user_id,
        d.specialization,
        d.qualification,
        d.experience_years,
        d.consultation_fee,
        d.created_at,
        d.updated_at
      FROM doctors d
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
        d.specialization,
        d.qualification,
        d.experience_years,
        d.consultation_fee,
        d.created_at,
        d.updated_at
      FROM doctors d
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


const createDoctor = async (req, res) => {
  try {
    const {
      user_id,
      specialization,
      qualification,
      experience_years,
      consultation_fee
    } = req.body;

    if (!user_id || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'user_id and specialization are required'
      });
    }

    const [result] = await pool.query(`
      INSERT INTO doctors
      (user_id, specialization, qualification, experience_years, consultation_fee)
      VALUES (?, ?, ?, ?, ?)
    `, [
      user_id,
      specialization,
      qualification || null,
      experience_years || 0,
      consultation_fee || 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: {
        id: result.insertId,
        user_id,
        specialization,
        qualification: qualification || null,
        experience_years: experience_years || 0,
        consultation_fee: consultation_fee || 0
      }
    });

  } catch (error) {
    console.error('Error creating doctor:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create doctor'
    });
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