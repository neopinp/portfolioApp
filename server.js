/* 
MAIN FILE - ENTRY POINT - ROUTER REGISTRATION  
Imports the route definitions and links them into the app 
*/

require("dotenv").config(); // import
const express = require("express"); // load routes
const cors = require("cors"); // load middleware
const pool = require("./backend/db"); // db connection
const authRoutes = require("./backend/routes/authRoutes");

const app = express();
app.use(cors()); // allow frontend access
app.use(express.json()); // parse incoming JSON
app.use("/api/auth", authRoutes); // mount all related auth related routes under /api/auth

// testing db connection
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});
// tell Express to listen or fallback to 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



/* TESTING JWT VERIFICATION */
const verifyToken = require("./backend/middleware/authMiddleware");

app.get("/api/protected", verifyToken, (req, res) => {
  res.json({ message: "Access granted", user: req.user });
});
