// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Expense = require('./Expense');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  totalExpenses: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
  },
  isPremiumUser: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: false
});

User.hasMany(Expense, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Expense.belongsTo(User, { foreignKey: 'user_id' });

module.exports = User;