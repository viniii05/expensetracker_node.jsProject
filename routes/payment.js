const express = require('express');
const https = require('https');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User'); // Ensure User model exists
require('dotenv').config(); // Load environment variables
const path = require('path');
const {createorder, getPaymentStatus} = require('../services/cashFreeService.js');

router.post('/pay', async (req, res) => {
    try {
        const orderId = `order_${Date.now()}`;
        const orderAmount = 100; // Example amount (change as needed)
        const customerId = "customer_123"; // Replace with actual user ID
        const customerPhone = "9999999999"; // Replace with actual phone number

        const paymentSessionId = await createorder(orderId, orderAmount, "INR", customerId, customerPhone);

        if (!paymentSessionId) {
            return res.status(500).json({ error: "Failed to create payment session" });
        }

        res.json({ paymentSessionId });
    } catch (error) {
        console.error("Payment initiation error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }});

    router.post('/create-order', async (req, res) => {
        try {
            const { userId } = req.body;
            if (!userId) return res.status(400).json({ error: "User ID is required" });
    
            console.log("Creating order with userId:", userId);
    
            const order = await Order.create({
                userId,
                orderId: `ORDER_${Date.now()}`,
                amount: 100,
                status: 'PENDING'
            });
    
            console.log("Order Created:", order.toJSON());
    
            res.json({ success: true, order });
    
        } catch (error) {
            console.error("Error while creating order:", error);
            res.status(500).json({ error: "Failed to create order" });
        }
    });


router.post('/update-status', async (req, res) => {
    const { orderId, status } = req.body;

    try {
        const order = await Order.findOne({ where: { orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.status = status;
        await order.save();

        if (status === 'SUCCESSFUL') {
            const user = await User.findByPk(order.userId);
            if (user) {
                user.isPremiumUserUser = true;
                await user.save();
            }
        }

        res.json({ message: 'Order status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

router.get("/verify-payment", async (req, res) => {
    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({ message: "Order ID is required" });
        }

        const paymentStatus = await getPaymentStatus(orderId);
        
        if (paymentStatus === "Success") {
            await Order.update({ status: "SUCCESSFUL" }, { where: { orderId } });

            const order = await Order.findOne({ where: { orderId } });
            if (order) {
                await User.update({ isPremiumUser: true }, { where: { id: order.userId } });
            }

            return res.json({ message: "Payment successful", status: "SUCCESS" });
        } else {
            return res.json({ message: "Payment failed", status: paymentStatus });
        }

    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
});

router.get("/payment-status/:orderId", async (req, res) => {
    try {
        const orderId = req.params.orderId;
        console.log("Checking payment status for:", orderId);
        
        // Fetch order details from DB
        const order = await Order.findOne({ where: { orderId } });

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ status: order.status });
    } catch (error) {
        console.error("Error fetching payment status:", error);
        res.status(500).json({ message: "Server error" });
    }
});


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
