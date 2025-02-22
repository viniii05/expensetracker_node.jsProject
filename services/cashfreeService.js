import User from "../models/User.js"; // ✅ Correct for ESM
import { Cashfree } from "cashfree-pg";



Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;

export const createorder = async (
    orderId, orderAmount, orderCurrency, customerId, customerPhone
) => {
    try {
        const expiryDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        
        const request = {
            order_amount: orderAmount,
            order_currency: orderCurrency || "INR",
            order_id: orderId,
            customer_details: { customer_id: customerId, customer_phone: customerPhone },
            order_meta: { return_url: `http://localhost:3000/payment-status/${orderId}`, payment_methods: "cc, dc, upi" },
            order_expiry_time: expiryDate,
        };

        const response = await Cashfree.PGCreateOrder("2023-08-01", request);
        if (!response || !response.data || !response.data.payment_session_id) {
            console.error("Cashfree order creation failed:", response);
            return null;
        }

        return response.data.payment_session_id;
    } catch (error) {
        console.error("Error creating order:", error);
        return null;
    }
};

// export const getPaymentStatus = async (orderId) => {
//     try{
//         const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);

//         let getOrderResponse = response.data;
//         let orderStatus;

//         if(
//             getOrderResponse.filter(
//                 (transaction) => transaction.payment_status === "SUCCESS"
//             ).length > 0
//         ){
//             orderStatus = "Success";
//         }else if (getOrderResponse.filter ((transaction) => transaction.payment_status === "PENDING").length > 0){
//             orderStatus = "Pending";
//         } else {
//             orderStatus = "Failure";
//         }
//         return orderStatus;
//     } catch (err) {
//         console.log("erroe fetching order Ststus", err.message);
//     }
// }
export const getPaymentStatus = async (orderId, userId) => {
    try {
        const response = await Cashfree.PGOrderFetchPayments("2023-08-01", orderId);
        let getOrderResponse = response.data;
        let orderStatus;

        if (getOrderResponse.some(transaction => transaction.payment_status === "SUCCESS")) {
            orderStatus = "Success";

            // ✅ Update user as premium
            await User.update({ isPremium: true }, { where: { id: userId } });

        } else if (getOrderResponse.some(transaction => transaction.payment_status === "PENDING")) {
            orderStatus = "Pending";
        } else {
            orderStatus = "Failure";
        }

        return orderStatus;
    } catch (err) {
        console.log("Error fetching order status", err.message);
    }
};