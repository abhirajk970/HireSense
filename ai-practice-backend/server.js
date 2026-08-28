const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hiresense")
  .then(() => console.log("AI Practice Service Connected to MongoDB"))
  .catch(err => console.log("AI Practice Service DB Error", err));

app.use("/api/practice-session", require("./routes/practiceSessionRoutes"));

const PORT = process.env.PORT || 5300;

app.listen(PORT, () => {
    console.log(`\n🚀 AI Interview Practice Microservice running on http://localhost:${PORT}`);
    console.log(`🤖 LLM: ${process.env.OLLAMA_MODEL || "llama3"} @ ${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}\n`);
});
