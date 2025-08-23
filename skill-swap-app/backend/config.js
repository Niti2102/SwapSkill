const mongoose = require("mongoose");

const connectDB = async () => {
    try {
        // Use default MongoDB URI if not provided
        const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/skill-swap-app";
        await mongoose.connect(mongoURI);
        console.log("MongoDB connected successfully");
    } catch (error) {
        console.log("MongoDB connection error:", error.message);
        console.log("Make sure MongoDB is running on your system");
        // Don't exit process, just log the error
    }
};

module.exports = connectDB;