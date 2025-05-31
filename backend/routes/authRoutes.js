/* 
ROUTING LOGIC - what happens when someone hits /register
Define what endpoint (URL + HTTP) should call those LOGIN & REGISTER functions
Mini App 
*/

const express = require("express");
const router = express.Router(); // Groups related routes into one file - Can later be mounted under /api/auth
const { registerUser, loginUser } = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;
