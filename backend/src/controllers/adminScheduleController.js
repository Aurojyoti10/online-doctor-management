
const pool = require('../config/database');

const getSchedules = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        s.id,
        s.doctor_id,
        u.name AS doctor_name,
        d.specialization,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.is_available
      FROM doctor_schedules s
      JOIN doctors d ON d.id = s.doctor_id
      JOIN users u ON u.id = d.user_id
      ORDER BY u.name,
        FIELD(s.day_of_week, 'monday', 'tuesday', 'wednesday',
          'thursday', 'friday', 'saturday', 'sunday'),
        s.start_time
    `);

    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load schedules',
    });
  }
};

const saveDaySchedule = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const doctorId = Number(req.params.doctorId);
    const { day_of_week, ranges = [], is_available = true } = req.body;

    const validDays = [
      'monday', 'tuesday', 'wednesday', 'thursday',
      'friday', 'saturday', 'sunday',
    ];

    if (!Number.isInteger(doctorId) || doctorId < 1) {
      return res.status(400).json({
        success: false, message: 'Invalid doctor ID',
      });
    }

    if (!validDays.includes(day_of_week)) {
      return res.status(400).json({
        success: false, message: 'Invalid weekday',
      });
    }

    if (!Array.isArray(ranges)) {
      return res.status(400).json({
        success: false, message: 'Ranges must be an array',
      });
    }

    for (const range of ranges) {
      if (
        !/^\d{2}:\d{2}$/.test(range.start || '') ||
        !/^\d{2}:\d{2}$/.test(range.end || '') ||
        range.start >= range.end
      ) {
        return res.status(400).json({
          success: false,
          message: 'Each range must have a valid start and end time',
        });
      }
    }

    const sorted = [...ranges].sort((a, b) =>
      a.start.localeCompare(b.start)
    );

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].start < sorted[i - 1].end) {
        return res.status(400).json({
          success: false,
          message: 'Schedule ranges cannot overlap',
        });
      }
    }

    const [doctors] = await connection.query(
      'SELECT id FROM doctors WHERE id = ?',
      [doctorId]
    );

    if (!doctors.length) {
      return res.status(404).json({
        success: false, message: 'Doctor not found',
      });
    }

    await connection.beginTransaction();

    await connection.query(
      'DELETE FROM doctor_schedules WHERE doctor_id = ? AND day_of_week = ?',
      [doctorId, day_of_week]
    );

    if (is_available) {
      for (const range of sorted) {
        await connection.query(
          `INSERT INTO doctor_schedules
            (doctor_id, day_of_week, start_time, end_time, is_available)
           VALUES (?, ?, ?, ?, 1)`,
          [doctorId, day_of_week, `${range.start}:00`, `${range.end}:00`]
        );
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Schedule saved successfully',
    });
  } catch (error) {
    await connection.rollback();
    console.error('Save schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save schedule',
    });
  } finally {
    connection.release();
  }
};

module.exports = { getSchedules, saveDaySchedule };
