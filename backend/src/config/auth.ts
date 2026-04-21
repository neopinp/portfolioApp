export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
  jwtExpiresIn: 3600, 
  bcryptSaltRounds: 10,
  passwordMinLength: 8,
  passwordMaxLength: 100
};
