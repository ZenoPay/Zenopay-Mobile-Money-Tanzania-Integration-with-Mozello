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