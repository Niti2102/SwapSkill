const express = require("express");
const cors = require("cors"); //to connect frontend and backend
const dotenv = require("dotenv"); //to use environment variables
const connectDB = require("./config"); //to connect to mongodb
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json()); //to get input as json file

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their personal room
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined room: user_${userId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Make io available to routes
app.set('io', io);

// Routes
app.get('/', (req, res) => {
    res.send("Skill Swap API is running!");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/swipe", require("./routes/swipe"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/meetings", require("./routes/meeting"));
app.use("/api/notifications", require("./routes/notifications"));

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
