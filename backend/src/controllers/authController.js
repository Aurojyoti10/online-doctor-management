const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and password are required'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters'
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Enter a valid email address'
    });
  }

  let connection;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (existing.length) {
      await connection.rollback();
      return res.status(409).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashedPassword, 'patient']
    );

    await connection.query(
      'INSERT INTO patients (user_id) VALUES (?)',
      [result.insertId]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      data: {
        id: result.insertId,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: 'patient'
      }
    });
  } catch (error) {
    if (connection) await connection.rollback();

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered'
      });
    }

    console.error('Registration error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  } finally {
    if (connection) connection.release();
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if (!users.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = users[0];
    const isBcryptHash = /^\$2[aby]\$/.test(user.password);

    const passwordMatches = isBcryptHash
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Upgrade a legacy plaintext password after successful login.
    if (!isBcryptHash) {
      const hashedPassword = await bcrypt.hash(password, 12);
      await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing from environment configuration');
      return res.status(500).json({
        success: false,
        message: 'Authentication is not configured'
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

module.exports = { register, login };