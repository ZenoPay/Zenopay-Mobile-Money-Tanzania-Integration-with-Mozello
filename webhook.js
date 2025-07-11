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