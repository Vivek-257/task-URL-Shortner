

const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST, 
    port: process.env.REDIS_PORT,        
  },
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

(async () => {
  try {
    await redisClient.connect();
    console.log('Redis client connected successfully');
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
  }
})();

module.exports = redisClient;
