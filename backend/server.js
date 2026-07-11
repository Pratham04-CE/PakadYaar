const express = require("express");
const http = require("http");
const cors = require("cors");

const initializeSocket = require("./socket/socket");

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

initializeSocket(server);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});