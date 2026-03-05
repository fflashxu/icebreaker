import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '3100', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DASHSCOPE_API_KEY: process.env.DASHSCOPE_API_KEY || '',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5200',
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads'),
  DATA_DIR: path.resolve(__dirname, '../data'),
};
