const pool = require('../config/database');

const getAllAppointments = async (req, res) => {
  try {
    const [appointments] = await pool.query(`
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.reason,
        a.created_at,
        a.updated_at
      FROM appointments a
    `);

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });

  } catch (error) {
    console.error('Error fetching appointments:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
};


const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [appointments] = await pool.query(`
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.reason,
        a.created_at,
        a.updated_at
      FROM appointments a
      WHERE a.id = ?
    `, [id]);

    if (appointments.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: appointments[0]
    });

  } catch (error) {
    console.error('Error fetching appointment:', error);

    res.status(500).json({
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

    const [result] = await pool.query(
      `
      UPDATE appointments
      SET
        appointment_date = ?,
        start_time = ?,
        end_time = ?,
        status = ?,
        reason = ?
      WHERE id = ?
      `,
      [
        appointment_date,
        start_time,
        end_time,
        status,
        reason,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    const [appointments] = await pool.query(
      `
      SELECT
        a.id,
        a.patient_id,
        a.doctor_id,
        a.appointment_date,
        a.start_time,
        a.end_time,
        a.status,
        a.reason,
        a.created_at,
        a.updated_at
      FROM appointments a
      WHERE a.id = ?
      `,
      [id]
    );

    res.status(200).json({
      success: true,
      message: 'Appointment updated successfully',
      data: appointments[0]
    });

  } catch (error) {
    console.error('Error updating appointment:', error);

    res.status(500).json({
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