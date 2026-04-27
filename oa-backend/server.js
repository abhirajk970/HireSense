const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hiresense")
  .then(() => console.log("OA Service Connected to MongoDB"))
  .catch(err => console.log("OA Service DB Error", err));

app.use("/api/assessments", require("./routes/assessmentRoutes"));

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
    console.log(`OA Service running on port http://localhost:${PORT}`);
});
