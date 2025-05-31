/* 
AUTH CHECKING FOR ACCESS 
verifying that the generated token is associated with the header of the user's request 
*/

const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // returns undefined instead of crashing

  if (!token) {
    return res.status(401).json({ error: "No Token Found." });
  }

  try {
    // DECRYPTS the token using JWT_SECRET (checks if MY KEY created this)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // attach user data to the request
    next(); // move on from the request
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
};

module.exports = verifyToken;
