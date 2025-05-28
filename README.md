# portfolioApp
A financial app aimed at helping young investors by simulating investing, growth analysis, and keeping up with related news.

## Initializing / Installing Dependencies 
npm init -y 
npm install epxress pg bcrypt jsonwebtoken dotenv cors
npm install --save-dev nodemon 

express - web server and routes (API endpoints)
pg - PostgreSQL 
bcrypt - Hashes passwords securely (registration/login)
jswonwebtoken - creates and verifies JWT for user authentication
cors - enables Cross-Origin Resource Sharing (Allow API requests to the backend)
nodemon - restarts server on file changes (for developement)


## Developement
npm start - production mode
npm run dev - development mode 