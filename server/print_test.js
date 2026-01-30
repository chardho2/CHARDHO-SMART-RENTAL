console.log('STARTING SCRIPT');
try {
    const fs = require('fs');
    fs.writeFileSync('output.txt', 'SCRIPT EXECUTED AT ' + new Date().toISOString());
    console.log('FILE WRITTEN');
} catch (e) {
    console.error(e);
}
process.exit(0);
