const express = require('express');
const { fetchEmails, searchEmails } = require('../controllers/emailController');

const router = express.Router();

router.post('/fetch', fetchEmails);
// router.post('/search', searchEmails);

module.exports = router;
