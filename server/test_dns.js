const dns = require('dns').promises;

async function testDns() {
  const host = 'cluster0.r2ah3ab.mongodb.net';
  const srvHost = '_mongodb._tcp.cluster0.r2ah3ab.mongodb.net';
  
  console.log(`Testing DNS resolution for ${host}...`);
  try {
    const addresses = await dns.lookup(host);
    console.log('Standard lookup:', addresses);
  } catch (err) {
    console.error('Standard lookup failed:', err.message);
  }

  console.log(`\nTesting SRV lookup for ${srvHost}...`);
  try {
    const srv = await dns.resolveSrv(srvHost);
    console.log('SRV lookup:', srv);
  } catch (err) {
    console.error('SRV lookup failed:', err.message);
  }
}

testDns();
