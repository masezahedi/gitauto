const axios = require('axios');
const jwt = require('jsonwebtoken');
const pool = require('../utils/db');
const encryption = require('../utils/encryption');
const logger = require('../utils/logger');
require('dotenv').config();

class AuthController {
  async getGitHubAuthUrl(req, res) {
    try {
      const clientId = process.env.GITHUB_CLIENT_ID;
      const redirectUri = encodeURIComponent(process.env.GITHUB_CALLBACK_URL);
      const scope = 'repo,user';

      const authUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;

      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ error: 'خطا در دریافت URL احراز هویت' });
    }
  }

  async handleGitHubCallback(req, res) {
    try {
      const { code } = req.query;

      if (!code) {
        logger.warn('GitHub callback: No code provided');
        return res.status(400).json({ error: 'کد احراز هویت دریافت نشد' });
      }

      // Exchange code for access token
      const tokenResponse = await axios.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: process.env.GITHUB_CALLBACK_URL,
        },
        {
          headers: { Accept: 'application/json' },
        }
      );

      const { access_token, error } = tokenResponse.data;

      if (error) {
        logger.error('GitHub token exchange failed', { error });
        return res.status(400).json({ error: 'دریافت توکن ناموفق' });
      }

      // Encrypt the access token before storing
      const encryptedToken = encryption.encrypt(access_token);

      // Get user info from GitHub
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `token ${access_token}` },
      });

      const githubUser = userResponse.data;

      // Upsert user in database with encrypted token
      const query = `
        INSERT INTO users (github_id, github_username, email, name, avatar_url, access_token)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (github_id) DO UPDATE SET
          email = EXCLUDED.email,
          name = EXCLUDED.name,
          avatar_url = EXCLUDED.avatar_url,
          access_token = EXCLUDED.access_token,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id, github_username;
      `;

      const result = await pool.query(query, [
        githubUser.id,
        githubUser.login,
        githubUser.email,
        githubUser.name,
        githubUser.avatar_url,
        encryptedToken,
      ]);

      logger.info('User authenticated successfully', { githubId: githubUser.id, username: githubUser.login });

      const user = result.rows[0];

      // Create JWT token
      const jwtToken = jwt.sign(
        { id: user.id, username: user.github_username },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      // Redirect to frontend with token
      const redirectUrl = `${process.env.FRONTEND_URL}?token=${jwtToken}`;
      logger.info('User redirecting to frontend', { userId: user.id });
      res.redirect(redirectUrl);
    } catch (error) {
      logger.error('OAuth callback error', { message: error.message, stack: error.stack });
      res.status(500).json({ error: 'خطا در فرآیند احراز هویت' });
    }
  }

  async getCurrentUser(req, res) {
    try {
      const userId = req.user.id;

      const query = 'SELECT id, github_username, email, name, avatar_url, is_admin FROM users WHERE id = $1';
      const result = await pool.query(query, [userId]);

      if (result.rows.length === 0) {
        logger.warn('User not found', { userId });
        return res.status(404).json({ error: 'کاربر یافت نشد' });
      }

      logger.info('User info retrieved', { userId });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching user info', { userId: req.user.id, message: error.message });
      res.status(500).json({ error: 'خطا در دریافت اطلاعات کاربر' });
    }
  }
}

module.exports = new AuthController();
