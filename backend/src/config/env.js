require('dotenv').config({ quiet: true });

const nodeEnv = process.env.NODE_ENV || 'development';

function required(name, fallbackForNonProd) {
  const value = process.env[name];
  if (value) return value;
  if (nodeEnv === 'production') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return fallbackForNonProd;
}

const config = {
  nodeEnv,
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || '*',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'medicheck',
    connectionLimit: 10,
  },

  dbDriver: process.env.DB_DRIVER || 'mysql',
  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB || 'medicheck',
  },

  ocr: {
    apiKey: process.env.OCR_API_KEY || '',
  },

  jwt: {
    secret: required('JWT_SECRET', 'dev-only-secret-change-me-dev-only-secret'),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
};

module.exports = config;
