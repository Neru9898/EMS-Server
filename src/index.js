// --- Config --- //

// dotenv
require('dotenv').config();

// Express
const express = require('express');
const app = express();
const port = parseInt(process.env.PROD) ? 80 : 3000; // Use port 80 in production, 3000 in development
app.use(express.json({limit: "5mb"}));

// MongoDB
require('./config/mongo');

// Cors
const cors = require('cors');
app.use(cors());

// --- Server --- //

// Socket.io
const server = require('http').createServer(app);
const io = require('socket.io')(server);
io.on('connection', socket => {
  console.log("A Client has connected!");
  require('./sockets/sockets')(socket);
});

// Router
const api = require('./api/api')(io);

app.use('/api', api);

 // Listening
server.listen(port, () => {
  console.log(`EMS-Server listening at http://localhost:${port}`);
})