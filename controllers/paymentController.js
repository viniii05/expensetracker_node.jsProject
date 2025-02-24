const express = require('express');
const Order = require('../models/Order');
const User = require('../models/User'); 
require('dotenv').config();
const path = require('path');
const { createorder, getPaymentStatus } = require('../services/cashfreeService.js');

exports.pay = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "User not logged in" });
        }

        const orderId = `order_${Date.now()}`;
        const orderAmount = 100;
        const customerId = `customer_${req.session.userId}`;
        const customerPhone = "9999999999"; 

        const order = await Order.create({
            userId: req.session.userId,
            orderId,
            amount: orderAmount,
            status: "PENDING",
        });

        const paymentSessionId = await createorder(orderId, orderAmount, "INR", customerId, customerPhone);

        if (!paymentSessionId) {
            return res.status(500).json({ error: "Failed to create payment session" });
        }

        res.json({ paymentSessionId });
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
};

exports.createOrder = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: "User ID is required" });
        }

        const order = await Order.create({
            userId,
            orderId: `ORDER_${Date.now()}`,
            amount: 100,
            status: "PENDING",
        });
        this.verifyPayment();

        res.json({ success: true, order });
        

    } catch (error) {
        res.status(500).json({ error: "Failed to create order" });
    }
};

exports.verifyPayment = async (req, res) => {
    try {
        console.log("verifyPayment function is running..."); // ✅ Add this
        const { orderId } = req.query;

        if (!orderId) {
            console.log("Order ID missing");
            return res.status(400).json({ message: "Order ID is required" });
        }

        const paymentStatus = await getPaymentStatus(orderId);
        console.log("Payment status:", paymentStatus); // ✅ Log payment status

        if (paymentStatus === "Success") {
            const order = await Order.findOne({ where: { orderId } });
            if (order) {
                await order.update({ status: "SUCCESSFUL" });
                await User.update({ isPremiumUser: true }, { where: { id: order.userId } });

                req.session.isPremiumUser = true;
                req.session.save();
                console.log("User upgraded to premium");
            }

            return res.redirect("/"); 
        } else {
            return res.json({ message: "Payment failed", status: paymentStatus });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.paymentStatus = async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findOne({ where: { orderId } });

        if (!order) {
            return res.status(404).send("<h2>Order not found</h2><a href='/'>Go to Home</a>");
        }

        if (order.status === "SUCCESSFUL") {
            res.send("<h2>Payment Successful!</h2><a href='/'>Go to Home</a>");
        } else {
            res.send("<h2>Payment Failed or pending......</h2><a href='/'>Go to Home</a>");
        }
    } catch (error) {
        console.error("Error fetching payment status:", error);
        res.status(500).send("<h2>Internal Server Error</h2>");
    }
};