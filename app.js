const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');

const sequelize = require('./config/database');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');

const app = express();

// Session Store in MySQL
const sessionStore = new MySQLStore({
  host: 'localhost',
  user: 'root',
  password: 'vini0520',
  database: 'expense-tracker-nodejs',
  clearExpired: true,
  checkExpirationInterval: 900000, // 15 minutes
    expiration: 86400000 // 1-day session expiration
});

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'views')));

app.use(session({
    key: 'user_sid',
    secret: 'your_secret_key',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 86400000, // 1 day
        httpOnly: true
    }
}));

app.use(userRoutes);
app.use('/expense', expenseRoutes);

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

sequelize.sync()
  .then(() => {
    app.listen(3000, () => console.log('Server running on port 3000'));
    console.log('Database connected successfully');
  })
  .catch(err => console.error('Database connection error:', err));


