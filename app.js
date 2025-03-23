// const https = require('https');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const fs = require('fs');
const path = require('path');
const morgan = require('morgan');
const mongoose = require('mongoose');

require('dotenv').config();

const mongoConnect = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const paymentRoutes = require('./routes/payment');
const leaderboardRoutes = require('./routes/leaderboardRoutes');

const app = express();

const sessionStore = new MySQLStore({
  host: 'localhost',
  user: 'root',
  password: 'vini0520',
  database: 'expense-tracker-nodejs',
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000 // 1-day session expiration
});

// const privateKey = fs.readFileSync('server.key');
// const certificate = fs.readFileSync('server.cert');
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
app.use(morgan('combined' , {stream : accessLogStream}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.use(express.static(path.join(__dirname, 'views')));

app.use(session({
    key: 'user_sid',
    secret: 'your_secret_key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000,
        httpOnly: true
    }
}));

app.use(userRoutes);
app.use('/payment', paymentRoutes);
app.use('/expense', expenseRoutes);
app.use(leaderboardRoutes);


app.get('/check-session', (req, res) => {
    if (req.session.userId) {
        res.json({ loggedIn: true, user: req.session.userName });
    } else {
        res.json({ loggedIn: false });
    }
});

app.get('/', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/user/login');
  }
  res.sendFile(path.join(__dirname, 'views', 'expense.html'));
});

mongoConnect().then(() => {
  app.listen(process.env.PORT || 3000, () => console.log('Server running on port 3000'));
}).catch(err => console.error('Database connection error:', err));
