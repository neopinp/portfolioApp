/* MAIN FILE - ENTRY POINT */

require("dotenv").config(); // import
const express = require("express"); // load routes
const cors = require("cors"); // load middleware
const pool = require("./backend/db"); // db connection

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
