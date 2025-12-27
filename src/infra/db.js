// src/infra/db.js
/* eslint-disable */
import mysql from 'mysql2/promise';
import config from '../../config/config.js';
import { logger } from './logger.js';

export const pool = mysql.createPool(config.mysql);

export async function initMySQL() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    logger.info('Connected to MySQL database');
  } catch (error) {
    logger.error(`Failed to connect to MySQL database: ${error.message}`);
    process.exit(1);
  }
}
