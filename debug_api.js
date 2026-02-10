import fs from 'fs';
try {
    const content = fs.readFileSync('out.json', 'utf8');
    const data = JSON.parse(content);
    console.log('Keys:', Object.keys(data));
    console.log('Full data:', JSON.stringify(data, null, 2));
} catch (e) {
    console.error(e);
}
