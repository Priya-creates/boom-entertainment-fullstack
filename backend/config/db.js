const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "../config.env") });
const DB = process.env.MONGO_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(DB);
    console.log("✅ DB connection successful!");
  } catch (err) {
    console.error("❌ DB connection unsuccessful");
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
