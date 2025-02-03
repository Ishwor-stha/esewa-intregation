const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const cryptoJS = require("crypto-js");

const app = express();
app.use(express.json({ limit: '15kb' }));

const BASE_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const SECRET_KEY = '8gBm/:&EnhH.1/q'; // Provided secret key for testing
const PRODUCT_CODE = 'EPAYTEST'; // Merchant ID/Service Code
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
        const transaction_uuid = crypto.randomBytes(16).toString('hex');

        // Message to sign
        const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${PRODUCT_CODE}`;

        // Generate HMAC SHA-256 signature
        const signature = cryptoJS.HmacSHA256(message, SECRET_KEY);
        const signatureInBase64 = cryptoJS.enc.Base64.stringify(signature);

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
                    <input type="text" id="signature" name="signature" value="${signatureInBase64}" required>
                    <br><input value="Submit" type="submit">
                </form>
            </body>
        `);
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});
// ?request_id=d1958b8611f40301e499435d57652453&amount=560&transaction_code=EPAYTEST

// Success Route
app.get('/success', async (req, res) => {
    try {

        const encodedData = req.query.data;

        // Decode the Base64-encoded string into raw data (WordArray)
        const decodedData = cryptoJS.enc.Base64.parse(encodedData);

        // Convert decoded data back to a string 
        const decodedDataString = decodedData.toString(cryptoJS.enc.Utf8);

        console.log('Decoded Data:', decodedDataString);


        const { transaction_uuid, total_amount, product_code } = JSON.parse(decodedDataString);

        // Generate the message to verify HMAC signature 
        const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${product_code}`;
        console.log("DESTRUCTRING")
        console.log("total_amount:" + total_amount)
        console.log("transaction_uid" + transaction_uuid)
        console.log("produuct code" + product_code)
        console.log("END")




        // Recreate the signature using the secret key (for comparison)
        const computedSignature = cryptoJS.HmacSHA256(message, SECRET_KEY);
        const computedSignatureBase64 = cryptoJS.enc.Base64.stringify(computedSignature);
        console.log(req.query.data)
        console.log(computedSignatureBase64)

        console.log(req.query.data===computedSignature)

        // Compare the decoded signature with the freshly computed signature
        if (req.query.signature === computedSignatureBase64) {
            const paymentDetail = await axios.get(`https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${product_code}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`);

            res.json({
                status: true,
                message: 'Transaction successful',
                payment: paymentDetail.data
            });
        } else {
            // Signature doesn't match
            res.status(400).json({ status: false, message: 'Invalid signature' });
        }

    } catch (error) {
        console.error('Error processing success route:', error);
        res.status(500).json({ status: false, message: 'Error processing transaction' });
    }
});



// Failure Route
app.get('/failure', (req, res) => {
    res.json({
        status: false,
        message: 'Transaction failed',
    });
});

// Transaction Status Check API
// app.post('/status', async (req, res) => {
//     try {
//         const { request_id, amount, transaction_code } = req.body;

//         const response = await axios.post('https://rc-epay.esewa.com.np/api/epay/main/v2/status', {
//             request_id,
//             amount,
//             transaction_code,
//         });

//         res.json(response.data);
//     } catch (error) {
//         res.status(500).json({ status: false, message: error.message });
//     }
// });

// Start Server
app.listen(4000, () => {
    console.log('App is running on port 4000');
});
