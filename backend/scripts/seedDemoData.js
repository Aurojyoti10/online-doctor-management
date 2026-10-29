require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const TARGET = 50;
const DEMO_PASSWORD = 'DemoCare2026!';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 3,
});

const firstNames = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Arjun',
  'Meera', 'Aditya', 'Ishita', 'Rahul', 'Kavya',
  'Vikram', 'Sneha', 'Karan', 'Diya', 'Neha',
  'Amit', 'Pooja', 'Siddharth', 'Nisha', 'Varun',
];

const lastNames = [
  'Sharma', 'Patel', 'Reddy', 'Das', 'Iyer',
  'Nair', 'Mehta', 'Rao', 'Gupta', 'Mishra',
];

const specializations = [
  'General Physician', 'Cardiology', 'Dermatology',
  'Pediatrics', 'Orthopedics', 'Neurology',
  'Ophthalmology', 'ENT', 'Psychiatry', 'Dentistry',
];

const days = [
  'monday', 'tuesday', 'wednesday', 'thursday',
  'friday', 'saturday', 'sunday',
];

const reasons = [
  'Routine health consultation',
  'Follow-up consultation',
  'Persistent headache',
  'Seasonal allergy symptoms',
  'Digestive discomfort',
  'Skin irritation',
  'Joint pain assessment',
  'Blood pressure review',
  'General wellness check',
  'Sleep and fatigue concerns',
];

function fullName(i) {
  return `${firstNames[i % firstNames.length]} ${lastNames[Math.floor(i / firstNames.length) % lastNames.length]}`;
}

function demoEmail(role, i) {
  return `demo.${role}.${String(i).padStart(3, '0')}@careconnect.test`;
}

