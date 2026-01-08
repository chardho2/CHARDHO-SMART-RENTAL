
const fs = require('fs');
const path = require('path');

try {
    const envPath = path.join(__dirname, 'server', '.env');
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        fs.writeFileSync('port_info.txt', content);
    } else {
        fs.writeFileSync('port_info.txt', 'FILE_NOT_FOUND');
    }
} catch (e) {
    fs.writeFileSync('port_info.txt', 'ERROR: ' + e.message);
}
