const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
// const cryptoJS = require("crypto-js");

const app = express();
app.use(express.json({ limit: '15kb' }));

const BASE_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const SECRET_KEY = '8gBm/:&EnhH.1/q';
const PRODUCT_CODE = 'EPAYTEST';
const SUCCESS_URL = 'http://localhost:4000/success';
const FAILURE_URL = 'http://localhost:4000/failure';

// Generate Payment Form
app.get('/pay-with-esewa', (req, res) => {
    try {
        const amount = 500;
        const tax_amount = 10;
        const total_amount = amount + tax_amount;
        const service_charge = 0;
        const delivery_charge = 0;
        const transaction_uuid = Date.now();
        // Message to sign
        const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${PRODUCT_CODE}`;
        

        // Generate HMAC SHA-256 signature
        const signature = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64');
        // const signature = cryptoJS.HmacSHA256(message, SECRET_KEY);
        // const signatureInBase64 = cryptoJS.enc.Base64.stringify(signature);

        // Send the payment form as a response
        res.send(`
            <body>
                <form action="${BASE_URL}" method="POST">
                    <label>Amount:</label>
                    <input type="text" id="amount" name="amount" value="${amount}" required>
                    <br><label>Tax Amount:</label>
                    <input type="text" id="tax_amount" name="tax_amount" value="${tax_amount}" required>
                    <br><label>Total Amount:</label>
                    <input type="text" id="total_amount" name="total_amount" value="${total_amount}" required>
                    <br><label>Transaction UUID:</label>
                    <input type="text" id="transaction_uuid" name="transaction_uuid" value="${transaction_uuid}" required>
                    <br><label>Product Code:</label>
                    <input type="text" id="product_code" name="product_code" value="${PRODUCT_CODE}" required>
                    <br><label>Service Charge:</label>
                    <input type="text" id="product_service_charge" name="product_service_charge" value="${service_charge}" required>
                    <br><label>Delivery Charge:</label>
                    <input type="text" id="product_delivery_charge" name="product_delivery_charge" value="${delivery_charge}" required>
                    <br><label>Success URL:</label>
                    <input type="text" id="success_url" name="success_url" value="${SUCCESS_URL}" required>
                    <br><label>Failure URL:</label>
                    <input type="text" id="failure_url" name="failure_url" value="${FAILURE_URL}" required>
                    <br><label>Signed Field Names:</label>
                    <input type="text" id="signed_field_names" name="signed_field_names" value="total_amount,transaction_uuid,product_code" required>
                    <br><label>Signature:</label>
                    <input type="text" id="signature" name="signature" value="${signature}" required>
                    <br><input value="Submit" type="submit">
                </form>
            </body>
        `);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});


app.get("/success", async (req, res) => {
    try {
        const encodedData = req.query.data;
        const decodedData = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));

        const secretKey = SECRET_KEY;
        const message = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${decodedData.total_amount},transaction_uuid=${decodedData.transaction_uuid},product_code=${PRODUCT_CODE},signed_field_names=${decodedData.signed_field_names}`;
        
        const hash = crypto.createHmac("sha256", secretKey).update(message).digest("base64");

        if (hash !== decodedData.signature) {
            return res.status(400).json({ status: false, message: "Invalid signature", decodedData });
        }

        const response = await axios.get(`https://rc.esewa.com.np/api/epay/transaction/status/`, {
            headers: { Accept: "application/json", "Content-Type": "application/json" },
            params: {
                product_code: PRODUCT_CODE,
                total_amount: decodedData.total_amount,
                transaction_uuid: decodedData.transaction_uuid
            }
        });

        const { status, transaction_uuid, total_amount } = response.data;
        if (status !== "COMPLETE" || transaction_uuid !== decodedData.transaction_uuid || Number(total_amount) !== Number(decodedData.total_amount)) {
            return res.status(400).json({
                 status: false, 
                 message: "Invalid transaction data"
                 });
        }
        console.log(response.data)
        res.status(200).json({
             status: true,
              message: "Success",
            response:{
                status:response.data.status,
                ref_id:response.data.ref_id,
                amount:response.data.amount
            }
            });
    } catch (error) {
        res.status(500).json({
             status: false, 
             message: "Server error", 
             error: error.message 
            });
    }
});


// Failure Route
app.get('/failure', (req, res) => {
    res.json({
        status: false,
        message: 'Transaction failed',
    });
});

app.listen(4000, () => {
    console.log('App is running on port 4000');
});