function dateOffset(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

async function count(connection, table) {
  const allowed = [
    'users', 'patients', 'doctors', 'doctor_schedules',
    'appointments', 'prescriptions', 'payments',
  ];
  if (!allowed.includes(table)) throw new Error('Unexpected table name');

  const [rows] = await connection.query(
    `SELECT COUNT(*) AS total FROM \`${table}\``
  );
  return Number(rows[0].total);
}

async function main() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

    // Reuse eligible accounts. Create accounts only when necessary.
    for (const role of ['patient', 'doctor']) {
      let profileTable = role === 'patient' ? 'patients' : 'doctors';

      while (await count(connection, profileTable) < TARGET) {
        const [available] = await connection.query(
          `SELECT u.id
           FROM users u
           LEFT JOIN ${profileTable} p ON p.user_id = u.id
           WHERE u.role = ? AND p.id IS NULL
           ORDER BY u.id
           LIMIT 1`,
          [role]
        );

        let userId;

        if (available.length) {
          userId = available[0].id;
        } else {
          let suffix = 1;
          let inserted = false;

          while (!inserted) {
            const email = demoEmail(role, suffix);
            const [existing] = await connection.query(
              'SELECT id FROM users WHERE email = ?',
              [email]
            );

            if (existing.length) {
              suffix++;
              continue;
            }

            const [result] = await connection.query(
              `INSERT INTO users (name, email, password, role)
               VALUES (?, ?, ?, ?)`,
              [fullName(suffix - 1), email, passwordHash, role]
            );

            userId = result.insertId;
            inserted = true;
          }
        }

        if (role === 'patient') {
          const index = await count(connection, 'patients');

          await connection.query(
            `INSERT INTO patients
              (user_id, date_of_birth, gender, phone, address)
             VALUES (?, ?, ?, ?, ?)`,
            [
              userId,
              `19${String(75 + index % 25).padStart(2, '0')}-${String(index % 12 + 1).padStart(2, '0')}-15`,
              ['male', 'female', 'other'][index % 3],
              `90000${String(10000 + index).slice(-5)}`,
              `Demo Address ${index + 1}, Chennai`,
            ]
          );
        } else {
          const index = await count(connection, 'doctors');

          await connection.query(
            `INSERT INTO doctors
              (user_id, specialization, qualification,
               experience_years, consultation_fee, city, hospital,
               about, languages)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              userId,
              specializations[index % specializations.length],
              'MBBS, MD',
              2 + (index % 19),
              400 + (index % 8) * 100,
              ['Chennai', 'Bengaluru', 'Hyderabad', 'Delhi'][index % 4],
              `CareConnect Demo Hospital ${index + 1}`,
              'Synthetic demonstration profile for testing.',
              'English, Hindi',
            ]
          );
        }
      }
    }

    // Add distinct doctor schedules without duplicating existing ones.
    let scheduleAttempts = 0;

    while (await count(connection, 'doctor_schedules') < TARGET) {
      const [doctors] = await connection.query(
        'SELECT id FROM doctors ORDER BY id'
      );

      const doctor = doctors[scheduleAttempts % doctors.length];
      const day = days[Math.floor(scheduleAttempts / doctors.length) % days.length];
      const hour = 8 + (Math.floor(scheduleAttempts / (doctors.length * 7)) % 8);
      const start = `${String(hour).padStart(2, '0')}:00:00`;
      const end = `${String(hour + 1).padStart(2, '0')}:00:00`;

      await connection.query(
        `INSERT IGNORE INTO doctor_schedules
          (doctor_id, day_of_week, start_time, end_time, is_available)
         VALUES (?, ?, ?, ?, 1)`,
        [doctor.id, day, start, end]
      );

      scheduleAttempts++;
      if (scheduleAttempts > 10000) {
        throw new Error('Could not create enough unique doctor schedules');
      }
    }

    // Create completed appointments in the past. This leaves existing
    // appointments unchanged and provides valid prescription candidates.
    let appointmentAttempts = 0;

    while (true) {
      const [eligible] = await connection.query(
        `SELECT COUNT(*) AS total
         FROM appointments a
         LEFT JOIN prescriptions p ON p.appointment_id = a.id
         WHERE a.status = 'completed' AND p.id IS NULL`
      );

      const appointmentCount = await count(connection, 'appointments');
      const prescriptionCount = await count(connection, 'prescriptions');

      if (
        appointmentCount >= TARGET &&
        Number(eligible[0].total) >= TARGET - prescriptionCount
      ) break;

      const [doctors] = await connection.query(
        'SELECT id FROM doctors ORDER BY id'
      );
      const [patients] = await connection.query(
        'SELECT id FROM patients ORDER BY id'
      );

      const doctor = doctors[appointmentAttempts % doctors.length];
      const patient = patients[
        Math.floor(appointmentAttempts / doctors.length) % patients.length
      ];

      const date = dateOffset(appointmentAttempts % 180 + 1);
      const hour = 8 + (Math.floor(appointmentAttempts / 180) % 8);
      const start = `${String(hour).padStart(2, '0')}:00:00`;
      const end = `${String(hour).padStart(2, '0')}:30:00`;

      await connection.query(
        `INSERT IGNORE INTO appointments
          (patient_id, doctor_id, appointment_date,
           start_time, end_time, status, reason)
         VALUES (?, ?, ?, ?, ?, 'completed', ?)`,
        [
          patient.id, doctor.id, date, start, end,
          reasons[appointmentAttempts % reasons.length],
        ]
      );

      appointmentAttempts++;
      if (appointmentAttempts > 50000) {
        throw new Error('Could not create enough valid appointments');
      }
    }

    // One prescription per completed appointment.
    const diagnoses = [
      'Seasonal allergic rhinitis',
      'Tension headache',
      'Gastritis',
      'Mild dermatitis',
      'Routine follow-up',
      'Muscle strain',
      'Upper respiratory symptoms',
      'General wellness assessment',
    ];

    while (await count(connection, 'prescriptions') < TARGET) {
      const [eligible] = await connection.query(
        `SELECT a.id
         FROM appointments a
         LEFT JOIN prescriptions p ON p.appointment_id = a.id
         WHERE a.status = 'completed' AND p.id IS NULL
         ORDER BY a.appointment_date, a.id
         LIMIT 1`
      );

      if (!eligible.length) {
        throw new Error('No eligible completed appointment for a prescription');
      }

      const index = await count(connection, 'prescriptions');

      await connection.query(
        `INSERT INTO prescriptions
          (appointment_id, diagnosis, medications, instructions)
         VALUES (?, ?, ?, ?)`,
        [
          eligible[0].id,
          diagnoses[index % diagnoses.length],
          'Demo medication record; clinician review required.',
          'Synthetic demo data only. Not a real medical prescription.',
        ]
      );
    }

    // Add payments only for appointments without an existing payment.
    // Preserve all existing payment and refund records.
    let paymentAttempts = 0;

    while (await count(connection, 'payments') < TARGET) {
      const [eligible] = await connection.query(
        `SELECT a.id, d.consultation_fee
         FROM appointments a
         JOIN doctors d ON d.id = a.doctor_id
         LEFT JOIN payments p ON p.appointment_id = a.id
         WHERE p.id IS NULL
         ORDER BY a.id
         LIMIT 1`
      );

      if (!eligible.length) {
        throw new Error('No appointment available for another demo payment');
      }

      const index = await count(connection, 'payments');
      const status = ['completed', 'completed', 'pending', 'failed'][index % 4];
      const method = ['upi', 'card', 'cash'][index % 3];

      await connection.query(
        `INSERT INTO payments
          (appointment_id, amount, payment_method, status,
           transaction_ref, refund_status, refund_amount)
         VALUES (?, ?, ?, ?, ?, 'not_required', 0)`,
        [
          eligible[0].id,
          Number(eligible[0].consultation_fee || 500),
          method,
          status,
          `DEMO-CC-${Date.now()}-${index}`,
        ]
      );

      paymentAttempts++;
      if (paymentAttempts > 10000) {
        throw new Error('Could not create enough demo payments');
      }
    }

    const tables = [
      'users', 'patients', 'doctors', 'doctor_schedules',
      'appointments', 'prescriptions', 'payments',
    ];

    const results = {};
    for (const table of tables) {
      results[table] = await count(connection, table);
    }

    await connection.commit();

    console.log('\nSeed completed. Final table counts:');
    console.table(
      Object.entries(results).map(([table, total]) => ({ table, total }))
    );
    console.log('\nDemo account password for newly created demo users:', DEMO_PASSWORD);
    console.log('Demo account emails use the pattern demo.<role>.<number>@careconnect.test');
    console.log('Existing records were preserved.');
  } catch (error) {
    await connection.rollback();
    console.error('Seed failed; changes were rolled back:', error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

main();
