const express = require('express');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Configuration
const MOZELLO_API_KEY = 'your_mozello_api_key';
const ZENOPAY_API_URL = 'https://zenoapi.com/api/payments/mobile_money_tanzania';

// Process payment from Mozello
app.post('/mozello/zenopay/process', async (req, res) => {
    try {
        // Verify Mozello signature
        const signatureValid = verifyMozelloSignature(req.body, MOZELLO_API_KEY);
        if (!signatureValid) {
            return res.status(403).send('Invalid signature');
        }

        // Get merchant's Zenopay API key
        const zenopayApiKey = await getMerchantApiKey(req.body.order_uuid, req.body.website_alias);
        
        // Prepare Zenopay request
        const zenopayPayload = {
            order_id: req.body.order_uuid,
            buyer_email: req.body.billing_email,
            buyer_name: `${req.body.billing_first_name} ${req.body.billing_last_name}`,
            buyer_phone: formatTanzanianPhone(req.body.billing_phone),
            amount: Math.round(parseFloat(req.body.amount)),
            currency: 'TZS',
            webhook_url: `https://your-server.com/mozello/zenopay/webhook/${req.body.order_uuid}`
        };

        // Call Zenopay API
        const zenopayResponse = await axios.post(
            ZENOPAY_API_URL,
            zenopayPayload,
            {
                headers: {
                    'x-api-key': zenopayApiKey,
                    'Content-Type': 'application/json'
                }
            }
        );

        // Handle response
        if (zenopayResponse.data.status === 'success') {
            res.redirect(req.body.success_url);
        } else {
            res.redirect(req.body.failure_url);
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        res.redirect(req.body.failure_url);
    }
});