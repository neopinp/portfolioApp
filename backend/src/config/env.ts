// init env before importing prisma 
import path from "path";
import { existsSync } from "fs";
import dotenv from "dotenv";

const candidates = [
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../../../.env"),
];

for (const envPath of candidates) {
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

