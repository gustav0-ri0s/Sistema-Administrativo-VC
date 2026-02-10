const https = require('https');

const options = {
    hostname: 'api.decolecta.com',
    path: '/v1/reniec/dni?numero=44556677',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer apis-token-3044.Rm2oeHHqQLKzmpt-H5D0JjuFDgMsyuhr'
    }
};

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        console.log('STATUS:', res.statusCode);
        try {
            const parsed = JSON.parse(data);
            console.log('KEYS:', Object.keys(parsed));
            console.log('FULL:', JSON.stringify(parsed, null, 2));
        } catch (e) {
            console.log('DATA (not json?):', data);
        }
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.end();
