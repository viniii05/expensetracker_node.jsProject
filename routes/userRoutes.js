const express = require('express');
const userController = require('../controllers/userController');
const isAuthenticated = require('../middleware/authMiddleware');
const User = require('../models/User');

const router = express.Router();

router.post('/login', userController.login);
router.post('/signup', userController.signup);

router.post('/logout', userController.logout); 
router.post('/password/forgotpassword', userController.forgotPassword);

router.get('/user/login', userController.getLoginForm);

router.get('/user/signup' , userController.getSignupForm);

router.get('/password/reset', userController.getResetPassword);

router.get('/check-premium', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.json({ loggedIn: false });
        }

        const user = await User.findByPk(req.session.userId);

        res.json({ loggedIn: true, isPremiumUser: user.isPremiumUser });
    } catch (error) {
        console.error('Error checking premium status:', error);
        res.status(500).json({ message: 'Error checking premium status' });
    }
});

router.get('/password/reset-password/:id', userController.getResetPassword );

router.post('/password/resetpassword/:id', userController.resetPassword);

router.get('/user/premium' , userController.getPremiumActions);


module.exports = router;
