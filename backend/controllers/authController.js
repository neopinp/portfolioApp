// CONTROLLERS
// Runs when a route is hit (front desk vs. person who actually does the job)

const pool = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const registerUser = async (req, res) => {
  const { email, password, username } = req.body;

  try {
    const hashed = await bcrypt.hash(password, 10);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    const result = await pool.query(
      "INSERT INTO users (email, username, password) VALUES ($1, $2, $3) RETURNING id, email, username",
      [email, username, hashed]
    );

    res.status(201).json({ message: "User registered", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      // not unique email
      res.status(400).json({ error: "Email is already in use" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

/* 
ADD CHECKING FOR EMAIL CONDITIONS (NEEDS TO FOLLOW A CERTAIN FORMAT '@' '.com') 
USERNAME BASED LOGIN 
*/

const loginUser = async (req, res) => {
  const { emailorUsername, password } = req.body;

  // check if the user exists in the database, and if so grant access
  // if user does not exist, produce an error message

  try {
    // check user
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $1",
      [emailorUsername]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid username" });
    }

    // check pswd

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // JWT_SECRET(my special key) used to allow the user to complete an action
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.status(200).json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { registerUser, loginUser };
