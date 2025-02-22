const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    orderId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true // ✅ Prevent duplicate order IDs
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('PENDING', 'SUCCESSFUL', 'FAILED'),
        defaultValue: 'PENDING'
    }
}, { timestamps: true }); // ✅ Enable timestamps (createdAt, updatedAt)

module.exports = Order;
