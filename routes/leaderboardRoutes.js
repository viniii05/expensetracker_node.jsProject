const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { Sequelize } = require('sequelize');

router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['name', [Sequelize.fn('COALESCE', Sequelize.col('totalExpenses'), 0), 'totalExpenses']], // Replace NULL with 0
            order: [[Sequelize.literal('totalExpenses'), 'DESC']]
        });

        res.json(users);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

module.exports = router;
