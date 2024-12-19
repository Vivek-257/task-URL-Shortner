
const Redis = require('ioredis');

const redis = new Redis({
  port: 6379, 
  host: process.env.REDIS_URL, 
  password: process.env.REDIS_PASSWORD, 
  tls: {} 
});

redis.on('connect', () => {
  console.log('Connected to Redis');
});

redis.on('error', (err) => {
  console.error('Error connecting to Redis:', err);
});

module.exports = redis;
