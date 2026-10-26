
const pool = require('../config/database');

const getDashboardStats = async (req, res) => {
  try {
    const [
      [doctorCount],
      [patientCount],
      [appointmentCount],
      [todayCount],
      [pendingCount],
      [revenue],
      [appointmentTrend],
      [statusDistribution],
      [patientGrowth],
      [specPopularity],
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS total FROM doctors'),

      pool.query('SELECT COUNT(*) AS total FROM patients'),

      pool.query('SELECT COUNT(*) AS total FROM appointments'),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM appointments
        WHERE appointment_date = CURDATE()
      `),

      pool.query(`
        SELECT COUNT(*) AS total
        FROM appointments
        WHERE status = 'scheduled'
      `),

      pool.query(`
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM payments
        WHERE status = 'completed'
      `),

      pool.query(`
        SELECT DATE_FORMAT(appointment_date, '%b %e') AS date,
               COUNT(*) AS appointments
        FROM appointments
        WHERE appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
          AND appointment_date <= CURDATE()
        GROUP BY appointment_date
        ORDER BY appointment_date
      `),

      pool.query(`
        SELECT status AS name, COUNT(*) AS value
        FROM appointments
        GROUP BY status
      `),

      pool.query(`
        SELECT DATE_FORMAT(created_at, '%b') AS month,
               COUNT(*) AS patients
        FROM patients
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at), DATE_FORMAT(created_at, '%b')
        ORDER BY YEAR(created_at), MONTH(created_at)
      `),

      pool.query(`
        SELECT specialization AS name, COUNT(*) AS count
        FROM doctors
        GROUP BY specialization
        ORDER BY count DESC
        LIMIT 6
      `),
    ]);

    const statusColors = {
      scheduled: '#f59e0b',
      confirmed: '#22c55e',
      completed: '#2563eb',
      cancelled: '#ef4444',
      no_show: '#64748b',
    };

    res.status(200).json({
      success: true,
      data: {
        totals: {
          doctors: Number(doctorCount[0].total),
          patients: Number(patientCount[0].total),
          appointments: Number(appointmentCount[0].total),
          todayAppointments: Number(todayCount[0].total),
          pendingRequests: Number(pendingCount[0].total),
          revenue: Number(revenue[0].total),
        },
        appointmentTrend: appointmentTrend.map((row) => ({
          date: row.date,
          appointments: Number(row.appointments),
        })),
        statusDistribution: statusDistribution.map((row) => ({
          name: row.name,
          value: Number(row.value),
          color: statusColors[row.name] || '#94a3b8',
        })),
        patientGrowth: patientGrowth.map((row) => ({
          month: row.month,
          patients: Number(row.patients),
        })),
        specPopularity: specPopularity.map((row) => ({
          name: row.name,
          count: Number(row.count),
        })),
      },
    });
  } catch (error) {
    console.error('Admin dashboard error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to load dashboard statistics',
    });
  }
};

module.exports = { getDashboardStats };
