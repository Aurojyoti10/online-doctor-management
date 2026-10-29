
const pool = require('../config/database');

async function getDoctorId(userId) {
  const [rows] = await pool.query(
    'SELECT id FROM doctors WHERE user_id = ?',
    [userId]
  );
  return rows.length ? rows[0].id : null;
}

function fail(res, status, message) {
  return res.status(status).json({ success: false, message });
}

async function dashboard(req, res) {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return fail(res, 404, 'Doctor profile not found');

    const [stats] = await pool.query(`
      SELECT
        COUNT(DISTINCT CASE
          WHEN a.appointment_date = CURDATE()
          THEN a.id END) AS today_appointments,
        SUM(CASE WHEN a.status = 'scheduled'
          THEN 1 ELSE 0 END) AS scheduled_appointments,
        SUM(CASE WHEN a.status = 'confirmed'
          THEN 1 ELSE 0 END) AS confirmed_appointments,
        SUM(CASE WHEN a.status = 'completed'
          THEN 1 ELSE 0 END) AS completed_appointments,
        COUNT(DISTINCT CASE
          WHEN a.id IS NOT NULL THEN a.patient_id END) AS total_patients
      FROM appointments a
      WHERE a.doctor_id = ?
    `, [doctorId]);

    const [today] = await pool.query(`
  SELECT a.id, a.patient_id, u.name AS patient_name,
         DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
         a.start_time, a.end_time, a.status, a.reason
  FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN users u ON u.id = p.user_id
      WHERE a.doctor_id = ? AND a.appointment_date = CURDATE()
      ORDER BY a.start_time
    `, [doctorId]);

    const [earnings] = await pool.query(`
  SELECT COALESCE(SUM(
    CASE
      WHEN pay.status = 'completed'
      THEN pay.amount - COALESCE(pay.refund_amount, 0)
      ELSE 0
    END
  ), 0) AS today_earnings
  FROM payments pay
  JOIN appointments a ON a.id = pay.appointment_id
  WHERE a.doctor_id = ?
    AND pay.status = 'completed'
    AND DATE(pay.created_at) = CURDATE()
`, [doctorId]);

    const [weekly] = await pool.query(`
  SELECT DATE(pay.created_at) AS day,
         COALESCE(SUM(
           CASE
             WHEN pay.status = 'completed'
             THEN pay.amount - COALESCE(pay.refund_amount, 0)
             ELSE 0
           END
         ), 0) AS revenue
  FROM payments pay
  JOIN appointments a ON a.id = pay.appointment_id
  WHERE a.doctor_id = ?
    AND pay.status = 'completed'
    AND pay.created_at >= CURDATE() - INTERVAL 6 DAY
  GROUP BY DATE(pay.created_at)
  ORDER BY day
`, [doctorId]);

    res.json({
      success: true,
      data: {
        stats: {
          ...stats[0],
          today_earnings: Number(earnings[0].today_earnings || 0)
        },
        today,
        weekly_revenue: weekly
      }
    });
  } catch (e) {
    console.error('Doctor dashboard:', e);
    fail(res, 500, 'Failed to load doctor dashboard');
  }
}

async function appointments(req, res) {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return fail(res, 404, 'Doctor profile not found');

    const [rows] = await pool.query(`
      SELECT a.id, a.patient_id, p.date_of_birth, p.gender,
             u.name AS patient_name, u.email AS patient_email,
             a.doctor_id,
DATE_FORMAT(a.appointment_date, '%Y-%m-%d') AS appointment_date,
a.start_time, a.end_time, a.status, a.reason,
             d.consultation_fee AS fee
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN users u ON u.id = p.user_id
      JOIN doctors d ON d.id = a.doctor_id
      WHERE a.doctor_id = ?
      ORDER BY a.appointment_date DESC, a.start_time DESC
    `, [doctorId]);

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('Doctor appointments:', e);
    fail(res, 500, 'Failed to load appointments');
  }
}


async function updateAppointmentStatus(req, res) {
  const allowed = ['confirmed', 'cancelled', 'completed', 'no_show'];
  const status = req.body.status;

  if (!allowed.includes(status)) {
    return fail(res, 400, 'Invalid appointment status');
  }

  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) {
      return fail(res, 404, 'Doctor profile not found');
    }

    // Verify the appointment belongs to this doctor.
    const [appointments] = await pool.query(
      `SELECT id, appointment_date, end_time
       FROM appointments
       WHERE id = ?
         AND doctor_id = ?
         AND status IN ('scheduled', 'confirmed')`,
      [req.params.id, doctorId]
    );

    if (!appointments.length) {
      return fail(
        res,
        404,
        'Appointment not found, already completed, or not assigned to you'
      );
    }

    // An appointment cannot be completed before its scheduled end time.
    if (status === 'completed') {
      const [timeCheck] = await pool.query(
        `SELECT (
           TIMESTAMP(appointment_date, end_time) <= NOW()
         ) AS can_complete
         FROM appointments
         WHERE id = ? AND doctor_id = ?`,
        [req.params.id, doctorId]
      );

      if (!timeCheck.length || !timeCheck[0].can_complete) {
        return fail(
          res,
          400,
          'This appointment cannot be completed before its scheduled end time'
        );
      }
    }

    const [result] = await pool.query(
      `UPDATE appointments
       SET status = ?
       WHERE id = ?
         AND doctor_id = ?
         AND status IN ('scheduled', 'confirmed')`,
      [status, req.params.id, doctorId]
    );

    if (!result.affectedRows) {
      return fail(res, 409, 'Appointment status has already changed');
    }

    res.json({
      success: true,
      message: 'Appointment status updated'
    });
  } catch (e) {
    console.error('Update doctor appointment:', e);
    fail(res, 500, 'Failed to update appointment');
  }
}

