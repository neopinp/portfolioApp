const { Pool } = require("pg");
require("dotenv").config(); // load env 

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

module.exports = pool;
