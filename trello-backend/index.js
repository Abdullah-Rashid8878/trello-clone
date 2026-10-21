const connectToMongo = require('./db');
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

connectToMongo();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Static Uploads Middleware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/boards', require('./routes/boards'));
app.use('/api/lists', require('./routes/lists'));
app.use('/api/cards', require('./routes/cards'));

app.get('/', (req, res) => {
    res.send('Trello Clone Backend is running');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Trello backend listening at http://192.168.2.118:${port}`);
});