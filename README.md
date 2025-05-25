
# eSewa Payment Integration in Node.js

This repository demonstrates how to integrate eSewa payment gateway in a Node.js application. The application includes a payment form where users can make payments, and a success/failure route to handle the response after the transaction.

The code provided integrates the eSewa API with the backend to securely send payment data, verify the transaction, and display success or failure messages.

## Features:
- **Payment Form**: Allows users to input payment details.
- **eSewa Integration**: Sends data to eSewa's API to process payments.
- **Transaction Verification**: Verifies the transaction status by communicating with eSewa's status endpoint.
- **Success and Failure Handling**: Redirects to success or failure pages based on the transaction result.

## Prerequisites:
- **Node.js**: Ensure you have Node.js installed (v14 or higher is recommended).
- **eSewa API Credentials**: You need the `SECRET_KEY` and `PRODUCT_CODE` from eSewa for integration.

## Installation:
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/Ishwor-stha/esewa-intregation.git
   cd eSewa-Integration
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your eSewa API credentials:
   ```
   SECRET_KEY=your_secret_key
   PRODUCT_CODE=your_product_code
   ```

4. Run the application:
   ```bash
   npm start
   ```

   The app will be available at `http://localhost:4000`.

## File Structure:
- **app.js**: The main application file where the entire payment flow is handled.
- **public/index.html**: The HTML form that allows users to input payment details.
- **public/success.html**: A success page displayed after a successful transaction.
- **public/failed.html**: A failure page displayed if the transaction fails.

> **Note**: All logic is currently written in the `app.js` file for simplicity. However, for larger projects, it is highly recommended to modularize your code by splitting it into separate files (routes, controllers, services, etc.) to improve maintainability.

## Routes:
1. **GET `/payment`**: Displays the payment form (`public/index.html`).
   e, all the logic is contained within a single file (app.js) for simplicity. However, for a more scalable application, it is highly recommended to break the logic into multiple files such as:

    controllers/paymentController.js: Handles payment logic.
    routes/paymentRout
2. **POST `/pay-with-esewa`**: Handles the payment request by sending the payment details to the eSewa API and redirects to eSewa's payment gateway.

3. **GET `/success`**: Handles the response from eSewa after the payment is completed. It verifies the transaction's validity and displays a success page or an error message.

4. **GET `/failure`**: Displays the failure page if the transaction is unsuccessful.

## Environment Variables:
Ensure that you set the following environment variables in the `.env` file:
- `SECRET_KEY`: Provided by eSewa.
- `PRODUCT_CODE`: Provided by eSewa.

Example `.env`:
```
SECRET_KEY=8gBm/:&EnhH.1/q
PRODUCT_CODE=EPAYTEST
```

## Code Explanation:

### 1. **Payment Form Route** (`POST /pay-with-esewa`):
   - The route receives payment details (amount, tax, service charges) from the user.
   - It calculates the total amount and prepares a message string for the payment request.
   - It generates a secure signature using HMAC SHA256 with the secret key and sends the data to eSewa's API endpoint.
   - The user is redirected to eSewa's payment gateway.

### 2. **Transaction Success Route** (`GET /success`):
   - Upon successful payment, eSewa sends a response containing transaction data.
   - The transaction data is decoded and verified using a hash signature.
   - If the transaction is valid, it queries eSewa’s status API for further confirmation.
   - Upon successful verification, it shows the success page.

### 3. **Transaction Failure Route** (`GET /failure`):
   - If the payment fails or the user cancels the payment, this route displays a failure page.

### 4. **Error Handling**:
   - The `errorMessage` function handles error responses by sending a standard JSON response with the error message.

## Security Notes:
- **Signature Validation**: Always validate the signature sent by eSewa to ensure the integrity and authenticity of the transaction.
- **Data Privacy**: Do not store sensitive data such as the `SECRET_KEY` or user payment information directly in your code. Use environment variables to store sensitive credentials.
