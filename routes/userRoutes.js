const express = require('express');
const userController = require('../controllers/userController');
const expenseController = require('../controllers/expenseController');
const isAuthenticated = require('../middleware/authMiddleware');
const User = require('../models/User');
const mongoose = require('mongoose'); // Add this at the top

const router = express.Router();

router.post('/login', userController.login);
router.post('/signup', userController.signup);
router.post('/logout', userController.logout);
// router.post('/password/forgotpassword', userController.forgotPassword);

router.get('/user/login', userController.getLoginForm);
router.get('/user/signup', userController.getSignupForm);
router.get('/password/reset', userController.getResetPassword);
router.get('/user/premium', userController.getPremiumActions);
router.get('/download', expenseController.getDownloadReport);

router.get('/check-premium', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ loggedIn: false });
        }

        const userId = new mongoose.Types.ObjectId(req.session.userId); // ✅ Convert to ObjectId
        const user = await User.findById(userId);

        res.json({ loggedIn: true, isPremiumUser: user ? user.isPremiumUser : false });
    } catch (error) {
        console.error('Error checking premium status:', error);
        res.status(500).json({ message: 'Error checking premium status' });
    }
});

router.get('/password/reset-password/:id', userController.getResetPasswordFromLink);
router.post('/password/resetpassword/:id', userController.resetPassword);

module.exports = router;
