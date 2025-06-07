import axios from 'axios';

export const aiService = axios.create({
  baseURL: process.env.AI_SERVICE_URL || 'http://localhost:8000',
});
