const express = require('express');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { validateQuery } = require('../middleware/validation');
const { gitHubCallbackSchema } = require('../utils/validationSchemas');

const router = express.Router();

router.get('/github/url', authController.getGitHubAuthUrl);
router.get('/github/callback', validateQuery(gitHubCallbackSchema), authController.handleGitHubCallback);
router.get('/me', authMiddleware, authController.getCurrentUser);

module.exports = router;
