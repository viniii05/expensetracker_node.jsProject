const db = require('../config/db');  

const findUserByEmail = (email, callback) => {
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
};

const createUser = (name, email, password, callback) => {
  db.query(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, password],
    (err, results) => {
      if (err) return callback(err, null);
      callback(null, results);
    }
  );
};

module.exports = { findUserByEmail, createUser };
