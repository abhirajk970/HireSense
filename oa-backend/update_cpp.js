const mongoose = require('mongoose');
const Question = require('./models/Question');

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/hiresense");
  const qs = await Question.find();
  for (let q of qs) {
      q.initialCode.cpp = `#include <iostream>\n#include <vector>\n#include <string>\nusing namespace std;\n\nint main(int argc, char* argv[]) {\n    // Write your code here\n    \n    return 0;\n}`;
      await q.save();
  }
  console.log("Updated CPP boilerplates!");
  process.exit(0);
}
run();
