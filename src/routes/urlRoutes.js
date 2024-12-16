const express = require('express');
const { shortenUrl, redirectUrl, getAnalytics } = require('../controllers/urlController.js');
const { isAuth } = require('../middlewares/auth.js');
const router = express.Router();

router.post('/shorten',isAuth, shortenUrl);

router.get('/:alias',isAuth, redirectUrl);

router.get('/analytics/:alias', getAnalytics);
module.exports = router;
