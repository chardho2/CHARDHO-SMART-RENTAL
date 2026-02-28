/**
 * Socket Connection Test Script
 * 
 * This script helps test and debug socket connections for drivers.
 * Run this from the server directory to check socket room status.
 */

const { debugSocketRooms, getConnectedDriversList } = require('./socket');

// Function to print current socket status
function printSocketStatus() {
    console.log('\n🔍 SOCKET STATUS CHECK\n');

    const drivers = getConnectedDriversList();
    console.log(`📊 Connected Drivers: ${drivers.length}`);

    if (drivers.length > 0) {
        console.log('\n👥 Driver List:');
        drivers.forEach(({ driverId, socketId }) => {
            console.log(`  - Driver ID: ${driverId}`);
            console.log(`    Socket ID: ${socketId}`);
        });
    } else {
        console.log('  ⚠️ No drivers currently connected');
    }

    console.log('\n');
    debugSocketRooms();
}

// Export for use in other scripts
module.exports = { printSocketStatus };

// If run directly, print status every 5 seconds
if (require.main === module) {
    console.log('🚀 Socket Monitor Started');
    console.log('Press Ctrl+C to stop\n');

    // Print immediately
    printSocketStatus();

    // Then print every 5 seconds
    setInterval(printSocketStatus, 5000);
}
