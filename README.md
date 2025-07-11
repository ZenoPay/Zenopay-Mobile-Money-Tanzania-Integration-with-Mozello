# Zenopay-Mobile-Money-Tanzania-Integration-with-Mozello

## Overview
This documentation provides a comprehensive guide for integrating Zenopay's Mobile Money Tanzania payment solution with Mozello's e-commerce platform. The integration enables Mozello merchants in Tanzania to accept payments via M-Pesa, Tigo Pesa, and Airtel Money.

## Prerequisites
- Mozello developer account
- Zenopay merchant account
- Server with HTTPS capability
- Node.js environment (for example implementation)

## Integration Steps

### 1. Create Mozello Integration Manifest

```json
{
    "app_type": "PAYMENT_GATEWAY",
    "app_title": "Zenopay Mobile Money Tanzania",
    "app_vendor": {
        "company_name": "Zenopay",
        "support_email": "support@zenoapi.com",
        "support_phone": "+255 XXX XXX XXX",
        "developer_email": "dev@zenoapi.com"
    },
    "payment_api_url": "https://your-server.com/mozello/zenopay/process",
    "payment_api_data_fields": [
        {
            "id": "merchant_api_key",
            "title": {
                "en": "Your Zenopay API Key",
                "sw": "Zenopay API Key yako"
            },
            "type": "text",
            "required": true
        },
        {
            "id": "sandbox_mode",
            "title": {
                "en": "Test Mode",
                "sw": "Hali ya jaribio"
            },
            "type": "checkbox",
            "required": false
        }
    ],
    "payment_platform_info": {
        "available_in_countries": ["TZ"],
        "supported_payment_methods": {
            "visa": false,
            "mc": false,
            "amex": false,
            "mobile_money": true
        },
        "info_url": {
            "en": "https://zenoapi.com/integrations/mozello",
            "sw": "https://zenoapi.com/sw/integrations/mozello"
        }
    }
}
```

### 2. Implement Payment Processing Endpoint

```javascript
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
```

### 3. Implement Webhook Handler

```javascript
// Webhook handler for Zenopay notifications
app.post('/mozello/zenopay/webhook/:order_uuid', async (req, res) => {
    try {
        // Verify Zenopay API key
        const apiKey = req.headers['x-api-key'];
        if (!isValidZenopayKey(apiKey)) {
            return res.status(403).send('Invalid API key');
        }

        const orderUuid = req.params.order_uuid;
        const paymentStatus = req.body.payment_status;

        // Notify Mozello about payment status
        await notifyMozello(orderUuid, paymentStatus === 'COMPLETED' ? 'approved' : 'failed');

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).send('Error processing webhook');
    }
});
```

### 4. Helper Functions

#### Phone Number Formatting

```javascript
function formatTanzanianPhone(phone) {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Convert international format to local
    if (cleaned.startsWith('255')) {
        return '0' + cleaned.substring(3);
    }
    
    // Ensure proper local format
    if (!cleaned.startsWith('0') && cleaned.length === 9) {
        return '0' + cleaned;
    }
    
    return cleaned;
}
```

#### Signature Verification

```javascript
function verifyMozelloSignature(postData, apiKey) {
    let message = '';
    for (const [key, value] of Object.entries(postData)) {
        if (key !== 'signature') {
            message += value;
        }
    }
    
    const signature = crypto.createHmac('sha256', apiKey)
                           .update(message)
                           .digest('base64');
    
    return signature === postData.signature;
}
```

#### Order Status Check (Fallback)

```javascript
async function checkZenopayOrderStatus(orderId, zenopayApiKey) {
    try {
        const response = await axios.get(
            `https://zenoapi.com/api/payments/order-status?order_id=${orderId}`,
            {
                headers: {
                    'x-api-key': zenopayApiKey
                }
            }
        );
        
        return response.data.data[0]?.payment_status || 'PENDING';
    } catch (error) {
        console.error('Error checking order status:', error);
        return 'UNKNOWN';
    }
}
```

## Testing Procedures

1. **Sandbox Testing**:
   - Configure test mode in merchant settings
   - Simulate payments with test phone numbers
   - Verify all callback scenarios

2. **End-to-End Testing**:
   - Complete checkout flow with real devices
   - Test different mobile money providers
   - Verify successful and failed payment scenarios

3. **Error Handling Tests**:
   - Simulate network failures
   - Test with invalid phone numbers
   - Verify insufficient funds handling

## Deployment Checklist

1. [ ] Obtain production API credentials from Zenopay
2. [ ] Deploy integration server with HTTPS
3. [ ] Configure DNS for webhook endpoints
4. [ ] Submit integration to Mozello for approval
5. [ ] Monitor initial transactions for issues

## Compliance Requirements

- Ensure PCI DSS compliance for payment handling
- Implement proper data encryption
- Maintain transaction logs without sensitive data
- Comply with Tanzanian financial regulations

## Support Information

For assistance with this integration:
- Zenopay Support: support@zenoapi.com
- Mozello Developer Docs: https://developer.mozello.com

## Version History

- 1.0.0 (Initial Release): Basic integration for Tanzanian mobile money
- 1.1.0 (Planned): Multi-currency support and enhanced error handling

## Troubleshooting Guide

| Issue | Solution |
|-------|----------|
| Invalid signature errors | Verify API keys and signature generation logic |
| Payment not completing | Check Zenopay transaction logs and webhook delivery |
| Phone number rejection | Validate phone number formatting logic |
| Webhook timeouts | Implement retry mechanism and status polling |

This documentation provides a complete reference for integrating Zenopay Mobile Money Tanzania with Mozello's e-commerce platform, enabling Tanzanian merchants to accept mobile payments seamlessly.