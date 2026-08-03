require('dotenv').config();
const db = require('./src/db');
const express = require('express');

const app = express();
app.use(express.json());

// mock auth
app.use((req, res, next) => {
  req.user = { id: 1 };
  next();
});

app.use('/summary', require('./src/routes/summary'));

app.listen(3001, async () => {
  console.log('Server started');
  try {
    const res = await fetch('http://localhost:3001/summary?month=2026-08');
    const json = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", json);
  } catch(e) {
    console.error(e);
  }
  process.exit(0);
});
