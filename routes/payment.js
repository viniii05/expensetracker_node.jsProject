const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController.js');

router.post('/pay', paymentController.pay);

router.post('/create-order', paymentController.createOrder);

router.get("/verify-payment", paymentController.verifyPayment);

router.get('/payment-status/:orderId', paymentController.paymentStatus);

module.exports = router;