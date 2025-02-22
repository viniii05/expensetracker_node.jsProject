const User = require('../models/User');

exports.updatePremiumStatus = async (req, res) => {
    try {
        const userId = req.user.id;

        await User.update({ isPremiumUser: true }, { where: { id: userId } });

        res.json({ success: true, message: 'You are a premium user now' });
    } catch (error) {
        console.error('Error updating premium status:', error);
        res.status(500).json({ message: 'Failed to update premium status' });
    }
};
