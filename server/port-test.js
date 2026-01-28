const express = require('express');
const app = express();
const port = 4000;
app.get('/', (req, res) => res.send('Port 4000 is open'));
app.listen(port, () => console.log(`Test server on ${port}`));
