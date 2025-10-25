const axios = require('axios');
const pool = require('../utils/db');
const encryption = require('../utils/encryption');
const logger = require('../utils/logger');
const { addRepositorySchema, removeRepositorySchema } = require('../utils/validationSchemas');

class RepositoryController {
  async getGitHubRepositories(req, res) {
    try {
      const userId = req.user.id;

      // Get user's GitHub access token
      const userQuery = 'SELECT access_token FROM users WHERE id = $1';
      const userResult = await pool.query(userQuery, [userId]);

      if (userResult.rows.length === 0) {
        logger.warn('User not found', { userId });
        return res.status(404).json({ error: 'کاربر یافت نشد' });
      }

      // Decrypt the access token
      let accessToken;
      try {
        accessToken = encryption.decrypt(userResult.rows[0].access_token);
      } catch (error) {
        logger.error('Token decryption failed', { userId, error: error.message });
        return res.status(500).json({ error: 'خطا در دسترسی به توکن' });
      }

      // Fetch repositories from GitHub
      const response = await axios.get('https://api.github.com/user/repos?per_page=100', {
        headers: { Authorization: `token ${accessToken}` },
      });

      const repositories = response.data.map((repo) => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        url: repo.html_url,
        clone_url: repo.clone_url,
      }));

      logger.info('GitHub repositories retrieved', { userId, count: repositories.length });
      res.json(repositories);
    } catch (error) {
      logger.error('GitHub API error', { userId, message: error.message });
      res.status(500).json({ error: 'خطا در دریافت مخازن GitHub' });
    }
  }

  async addRepository(req, res) {
    try {
      const userId = req.user.id;
      const { github_repo_id, repo_name, repo_full_name, repo_url } = req.body;
      // Validation is done by middleware, so data is guaranteed to be valid

      const query = `
        INSERT INTO repositories (user_id, github_repo_id, repo_name, repo_full_name, repo_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, github_repo_id) DO NOTHING
        RETURNING id, repo_name, repo_full_name;
      `;

      const result = await pool.query(query, [
        userId,
        github_repo_id,
        repo_name,
        repo_full_name,
        repo_url,
      ]);

      if (result.rows.length === 0) {
        logger.info('Repository already exists', { userId, repoId: github_repo_id });
        return res.status(400).json({ error: 'مخزن قبلاً اضافه شده است' });
      }

      logger.info('Repository added', { userId, repoName: repo_name, repoId: github_repo_id });
      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Repository addition error', { userId, message: error.message });
      res.status(500).json({ error: 'خطا در اضافه کردن مخزن' });
    }
  }

  async getUserRepositories(req, res) {
    try {
      const userId = req.user.id;

      const query = `
        SELECT id, repo_name, repo_full_name, repo_url, created_at
        FROM repositories
        WHERE user_id = $1
        ORDER BY created_at DESC;
      `;

      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'خطا در دریافت مخازن' });
    }
  }

  async removeRepository(req, res) {
    try {
      const userId = req.user.id;
      const { repositoryId } = req.params;
      // Validation is done by middleware

      const query = `
        DELETE FROM repositories
        WHERE id = $1 AND user_id = $2
        RETURNING id;
      `;

      const result = await pool.query(query, [repositoryId, userId]);

      if (result.rows.length === 0) {
        logger.warn('Repository not found for deletion', { userId, repositoryId });
        return res.status(404).json({ error: 'مخزن یافت نشد' });
      }

      logger.info('Repository deleted', { userId, repositoryId });
      res.json({ message: 'مخزن حذف شد' });
    } catch (error) {
      logger.error('Repository deletion error', { userId, repositoryId, message: error.message });
      res.status(500).json({ error: 'خطا در حذف مخزن' });
    }
  }
}

module.exports = new RepositoryController();
