const pool = require('../config/database');

const getAllPatients = async (req, res) => {
  try {
    const [patients] = await pool.query(`
      SELECT
        p.id,
        p.user_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.address,
        p.created_at,
        p.updated_at
      FROM patients p
    `);

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });

  } catch (error) {
    console.error('Error fetching patients:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients'
    });
  }
};

const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const [patients] = await pool.query(`
      SELECT
        p.id,
        p.user_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.address,
        p.created_at,
        p.updated_at
      FROM patients p
      WHERE p.id = ?
    `, [id]);

    if (patients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patients[0]
    });

  } catch (error) {
    console.error('Error fetching patient:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient'
    });
  }
};

const createPatient = async (req, res) => {
  try {
    const {
      user_id,
      date_of_birth,
      gender,
      phone,
      address
    } = req.body;

    const [result] = await pool.query(
      `
      INSERT INTO patients
      (user_id, date_of_birth, gender, phone, address)
      VALUES (?, ?, ?, ?, ?)
      `,
      [user_id, date_of_birth, gender, phone, address]
    );

    res.status(201).json({
      success: true,
      message: 'Patient created successfully',
      data: {
        id: result.insertId,
        user_id,
        date_of_birth,
        gender,
        phone,
        address
      }
    });

  } catch (error) {
    console.error('Error creating patient:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create patient'
    });
  }
};

const updatePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      date_of_birth,
      gender,
      phone,
      address
    } = req.body;

    const [result] = await pool.query(
      `
      UPDATE patients
      SET
        date_of_birth = ?,
        gender = ?,
        phone = ?,
        address = ?
      WHERE id = ?
      `,
      [date_of_birth, gender, phone, address, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const [patients] = await pool.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.date_of_birth,
        p.gender,
        p.phone,
        p.address,
        p.created_at,
        p.updated_at
      FROM patients p
      WHERE p.id = ?
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Patient updated successfully',
      data: patients[0]
    });

  } catch (error) {
    console.error('Error updating patient:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update patient'
    });
  }
};

const deletePatient = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query(
      `
      DELETE FROM patients
      WHERE id = ?
      `,
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting patient:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete patient'
    });
  }
};

module.exports = {
  getAllPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient
};