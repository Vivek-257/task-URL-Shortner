
const { getDatabase } = require('../utils/db.js');
const crypto = require('crypto');

const generateAlias = () => crypto.randomBytes(4).toString('hex');


exports.shortenUrl = async (req, res) => {
    const db = getDatabase();
    const { longUrl, alias, topic } = req.body;
  
    if (!longUrl) {
      return res.render('index', { 
        shortUrl: null, 
        error: 'Long URL is required', 
        userId: req.user?.id 
      });
    }
  
    try {
      const shortAlias = alias || generateAlias();
  
      const existing = await db.collection('shortUrls').findOne({ alias: shortAlias });
      if (existing) {
        return res.render('index', { 
          shortUrl: null, 
          error: 'Alias already in use', 
          userId: req.user?.id 
        });
      }
  
      await db.collection('shortUrls').insertOne({
        longUrl,
        alias: shortAlias,
        topic: topic || 'general',
        createdAt: new Date(),
      });
  
      const shortUrl = `http://localhost:3000/api/${shortAlias}`;
      const analyticsUrl = `http://localhost:3000/api/analytics/${shortAlias}`;
  
      res.render('index', { 
        shortUrl, 
        analyticsUrl,   
        error: null, 
        userId: req.user?.id 
      });
    } catch (error) {
      console.error(error);
      res.render('index', { 
        shortUrl: null, 
        error: 'Internal server error', 
        userId: req.user?.id 
      });
    }
  };
  

exports.redirectUrl = async (req, res) => {
    const db = getDatabase();
    const { alias } = req.params;
  
    try {
      const urlData = await db.collection('shortUrls').findOne({ alias });
  
      if (!urlData) {
        return res.status(404).json({ error: 'URL not found' });
      }
  
    
      const clickInfo = {
        timestamp: new Date(),
        ip: req.ip, 
        userAgent: req.headers['user-agent'], 
      };
  
      await db.collection('shortUrls').updateOne(
        { alias },
        {
          $inc: { clicks: 1 }, 
          $push: { clickData: clickInfo }, 
        }
      );
  
      res.redirect(urlData.longUrl);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  exports.getAnalytics = async (req, res) => {
    const db = getDatabase();
    const { alias } = req.params;
  
    try {
      const urlData = await db.collection('shortUrls').findOne({ alias });
  
      if (!urlData) {
        return res.status(404).json({ error: 'URL not found' });
      }
  
      res.json({
        alias: urlData.alias,
        longUrl: urlData.longUrl,
        clicks: urlData.clicks,
        clickData: urlData.clickData,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  