import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  CLIENT_URL: process.env.CLIENT_URL,
  ADMIN_URL: process.env.ADMIN_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,

  SSL_STORE_ID:      process.env.SSL_STORE_ID,
  SSL_STORE_PASS:    process.env.SSL_STORE_PASS,
  SSL_IS_LIVE:       process.env.SSL_IS_LIVE || 'false',
  SSL_SUCCESS_URL:   process.env.SSL_SUCCESS_URL,
  SSL_FAIL_URL:      process.env.SSL_FAIL_URL,
  SSL_CANCEL_URL:    process.env.SSL_CANCEL_URL,
  SSL_IPN_URL:       process.env.SSL_IPN_URL,

  BKASH_BASE_URL:    process.env.BKASH_BASE_URL,
  BKASH_APP_KEY:     process.env.BKASH_APP_KEY,
  BKASH_APP_SECRET:  process.env.BKASH_APP_SECRET,
  BKASH_USERNAME:    process.env.BKASH_USERNAME,
  BKASH_PASSWORD:    process.env.BKASH_PASSWORD,
  BKASH_CALLBACK_URL:process.env.BKASH_CALLBACK_URL,
  
  PATHAO_BASE_URL:    process.env.PATHAO_BASE_URL,
  PATHAO_CLIENT_ID:   process.env.PATHAO_CLIENT_ID,
  PATHAO_CLIENT_SECRET: process.env.PATHAO_CLIENT_SECRET,
  PATHAO_USERNAME:    process.env.PATHAO_USERNAME,
  PATHAO_PASSWORD:    process.env.PATHAO_PASSWORD,

  STEADFAST_BASE_URL: process.env.STEADFAST_BASE_URL,
  STEADFAST_API_KEY:  process.env.STEADFAST_API_KEY,
  STEADFAST_SECRET_KEY: process.env.STEADFAST_SECRET_KEY,

  FRAUDBD_BASE_URL: process.env.FRAUDBD_BASE_URL,
  FRAUDBD_API_KEY: process.env.FRAUDBD_API_KEY,

};