const express = require('express');
const https = require('https');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User'); // Ensure User model exists
require('dotenv').config(); // Load environment variables
const path = require('path');

router.get('/pay', (req, res) => {
      res.sendFile(path.join(__dirname, '../views/paynow.html'));
})

router.post('/create-order', async (req, res) => {
    try {
        const { userId } = req.body;
        console.log("Received userId:", userId); // Debugging

        const order = await Order.create({
            userId,
            orderId: `ORDER_${Date.now()}`,
            amount: 100,
            status: 'PENDING'
        });

        console.log("Order created:", order);

        const postData = JSON.stringify({
            order_id: order.orderId,
            order_amount: order.amount,
            order_currency: "INR",
            customer_details: {
                customer_id: userId,
                customer_email: "user@example.com",
                customer_phone: "9999999999"
            }
        });

        const options = {
            hostname: 'sandbox.cashfree.com',
            path: '/pg/orders',
            method: 'POST',
            headers: {
                'x-client-id': process.env.CASHFREE_APP_ID,
                'x-client-secret': process.env.CASHFREE_SECRET_KEY,
                'x-api-version': '2025-01-01', // ✅ Add this line

                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        console.log("Sending request to Cashfree...");

        const request = https.request(options, (response) => {
            let data = '';

            response.on('data', (chunk) => {
                data += chunk;
            });

            response.on('end', () => {
                console.log("Raw response from Cashfree:", data);
                try {
                    const cashfreeResponse = JSON.parse(data);
                    console.log("Parsed Cashfree Response:", cashfreeResponse);

                    if (cashfreeResponse.payment_link) {
                        res.json({ paymentLink: cashfreeResponse.payment_link });
                    } else {
                        res.status(500).json({ error: 'Failed to get payment link' });
                    }
                } catch (err) {
                    console.error('Error parsing response:', err);
                    res.status(500).json({ error: 'Invalid response from Cashfree' });
                }
            });
        });

        request.on('error', (err) => {
            console.error('Request error:', err);
            res.status(500).json({ error: 'Payment initiation failed' });
        });

        request.write(postData);
        request.end();

    } catch (error) {
        console.error("Error in create-order:", error);
        res.status(500).json({ error: 'Failed to create order' });
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
                user.isPremium = true;
                await user.save();
            }
        }

        res.json({ message: 'Order status updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router;
