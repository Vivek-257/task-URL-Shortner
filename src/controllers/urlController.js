const { getDatabase } = require('../utils/db.js');
const crypto = require('crypto');

// Utility to generate a random alias
const generateAlias = () => crypto.randomBytes(4).toString('hex');
// Controller to handle URL shortening
exports.shortenUrl = async (req, res) => {
  const db = getDatabase();
  const { longUrl, alias, topic } = req.body;



  if (!longUrl) {
    return res.status(400).json({ error: 'Long URL is required' });
  }

  try {
    // Check if alias is unique
    if (alias) {
      const existing = await db.collection('shortUrls').findOne({ alias });
      if (existing) {
        return res.status(400).json({ error: 'Alias already in use' });
      }
    }
    console.log('Before Assignment:');
    console.log('Alias:', alias);
    console.log('Custom Alias:', req.body.customAlias);
    console.log('req.body:', req.body);
    
    const shortAlias = alias || generateAlias();

    await db.collection('shortUrls').insertOne({
      longUrl,
      alias: shortAlias,
      topic: topic || 'general',
      createdAt: new Date(),
    });

    res.status(201).json({
      message: 'URL shortened successfully',
      shortUrl: `http://localhost:3000/api/${shortAlias}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Controller to handle redirection
exports.redirectUrl = async (req, res) => {
  const db = getDatabase();
  const { alias } = req.params;
  console.log(`Looking for alias: ${alias}`); 

  try {
    const urlData = await db.collection('shortUrls').findOne({ alias });
console.log("found", urlData)
    if (!urlData) {
      return res.status(404).json({ error: 'URL not found' });
    }

    res.redirect(urlData.longUrl);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
