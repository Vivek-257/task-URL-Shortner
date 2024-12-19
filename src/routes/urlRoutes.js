const express = require('express');
const { shortenUrl, redirectUrl, getAnalytics, getTopicAnalytics } = require('../controllers/urlController.js');
const { isAuth } = require('../middlewares/auth.js');
const router = express.Router();

router.post('/shorten',isAuth, shortenUrl);

router.get('/:alias',isAuth, redirectUrl);

router.get('/analytics/:alias', getAnalytics);

router.get('/api/analytics/topic/:topic', getTopicAnalytics);

module.exports = router;
