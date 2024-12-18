
const { getDatabase } = require('../utils/db.js');
const crypto = require('crypto');
const redisClient=require('../utils/redis.js')
const useragent = require('useragent');
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
  
      // await db.collection('shortUrls').insertOne({
      //   longUrl,
      //   alias: shortAlias,
      //   topic: topic || 'general',
      //   createdAt: new Date(),
      // });

      await db.collection('shortUrls').insertOne({
        longUrl,
        alias: shortAlias,
        topic: topic || 'general',
        createdAt: new Date(),
        totalClicks: 0,
        uniqueUsers: [],
        clickData: [], // Array to store detailed click data
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
        const cachedLongUrl = await redisClient.get(`shortUrl:${alias}`);

        if (cachedLongUrl) {
            console.log(`[CACHE HIT] Alias: ${alias}, Long URL: ${cachedLongUrl}`);
            await logClickAnalytics(alias, req); 
            return res.redirect(cachedLongUrl);
        }

        console.log(`[CACHE MISS] Alias: ${alias}, Fetching from MongoDB`);
        const urlData = await db.collection('shortUrls').findOne({ alias });

        if (!urlData) {
            console.log(`[DB MISS] Alias: ${alias} not found in MongoDB`);
            return res.status(404).send('URL not found');
        }

        const longUrl = urlData.longUrl;

        await redisClient.setEx(`shortUrl:${alias}`, 3600, longUrl);
        console.log(`[DB HIT] Alias: ${alias}, Long URL: ${longUrl}, Cached in Redis`);

        await logClickAnalytics(alias, req);

        res.redirect(longUrl);
    } catch (error) {
        console.error('Error in redirectUrl:', error);
        res.status(500).send('Internal server error');
    }
};

const logClickAnalytics = async (alias, req) => {
    const db = getDatabase();

    try {
        const userAgent = useragent.parse(req.headers['user-agent']);
        const osType = userAgent.os.toString();
        const deviceType = userAgent.device.toString();
        const userId = req.user?.id || 'anonymous';
        const clickData = {
            user: userId,
            osType,
            deviceType,
            date: new Date().toISOString().split('T')[0], // Store date only
        };

        await db.collection('shortUrls').updateOne(
            { alias },
            {
                $inc: { totalClicks: 1 },
                $addToSet: { uniqueUsers: userId },
                $push: { clickData },
            }
        );

        console.log(`[ANALYTICS LOGGED] Alias: ${alias}, ClickData:`, clickData);
    } catch (error) {
        console.error('Error logging analytics:', error);
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
  
      const totalClicks = urlData.totalClicks;
      const uniqueClicks = new Set(urlData.uniqueUsers).size; 
      const clicksByDate = aggregateClicksByDate(urlData.clickData); 
  
      const osType = aggregateByOS(urlData.clickData);
      const deviceType = aggregateByDevice(urlData.clickData);
  
      res.json({
        alias: urlData.alias,
        longUrl: urlData.longUrl,
        totalClicks,
        uniqueClicks,
        clicksByDate,
        osType,
        deviceType,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  
  const aggregateClicksByDate = (clickData) => {
    if (!Array.isArray(clickData)) {
      console.error("Invalid clickData:", clickData);
      return []; 
    }
  
    const clicksByDate = {};
  
    clickData.forEach(({ date }) => {
      if (date) {
        clicksByDate[date] = (clicksByDate[date] || 0) + 1;
      }
    });
  
    return Object.entries(clicksByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  };
  

function aggregateByOS(clickData) {
    if (!Array.isArray(clickData)) {
      console.error("Invalid clickData in aggregateByOS:", clickData);
      return []; 
    }
  
    const osStats = {};
    clickData.forEach((click) => {
      if (click && click.osType) {
        const os = click.osType;
        if (!osStats[os]) {
          osStats[os] = { uniqueClicks: 0, uniqueUsers: new Set() };
        }
        osStats[os].uniqueClicks++;
        if (click.user) {
          osStats[os].uniqueUsers.add(click.user);
        }
      } else {
        console.warn("Invalid click entry in aggregateByOS:", click);
      }
    });
  
    return Object.keys(osStats).map((os) => ({
      osName: os,
      uniqueClicks: osStats[os].uniqueClicks,
      uniqueUsers: osStats[os].uniqueUsers.size,
    }));
  }
  
  function aggregateByDevice(clickData) {
    if (!Array.isArray(clickData)) {
      console.error("Invalid clickData in aggregateByDevice:", clickData);
      return []; 
    }
  
    const deviceStats = {};
    clickData.forEach((click) => {
      if (click && click.deviceType) {
        const device = click.deviceType;
        if (!deviceStats[device]) {
          deviceStats[device] = { uniqueClicks: 0, uniqueUsers: new Set() };
        }
        deviceStats[device].uniqueClicks++;
        if (click.user) {
          deviceStats[device].uniqueUsers.add(click.user);
        }
      } else {
        console.warn("Invalid click entry in aggregateByDevice:", click);
      }
    });
  
    return Object.keys(deviceStats).map((device) => ({
      deviceName: device,
      uniqueClicks: deviceStats[device].uniqueClicks,
      uniqueUsers: deviceStats[device].uniqueUsers.size,
    }));
  }


  exports.getTopicAnalytics = async (req, res) => {
    const db = getDatabase();
    const { topic } = req.params;
  
    try {
      const urls = await db.collection('shortUrls').find({ topic }).toArray();
  
      if (!urls.length) {
        return res.status(404).json({ error: 'No URLs found for this topic' });
      }
  
      let totalClicks = 0;
      const uniqueUsers = new Set();
      const clicksByDate = {};
      const urlsData = [];
  
      urls.forEach((url) => {
        totalClicks += url.totalClicks || 0;
  
        if (Array.isArray(url.uniqueUsers)) {
          url.uniqueUsers.forEach((user) => uniqueUsers.add(user));
        }
  
        if (Array.isArray(url.clickData)) {
          url.clickData.forEach((click) => {
            const date = click.date;
            if (!clicksByDate[date]) {
              clicksByDate[date] = 0;
            }
            clicksByDate[date]++;
          });
        }
  
        urlsData.push({
          shortUrl: `http://localhost:3000/api/${url.alias}`,
          totalClicks: url.totalClicks || 0,
          uniqueClicks: (url.uniqueUsers || []).length,
        });
      });
  
      const formattedClicksByDate = Object.keys(clicksByDate).map((date) => ({
        date,
        clickCount: clicksByDate[date],
      }));
  
      res.json({
        topic,
        totalClicks,
        uniqueClicks: uniqueUsers.size,
        clicksByDate: formattedClicksByDate,
        urls: urlsData,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  