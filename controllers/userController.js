const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const path = require('path');

const Sib = require('sib-api-v3-sdk');
require('dotenv').config();


require('dotenv').config();

exports.getLoginForm = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/login.html'));
};

exports.getSignupForm = (req, res) => {
  res.sendFile(path.join(__dirname, '../views/signup.html'));
};
exports.getResetPassword = (req,res) => {
  res.sendFile(path.join(__dirname , '../views/resetPassword.html' ));
}
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

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

    req.session.userId = user.id;
    req.session.userName = user.name;
    console.log("User logged in, session userId:", req.session.userId);


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

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const client = Sib.ApiClient.instance;
    client.authentications['api-key'].apiKey = process.env.SENDINBLUE_API_KEY;

    const tranEmailApi = new Sib.TransactionalEmailsApi();

    const sender = { email: 'vinivt.0520@gmail.com' };
    const receivers = [{ email: user.email }];

    await tranEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: 'Reset Your Password',
      textContent: `Click on the link to reset your password: http://localhost:3000/reset-password/${user.id}`
    });

    res.status(200).json({ message: "Password reset email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Failed to send password reset email" });
  }
};
