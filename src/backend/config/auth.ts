export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'default-secret-key-change-in-production',
  jwtExpiresIn: 3600, // 1 hour in seconds
  bcryptSaltRounds: 10,
  passwordMinLength: 8,
  passwordMaxLength: 100
};
