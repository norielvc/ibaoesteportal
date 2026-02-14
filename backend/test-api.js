const http = require('http');

http.get('http://localhost:5005/api/certificates', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            if (json.success) {
                const cert = json.certificates.find(c => c.reference_number === 'CH-2026-00001');
                if (cert) {
                    console.log('API response for CH-2026-00001:');
                    console.log('partner_full_name:', cert.partner_full_name);
                    console.log('partner_age:', cert.partner_age);
                    console.log('All keys:', Object.keys(cert));
                } else {
                    console.log('CH-2026-00001 not found in local API response');
                }
            } else {
                console.error('API Error:', json.message);
            }
        } catch (e) {
            console.error('Parse Error:', e.message);
        }
    });
}).on('error', (err) => {
    console.error('Request Error:', err.message);
});
