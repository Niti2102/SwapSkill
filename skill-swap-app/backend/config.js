const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // Use default MongoDB URI if not provided
        const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/skill-swap-app";
        await mongoose.connect(mongoURI);
        // MongoDB connected successfully (silent)
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        // Don't exit process, just log the error
    }
};

module.exports = connectDB;