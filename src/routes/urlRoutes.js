const express = require('express');
const { shortenUrl, redirectUrl } = require('../controllers/urlController.js');
const router = express.Router();

router.post('/shorten', shortenUrl);

router.get('/:alias', redirectUrl);

module.exports = router;
