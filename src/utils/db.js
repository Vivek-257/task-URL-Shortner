const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_URI
const client = new MongoClient(uri);

let db;

const connectToDatabase = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB Atlas");
    db = client.db("urlshortener"); 
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1); 
  }
};

const getDatabase = () => db;

module.exports = { connectToDatabase, getDatabase };
