const axios = require('axios');
const fs = require('fs');

async function testResetWithFileLog() {
    const token = '7267cbcd8634e1bbd9a6c8957849053a73a6a2d74f33bc76869eb8b53db55b53';
    const userType = 'user';
    const newPassword = 'NewPassword123!';
    const apiUrl = 'http://localhost:4000/api/auth/reset-password';

    try {
        const response = await axios.post(apiUrl, {
            token,
            userType,
            newPassword
        });

        const output = `✅ PASSWORD RESET SUCCESSFUL!\nResponse: ${JSON.stringify(response.data, null, 2)}\n`;
        fs.writeFileSync('reset_test_result.txt', output);
        console.log(output);

    } catch (error) {
        let output = '\n❌ PASSWORD RESET FAILED\n';
        if (error.response) {
            output += `Status: ${error.response.status}\n`;
            output += `Error Message: ${error.response.data.message || JSON.stringify(error.response.data)}\n`;
        } else {
            output += `Connection Error: ${error.message}\n`;
        }
        fs.writeFileSync('reset_test_result.txt', output);
        console.log(output);
    }
}

testResetWithFileLog();
