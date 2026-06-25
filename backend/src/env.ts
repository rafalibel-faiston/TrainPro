import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  // Pasta do build do app web a ser servido em produção (opcional).
  webDist: process.env.WEB_DIST,
  dbFile: process.env.DB_FILE,
};
