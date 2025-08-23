const express = require("express");
const cors = require("cors"); //to connect frontend and backend
const dotenv = require("dotenv"); //to use environment variables
const connectDB = require("./config"); //to connect to mongodb

dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); //to get input as json file

// Routes
app.get('/', (req, res) => {
    res.send("Skill Swap API is running!");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/swipe", require("./routes/swipe"));

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
