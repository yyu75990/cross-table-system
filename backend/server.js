const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const tableManagerRoutes = require('./routes/tableManager');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/tableManager', tableManagerRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
