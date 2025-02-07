const bcrypt = require('bcrypt');
const userModel = require('../models/userModel');
const path = require('path');
const rootDir = require('../util/path');

const saltRounds = 10;

// Serve Login Page
exports.getLoginForm = (req, res) => {
  res.sendFile(path.join(rootDir, 'views', 'login.html'));
};

// User Login
exports.login = (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
      console.log("Missing fields:", { email, password });
      return res.status(400).json({ error: 'All fields are required' });
  }

  userModel.findUserByEmail(email, (err, results) => {
      if (err) {
          console.log('Database error:', err);
          return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
          return res.status(401).json({ error: 'User not found' });
      }

      const user = results[0];

      bcrypt.compare(password, user.password, (err, isMatch) => {
          if (err) {
              console.log("Error comparing passwords:", err);
              return res.status(500).json({ error: 'Error logging in' });
          }

          if (!isMatch) {
              return res.status(401).json({ error: 'Invalid password' });
          }

          console.log('success:', user);
          res.status(200).json({ message: 'Login successful' });
      });
  });
};

// Serve Signup Page
exports.getSignupForm = (req, res) => {
  res.sendFile(path.join(rootDir, 'views', 'signup.html'));
};

// User Signup
exports.signup = (req, res) => {
  const { name, email, password } = req.body;

  userModel.findUserByEmail(email, (err, results) => {
    if (err) {
      console.log('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length > 0) {
      console.log('User already exists');
      return res.status(400).json({ error: 'User already exists' });
    }

    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.log('Error encypting password:', err);
        return res.status(500).json({ error: 'Error hashing password' });
      }

      userModel.createUser(name, email, hashedPassword, (err, results) => {
        if (err) {
          console.log('Error creating user:', err);
          return res.status(500).json({ error: 'Error creating user' });
        }

        console.log('User created successfully:', results);
        res.status(200).json({ message: 'User signed up successfully' });
      });
    });
  });
};