async function patients(req, res) {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return fail(res, 404, 'Doctor profile not found');

    const [rows] = await pool.query(`
      SELECT p.id, p.user_id, u.name, u.email, p.date_of_birth,
             p.gender, p.phone, p.address,
             COUNT(a.id) AS appointments_count,
             MAX(a.appointment_date) AS last_appointment
      FROM appointments a
      JOIN patients p ON p.id = a.patient_id
      JOIN users u ON u.id = p.user_id
      WHERE a.doctor_id = ?
      GROUP BY p.id, p.user_id, u.name, u.email,
               p.date_of_birth, p.gender, p.phone, p.address
      ORDER BY last_appointment DESC
    `, [doctorId]);

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('Doctor patients:', e);
    fail(res, 500, 'Failed to load patients');
  }
}

async function patientDetail(req, res) {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return fail(res, 404, 'Doctor profile not found');

    const [rows] = await pool.query(`
      SELECT DISTINCT p.id, p.user_id, u.name, u.email,
             p.date_of_birth, p.gender, p.phone, p.address
      FROM patients p
      JOIN users u ON u.id = p.user_id
      JOIN appointments a ON a.patient_id = p.id
      WHERE p.id = ? AND a.doctor_id = ?
    `, [req.params.id, doctorId]);

    if (!rows.length) return fail(res, 404, 'Patient not found');

    const [history] = await pool.query(`
      SELECT id, appointment_date, start_time, end_time,
             status, reason
      FROM appointments
      WHERE patient_id = ? AND doctor_id = ?
      ORDER BY appointment_date DESC, start_time DESC
    `, [req.params.id, doctorId]);

    res.json({ success: true, data: { ...rows[0], appointments: history } });
  } catch (e) {
    console.error('Doctor patient detail:', e);
    fail(res, 500, 'Failed to load patient');
  }
}

async function getSchedule(req, res) {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return fail(res, 404, 'Doctor profile not found');

    const [rows] = await pool.query(`
      SELECT id, day_of_week, start_time, end_time, is_available
      FROM doctor_schedules
      WHERE doctor_id = ?
      ORDER BY FIELD(day_of_week, 'monday','tuesday','wednesday',
        'thursday','friday','saturday','sunday'), start_time
    `, [doctorId]);

    res.json({ success: true, data: rows });
  } catch (e) {
    console.error('Doctor schedule:', e);
    fail(res, 500, 'Failed to load availability');
  }
}

