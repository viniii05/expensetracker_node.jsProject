const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User'); // Ensure User model exists
require('dotenv').config(); // Load environment variables
const path = require('path');
const { createorder, getPaymentStatus } = require('../services/cashFreeService.js');

exports.pay = async (req, res) => {
    try {
        console.log("🚀 /payment/pay API hit");

        if (!req.session.userId) {
            return res.status(401).json({ error: "User not logged in" });
        }

        const orderId = `order_${Date.now()}`;
        const orderAmount = 100;
        const customerId = `customer_${req.session.userId}`;
        const customerPhone = "9999999999"; // ⚠️ You don’t have a phone field, so hardcoding

        console.log("🛒 Creating order with:", { orderId, orderAmount, customerId, customerPhone });

        // ✅ **Store order in the database before making payment request**
        const order = await Order.create({
            userId: req.session.userId,
            orderId,
            amount: orderAmount,
            status: "PENDING",
        });

        console.log("✅ Order Created in DB:", order.toJSON());

        // ✅ **Call Cashfree API after storing order**
        const paymentSessionId = await createorder(orderId, orderAmount, "INR", customerId, customerPhone);

        if (!paymentSessionId) {
            console.error("❌ Failed to create payment session");
            return res.status(500).json({ error: "Failed to create payment session" });
        }

        console.log("✅ Payment Session ID:", paymentSessionId);

        res.json({ paymentSessionId });
    } catch (error) {
        console.error("🚨 Payment initiation error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};



exports.createOrder = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            console.log("❌ No userId provided!");
            return res.status(400).json({ error: "User ID is required" });
        }

        console.log("✅ Creating order for user:", userId);

        const order = await Order.create({
            userId,
            orderId: `ORDER_${Date.now()}`,
            amount: 100,
            status: "PENDING",
        });
        this.updateStatus()

        console.log("✅ Order Created:", order.toJSON());

        res.json({ success: true, order });
        

    } catch (error) {
        console.error("❌ Error while creating order:", error);
        res.status(500).json({ error: "Failed to create order" });
    }
};



exports.updateStatus = async (req, res) => {
    const { orderId, status } = req.body;

    try {
        console.log("🔄 Updating order status:", { orderId, status });

        const order = await Order.findOne({ where: { orderId } });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        order.status = status;
        await order.save();

        if (status === 'SUCCESSFUL') {
            const user = await User.findByPk(order.userId);
            if (user) {
                user.isPremiumUser = true; // ✅ **Fixed typo from `isPremiumUserUser`**
                await user.save();
            }
        }

        console.log("✅ Order status updated:", order.toJSON());
        res.json({ message: 'Order status updated' });

    } catch (error) {
        console.error("❌ Error updating order status:", error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        const { orderId } = req.query;

        if (!orderId) {
            return res.status(400).json({ message: "Order ID is required" });
        }

        console.log("🔎 Verifying payment for order:", orderId);

        const paymentStatus = await getPaymentStatus(orderId);
        console.log("💳 Payment status from Cashfree:", paymentStatus);

        if (paymentStatus === "Success") {
            console.log("✅ Payment was successful, updating order in DB...");

            const order = await Order.findOne({ where: { orderId } });
            if (order) {
                await order.update({ status: "SUCCESSFUL" });
                await User.update({ isPremiumUser: true }, { where: { id: order.userId } });

                req.session.isPremiumUser = true;
                req.session.save();

                console.log("✅ Payment verified, user upgraded to premium!");
            }

            return res.json({ message: "Payment successful", status: "SUCCESS" });
        } else {
            console.log("❌ Payment failed:", paymentStatus);
            return res.json({ message: "Payment failed", status: paymentStatus });
        }

    } catch (error) {
        console.error("❌ Error verifying payment:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



exports.paymentStatus = async (req, res) => {
    const { orderId } = req.params;
    
    // Call verify payment
    const response = await fetch(`/payment/verify-payment?orderId=${orderId}`);
    const data = await response.json();

    if (data.status === "SUCCESS") {
        res.send(`<h2>Payment Successful!</h2><a href="/">Go to Home</a>`);
    } else {
        res.send(`<h2>Payment Failed or Pending</h2><a href="/">Go to Home</a>`);
    }
};


exports.paymentWebhook = async (req, res) => {
    try {
        console.log("📩 Webhook received:", req.body);  // LOG FULL REQUEST DATA

        const { orderId, txStatus } = req.body;

        if (!orderId || !txStatus) {
            console.log("❌ Invalid Webhook Data:", req.body);
            return res.status(400).json({ message: "Invalid request" });
        }

        console.log(`🔍 Looking for order ${orderId} in DB...`);

        // Find the order in the database
        const order = await Order.findOne({ where: { orderId } });

        if (!order) {
            console.log(`❌ Order ${orderId} not found in DB.`);
            return res.status(404).json({ message: "Order not found" });
        }

        // Update the order status
        const newStatus = txStatus === "SUCCESS" ? "SUCCESSFUL" : "FAILED";
        await order.update({ status: newStatus });

        console.log(`✅ Order ${orderId} updated to ${newStatus}`);

        res.status(200).json({ message: "Payment status updated" });
    } catch (error) {
        console.error("❌ Error handling webhook:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};



// routes/payment.js
exports.paymentSuccess = async (req, res) => {
    try {
        const { userId, orderId } = req.body;

        // Mark the user as a premium member
        await User.update({ isPremiumUser: true }, { where: { id: userId } });

        res.json({ success: true, message: "User upgraded to premium." });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};