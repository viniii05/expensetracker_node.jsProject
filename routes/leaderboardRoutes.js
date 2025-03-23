const express = require('express');
const router = express.Router();
const User = require('../models/User');

router.get('/leaderboard', async (req, res) => {
    try {
        const users = await User.find()
            .select('name totalExpenses')
            .sort({ totalExpenses: -1 });

        res.json(users);
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

module.exports = router;
