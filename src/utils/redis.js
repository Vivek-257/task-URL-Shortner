

const { createClient } = require('redis');

const redisClient = createClient({
  socket: {
    host: 'localhost', 
    port: 6379,        
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
