const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const path = require('path');

require('dotenv').config();

exports.getLoginForm = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
};

exports.getSignupForm = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/signup.html'));
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({ message: 'User created successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) return res.status(401).json({ error: 'Invalid email or password' });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

      req.session.userId = user.id;
      req.session.userName = user.name;

      res.status(200).json({ redirect: '/' });
  } catch (error) {
      res.status(500).json({ error: 'Login failed' });
  }
};

exports.logout = (req, res) => {
  req.session.destroy(err => {
      if (err) {
          return res.status(500).json({ error: 'Logout failed' });
      }
      res.status(200).json({ redirect: '/login' }); // ✅ Send redirect URL
  });
};


