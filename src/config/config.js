// src/config/config.js
require('dotenv').config();

module.exports = {
  imap: {
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT, 10),
    tls: true,
    tlsOptions: { rejectUnauthorized: false }
  },
  mongodbUri: process.env.MONGODB_URI,
  port: process.env.POR || 3000,
};
