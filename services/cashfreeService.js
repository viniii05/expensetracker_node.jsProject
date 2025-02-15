import { Cashfree } from "cashfree-pg";

Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

exports.createorder = async (
    orderId,
    orderAmount,
    orderCurrency = "IND",
    customerId,
    customerPhone
) => {
    try {
        const expiryDate = new Date(Date.now() + 60 * 60 * 1000);
        const formattedExpiryDate = expiryDate.toISOString();

        const request = {
            order_amount : orderAmount,
            order_currency : orderCurrency,
            order_id : orderId,
            customer_details : {
                customer_id : customerId,
                customer_phone : customerPhone,
            },
            order_meta : {
                return_url : `http://localhost:3000/payment-status/${orderId}`,
                payment_methods : "cc, dc, upi"
            },
            order_expiry_time: formattedExpiryDate,
        };

        const response = await Cashfree.PGCreateOrder("2025-01-01", request);
    } catch (error) {
        console.log("Error creating order :: ", error.message);
    }
};