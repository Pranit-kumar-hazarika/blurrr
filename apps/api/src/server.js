require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { rateLimit } = require("express-rate-limit");
const env = require("./config/env");
const eventsRouter = require("./routes/events");
const adminRouter = require("./routes/admin");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    // Requests without Origin (health checks / server tools) are allowed.
    if (!origin || env.frontendOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  exposedHeaders: ["Content-Disposition"],
  maxAge: 600
}));
app.use(express.json({ limit: "100kb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
app.use("/api", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false
}));

app.get("/api/health", (req, res) => res.json({ status: "ok", app: "blurrr-api" }));
app.use("/api/events", eventsRouter);
app.use("/api/admin", adminRouter);
app.use(notFound);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`blurrr API listening on port ${env.port}`);
});
