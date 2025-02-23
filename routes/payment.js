const express = require('express');

const router = express.Router();
const {createorder, getPaymentStatus} = require('../services/cashFreeService.js');
const paymentController = require('../controllers/paymentController.js');

router.post('/pay', paymentController.pay);

    router.post('/create-order', paymentController.createOrder);


    router.post('/update-status', paymentController.updateStatus);

router.get("/verify-payment", paymentController.verifyPayment);

router.get('/payment-status/:orderId', paymentController.paymentStatus);

router.post('/payment-webhook', paymentController.paymentWebhook);


// routes/payment.js
router.post("/payment-success", async (req, res) => {
    try {
        const { userId, orderId } = req.body;

        // Mark the user as a premium member
        await User.update({ isPremiumUser: true }, { where: { id: userId } });

        res.json({ success: true, message: "User upgraded to premium." });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

module.exports = router;