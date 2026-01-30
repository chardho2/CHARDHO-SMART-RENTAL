const dns = require('dns');
const { Resolver } = dns.promises;

async function testExternalDns() {
    const srvRecord = '_mongodb._tcp.cluster0.r2ah3ab.mongodb.net';

    // 1. Try local DNS
    console.log('--- Testing Local DNS ---');
    try {
        const addresses = await dns.promises.resolveSrv(srvRecord);
        console.log('Local DNS Success:', addresses);
    } catch (err) {
        console.error('Local DNS Failed:', err.code, err.message);
    }

    // 2. Try Google DNS (8.8.8.8)
    const resolver = new Resolver();
    resolver.setServers(['8.8.8.8']);
    console.log('\n--- Testing Google DNS (8.8.8.8) ---');
    try {
        const addresses = await resolver.resolveSrv(srvRecord);
        console.log('Google DNS Success:', addresses);
        console.log('\n✅ TIP: Your ISP DNS is blocking MongoDB. Change your Windows DNS settings to 8.8.8.8');
    } catch (err) {
        console.error('Google DNS Failed:', err.code, err.message);
    }
}

testExternalDns();