async function saveSchedule(req, res) {
  try {
    const doctorId = await getDoctorId(req.user.id);

    if (!doctorId) {
      return fail(res, 404, 'Doctor profile not found.');
    }

    const schedule = req.body.schedule;

    if (!Array.isArray(schedule)) {
      return fail(res, 400, 'Schedule must be an array.');
    }

    const validDays = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
    const dayCounts = {};
    const validatedSchedule = [];

    // Validate every submitted time range.
    for (const item of schedule) {
      const day = String(item.day_of_week || '').toLowerCase();
      const startTime = String(item.start_time || '');
      const endTime = String(item.end_time || '');

      if (!validDays.includes(day)) {
        return fail(res, 400, `Invalid day: ${day}`);
      }

      if (
        !timePattern.test(startTime) ||
        !timePattern.test(endTime)
      ) {
        return fail(
          res,
          400,
          `Invalid time format for ${day}. Use HH:mm.`
        );
      }

      // Normalize times to HH:mm:ss for consistent comparison/storage.
      const normalizedStart = startTime.length === 5
        ? `${startTime}:00`
        : startTime;

      const normalizedEnd = endTime.length === 5
        ? `${endTime}:00`
        : endTime;

      if (normalizedStart >= normalizedEnd) {
        return fail(
          res,
          400,
          `End time must be later than start time on ${day}.`
        );
      }

      dayCounts[day] = (dayCounts[day] || 0) + 1;

      if (dayCounts[day] > 2) {
        return fail(
          res,
          400,
          `Only two available time ranges are allowed on ${day}.`
        );
      }

      validatedSchedule.push({
        day_of_week: day,
        start_time: normalizedStart,
        end_time: normalizedEnd,
        is_available: true,
      });
    }

    // Reject overlapping ranges on the same day.
    for (const day of validDays) {
      const ranges = validatedSchedule
        .filter((item) => item.day_of_week === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      for (let i = 1; i < ranges.length; i++) {
        if (ranges[i].start_time < ranges[i - 1].end_time) {
          return fail(
            res,
            400,
            `The two time ranges overlap on ${day}.`
          );
        }
      }
    }

    // Replace the schedule only after all submitted ranges are valid.
    await pool.query(
      'DELETE FROM doctor_schedules WHERE doctor_id = ?',
      [doctorId]
    );

    for (const item of validatedSchedule) {
      await pool.query(
        `INSERT INTO doctor_schedules
          (doctor_id, day_of_week, start_time, end_time, is_available)
         VALUES (?, ?, ?, ?, ?)`,
        [
          doctorId,
          item.day_of_week,
          item.start_time,
          item.end_time,
          true,
        ]
      );
    }

    return res.json({
      success: true,
      message: 'Availability saved successfully.',
      data: validatedSchedule,
    });
  } catch (error) {
    console.error('saveSchedule error:', error);
    return fail(res, 500, 'Unable to save availability.');
  }
}

async function getProfile(req, res) {
  try {
    const [rows] = await pool.query(`
      SELECT d.id, d.user_id, u.name, u.email,
             d.specialization, d.qualification, d.experience_years,
             d.consultation_fee, d.city, d.hospital, d.about, d.languages
      FROM doctors d JOIN users u ON u.id = d.user_id
      WHERE d.user_id = ?
    `, [req.user.id]);

    if (!rows.length) return fail(res, 404, 'Doctor profile not found');
    res.json({ success: true, data: rows[0] });
  } catch (e) {
    console.error('Doctor profile:', e);
    fail(res, 500, 'Failed to load profile');
  }
}

async function updateProfile(req, res) {
  const {
    name, specialization, qualification, experience_years,
    consultation_fee, city, hospital, about, languages
  } = req.body;

  if (!name?.trim() || !specialization?.trim()) {
    return fail(res, 400, 'Name and specialization are required');
  }

  const experience = Number(experience_years ?? 0);
  const fee = Number(consultation_fee ?? 0);

  if (!Number.isInteger(experience) || experience < 0 ||
      !Number.isFinite(fee) || fee < 0) {
    return fail(res, 400, 'Invalid experience or consultation fee');
  }

  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [doctors] = await connection.query(
      'SELECT id FROM doctors WHERE user_id = ?',
      [req.user.id]
    );
    if (!doctors.length) {
      await connection.rollback();
      return fail(res, 404, 'Doctor profile not found');
    }

    await connection.query(
      'UPDATE users SET name = ? WHERE id = ?',
      [name.trim(), req.user.id]
    );

    await connection.query(`
      UPDATE doctors
      SET specialization = ?, qualification = ?, experience_years = ?,
          consultation_fee = ?, city = ?, hospital = ?, about = ?, languages = ?
      WHERE user_id = ?
    `, [
      specialization.trim(), qualification || null, experience, fee,
      city || null, hospital || null, about || null, languages || null,
      req.user.id
    ]);

    await connection.commit();
    res.json({ success: true, message: 'Profile updated' });
  } catch (e) {
    if (connection) await connection.rollback().catch(() => {});
    console.error('Update doctor profile:', e);
    fail(res, 500, 'Failed to update profile');
  } finally {
    if (connection) connection.release();
  }
}

async function earnings(req, res) {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return fail(res, 404, 'Doctor profile not found');

    
const [summary] = await pool.query(`
  SELECT
    COALESCE(SUM(
      CASE
        WHEN pay.status = 'completed'
        THEN pay.amount - COALESCE(pay.refund_amount, 0)
        ELSE 0
      END
    ), 0) AS total_revenue,
    COUNT(CASE
      WHEN pay.status = 'completed' THEN 1
    END) AS completed_payments,
    COUNT(CASE
      WHEN pay.status = 'pending' THEN 1
    END) AS pending_payments
  FROM payments pay
  JOIN appointments a ON a.id = pay.appointment_id
  WHERE a.doctor_id = ?
`, [doctorId]);


    
const [rows] = await pool.query(`
  SELECT pay.id, pay.appointment_id, pay.amount,
         pay.payment_method, pay.status, pay.created_at,
         pay.refund_status, pay.refund_amount,
         pay.refund_reference, pay.refunded_at,
         puser.name AS patient_name,
         a.appointment_date
  FROM payments pay
  JOIN appointments a ON a.id = pay.appointment_id
  JOIN patients p ON p.id = a.patient_id
  JOIN users puser ON puser.id = p.user_id
  WHERE a.doctor_id = ?
  ORDER BY pay.created_at DESC
`, [doctorId]);


    res.json({
      success: true,
      data: {
        summary: {
          total_revenue: Number(summary[0].total_revenue || 0),
          completed_payments: Number(summary[0].completed_payments || 0),
          pending_payments: Number(summary[0].pending_payments || 0)
        },
        payments: rows
      }
    });
  } catch (e) {
    console.error('Doctor earnings:', e);
    fail(res, 500, 'Failed to load earnings');
  }
}

module.exports = {
  dashboard, appointments, updateAppointmentStatus,
  patients, patientDetail, getSchedule, saveSchedule,
  getProfile, updateProfile, earnings
};
