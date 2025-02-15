const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const path = require('path');
// const cryptoJS = require("crypto-js");

const app = express();
app.use(express.json({ limit: '15kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

                        // PUT ALL THE BELOW CREDENTIALS ON .ENV FILE
//for production (https://epay.esewa.com.np/api/epay/main/v2/form )
const BASE_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
 
//for production (https://epay.esewa.com.np/api/epay/transaction/status)
const STATUS_CHECK = 'httwps://rc.esewa.com.np/api/epay/transaction/status/';
// SECRET_KEY and PRODUCT_CODE is provided by esewa for testing
const SECRET_KEY = '8gBm/:&EnhH.1/q';
const PRODUCT_CODE = 'EPAYTEST';
const SUCCESS_URL = 'http://localhost:4000/success';
const FAILURE_URL = 'http://localhost:4000/failure';

function errorMessage(res, message, error = null) {
    const response = {
        status: false,
        message: message
    };
    if (error) {
        response.error = error;
    }
    res.status(500).json(response);
}


app.get("/payment", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

// Payment Form Route
app.post('/pay-with-esewa', async (req, res) => {
    if (!req.body) return errorMessage(res, "All data field is required")
    try {
        
        const { amount, tax_amount = 0, product_service_charge = 0, product_delivery_charge = 0 } = req.body;
        if (!amount) return errorMessage(res, "No amount is given.Please enter a amount")
        if(amount<=0)return errorMessage(res, "Amount must be above 0.")
        const total_amount = parseFloat(amount) + parseFloat(tax_amount) + parseFloat(product_service_charge) + parseFloat(product_delivery_charge);
        const transaction_uuid = Date.now();
	
        const message = `total_amount=${total_amount},transaction_uuid=${transaction_uuid},product_code=${PRODUCT_CODE}`;
        const signature = crypto.createHmac('sha256', SECRET_KEY).update(message).digest('base64');
        const paymentData = {
            amount: parseFloat(amount),
            tax_amount: parseFloat(tax_amount),
            total_amount: parseFloat(total_amount),
            product_service_charge: parseFloat(product_service_charge),
            product_delivery_charge: parseFloat(product_delivery_charge),
            transaction_uuid,
            product_code: PRODUCT_CODE,
            success_url: SUCCESS_URL,
            failure_url: FAILURE_URL,
            signed_field_names: 'total_amount,transaction_uuid,product_code',
            signature: signature,
        };

        // console.log( paymentData);  

        // Send request to eSewa API

        const pay = await axios.post(BASE_URL, new URLSearchParams(paymentData).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });
	
        // console.log(pay.request.res.responseUrl)
        res.redirect(pay.request.res.responseUrl)
	


    } catch (error) {
	console.log(error)
        return errorMessage(res, "server error", error.message)
    }
});


app.get("/success", async (req, res) => {
    try {
        if (!req.query.data) return errorMessage(res, "Server error")
        const encodedData = req.query.data;
        const decodedData = JSON.parse(Buffer.from(encodedData, "base64").toString("utf-8"));
        const TotalAmt = decodedData.total_amount.replace(/,/g, '')//removing the comma from the amount for hashing the message ie (5,000)=>(5000)
        const message = `transaction_code=${decodedData.transaction_code},status=${decodedData.status},total_amount=${TotalAmt},
        transaction_uuid=${decodedData.transaction_uuid},product_code=${PRODUCT_CODE},signed_field_names=${decodedData.signed_field_names}`;

        const hash = crypto.createHmac("sha256", SECRET_KEY).update(message).digest("base64");

        if (hash !== decodedData.signature) {
            return errorMessage(res, "Invalid signature")
        }

        const response = await axios.get(STATUS_CHECK, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json"
            },
            params: {
                product_code: PRODUCT_CODE,
                total_amount: TotalAmt,
                transaction_uuid: decodedData.transaction_uuid
            }
        });
        
        const { status, transaction_uuid, total_amount } = response.data;
        if (status !== "COMPLETE" || transaction_uuid !== decodedData.transaction_uuid || Number(total_amount) !== Number(TotalAmt)) {
            return errorMessage(res, "Invalid transaction details")

        }
        //after verification store something to the database ie(payemnt details etc) in my example i wil simply send success html file 
        return res.sendFile(path.join(__dirname, 'public', 'sucess.html'));

        // console.log(response.data)
        // return res.status(200).json({
        //     status: true,
        //     message: "Success",
        //     transaction_details: {
        //         status: response.data.status,
        //         ref_id: response.data.ref_id,
        //         amount: response.data.total_amount

        //     }
        // });
    } catch (error) {
        return errorMessage(res, "Server error", error.message)
    }
});


// failure Route
app.get('/failure', (req, res) => {

    return res.sendFile(path.join(__dirname, 'public', 'failed.html'));

    // res.status(500).json({
    //     status: false,
    //     message: 'Transaction failed.Please try again later.',
    // });
});
app.get("/test",(req,res)=>{
    
    return res.sendFile(path.join(__dirname, 'public', 'sucess.html'));

})

app.listen(4000, () => {
    console.log('App is running on port 4000');
});
