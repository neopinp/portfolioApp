# portfolioApp
Full-Stack TypeScript app with Expo React Native frontend and Node.js + Express backend. Implements JWT authentication, RESTful APIs, PosgreSQL + Prisma ORM, and protfolio value simulation logic with historical price caching. 

MVP:
Authentication
Portfolio Summary
Projections
Risk Aversion Analysis

Extra Features:
Leaderboard
Profiles / Friends / Messaging 
News Feed 
Recommended Allocation of Funds 


## Initializing / Installing Dependencies 
npm init -y 
npm install epxress pg bcrypt jsonwebtoken dotenv cors 
npm install --save-dev nodemon 
npm install prisma --save-dev 
npm install @prisma/client 
npm prisma init 
npx prisma generate  

express - web server and routes (API endpoints) 
pg - PostgreSQL 
bcrypt - Hashes passwords securely (registration/login) 
jswonwebtoken - creates and verifies JWT for user authentication 
cors - enables Cross-Origin Resource Sharing (Allow API requests to the backend) 
React Native  
Expo  

## Backend - Developement
npm run dev - development mode 
npx ngrok http 5000

## Frontend - Development View  
npm expo start --tunnel (ethernet + wifi) 
