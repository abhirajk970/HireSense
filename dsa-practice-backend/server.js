const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hiresense")
  .then(() => console.log("DSA Practice Service Connected to MongoDB"))
  .catch(err => console.log("DSA Practice Service DB Error", err));

// Match original /api/assessments prefix for easiest frontend port-refactoring!
app.use("/api/assessments", require("./routes/practiceRoutes"));

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
    console.log(`DSA Practice Service running on port http://localhost:${PORT}`);
});
