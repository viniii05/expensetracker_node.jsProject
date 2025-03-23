const Order = require('../models/Order');
const User = require('../models/User'); 
require('dotenv').config();
const { createorder, getPaymentStatus } = require('../services/cashfreeService.js'); // ✅ Add getPaymentStatus

exports.pay = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "User not logged in" });
        }

        const orderId = `order_${Date.now()}`;
        const orderAmount = 100;
        const customerId = `customer_${req.session.userId}`;

        const order = new Order({
            userId: req.session.userId,
            orderId,
            amount: orderAmount,
            status: "PENDING",
        });

        await order.save();
        const paymentSessionId = await createorder(orderId, orderAmount, "INR", customerId, "9999999999");

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
        const { orderId } = req.query;
        if (!req.session.userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.session.userId;
        
        // Check payment status using your payment provider API
        const paymentStatus = await getPaymentStatus(orderId); // ✅ Fix: Use getPaymentStatus

        if (paymentStatus === "SUCCESS") {
            await User.findByIdAndUpdate(userId, { isPremiumUser: true }); // ✅ Fix Here
            return res.status(200).json({ message: "Payment verified successfully" });
        } else {
            return res.status(400).json({ message: "Payment failed" });
        }
    } catch (error) {
        console.error("Error fetching order status", error);
        res.status(500).json({ message: "Error verifying payment" });
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