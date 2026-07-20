const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const userRouter = require("./routes/userRoutes");
const videoRouter = require("./routes/videoRoutes");
const pingRouter = require("./routes/pingRoutes");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");

dotenv.config({ path: path.join(__dirname, "config.env") });

connectDB();

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(hpp());

const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: "You’ve hit the rate limit. Please try again later.",
});
app.use(limiter);

// Allowed frontend domains
const allowedOrigins = [
  "http://localhost:3001",
  "https://boom-entertainment-xi.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api/user", userRouter);
app.use("/api/videos", videoRouter);
app.use("/api", pingRouter);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
