const express = require('express');
const path = require('path');
const router = require('./routes/api.js');
const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../FRONTEND')));
app.use(express.json());
app.use(router);

app.listen(port, () => {
    console.log(`MyGameList corriendo en el puerto ${port}!`)
});