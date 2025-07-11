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