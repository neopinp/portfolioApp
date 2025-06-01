import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config(); // load env

const pool = new Pool({
  connectionString: process.env.DB_URL,
});

export default pool;
