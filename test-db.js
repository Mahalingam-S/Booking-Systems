const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
console.log("Testing connection to:", uri.substring(0, 30) + "...");

async function test() {
  try {
    await mongoose.connect(uri);
    console.log("SUCCESS: Connected to Atlas!");
    process.exit(0);
  } catch (err) {
    console.error("FAILURE:", err.message);
    if (err.reason) console.error("REASON:", err.reason);
    process.exit(1);
  }
}

test();
