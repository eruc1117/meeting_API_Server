const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/UserController');

router.get('/search', UserController.searchUsers);

module.exports = router;
