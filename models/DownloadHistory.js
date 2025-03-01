const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

const DownloadHistory = sequelize.define('DownloadHistory', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        allowNull: false,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    fileURL: {
        type: DataTypes.STRING,
        allowNull: false
    },
    downloadedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
});

// Set up the association
User.hasMany(DownloadHistory, { foreignKey: 'user_id' });
DownloadHistory.belongsTo(User, { foreignKey: 'user_id' });

module.exports = DownloadHistory;
