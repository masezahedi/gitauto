const simpleGit = require('simple-git');
const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');
require('dotenv').config();

// Use persistent path from environment or default to ./repos
const REPO_STORAGE_PATH = process.env.REPO_STORAGE_PATH || path.join(__dirname, '../../..', 'repos');

class GitOperations {
  async cloneOrPull(repoUrl, repoName, accessToken) {
    try {
      const repoPath = path.join(REPO_STORAGE_PATH, repoName);
      
      // Ensure storage directory exists
      await fs.mkdir(REPO_STORAGE_PATH, { recursive: true });
      logger.info('Repository storage path', { REPO_STORAGE_PATH, repoPath });

      const git = simpleGit();
      
      // Add authentication to URL
      const authenticatedUrl = repoUrl.replace(
        'https://',
        `https://x-access-token:${accessToken}@`
      );

      if (await this.pathExists(repoPath)) {
        // Pull existing repo
        logger.info('Pulling existing repository', { repoName, repoPath });
        const repo = simpleGit(repoPath);
        await repo.pull();
      } else {
        // Clone new repo
        logger.info('Cloning new repository', { repoName, repoPath });
        await git.clone(authenticatedUrl, repoPath);
      }

      logger.info('Repository ready', { repoName, repoPath });
      return repoPath;
    } catch (error) {
      logger.error('Git clone/pull failed', { repoName, error: error.message });
      throw new Error(`Git clone/pull failed: ${error.message}`);
    }
  }

  async appendToFile(repoPath, filePath, content) {
    try {
      const fullPath = path.join(repoPath, filePath);
      const dirPath = path.dirname(fullPath);

      // Create directory if it doesn't exist
      await fs.mkdir(dirPath, { recursive: true });
      logger.info('Appending to file', { filePath, fullPath });

      // Check if file exists
      const fileExists = await this.pathExists(fullPath);

      if (fileExists) {
        // Append to existing file
        logger.debug('Appending to existing file', { filePath });
        await fs.appendFile(fullPath, '\n' + content);
      } else {
        // Create new file
        logger.debug('Creating new file', { filePath });
        await fs.writeFile(fullPath, content);
      }

      logger.info('Content appended successfully', { filePath });
      return true;
    } catch (error) {
      logger.error('Failed to append to file', { filePath, error: error.message });
      throw new Error(`Failed to append to file: ${error.message}`);
    }
  }

  async commit(repoPath, fileName, commitMessage, userName, userEmail) {
    try {
      logger.info('Committing changes', { fileName, commitMessage, userName });
      const repo = simpleGit(repoPath);
      
      // Configure git user for THIS repository
      await repo.raw(['config', 'user.name', userName]);
      await repo.raw(['config', 'user.email', userEmail]);
      logger.debug('Git user configured', { userName, userEmail });
      
      // Stage the file
      await repo.add(fileName);
      logger.debug('File staged', { fileName });

      // Commit with user info
      const authorString = `${userName} <${userEmail}>`;
      const result = await repo.commit(commitMessage, {
        '--author': authorString,
      });

      logger.info('Commit successful', { fileName, hash: result.commit });
      return result;
    } catch (error) {
      logger.error('Git commit failed', { fileName, error: error.message });
      throw new Error(`Git commit failed: ${error.message}`);
    }
  }

  async push(repoPath, branch = 'main') {
    try {
      logger.info('Pushing to remote', { branch });
      const repo = simpleGit(repoPath);
      await repo.push('origin', branch);
      logger.info('Push successful', { branch });
      return true;
    } catch (error) {
      logger.error('Git push failed', { branch, error: error.message });
      throw new Error(`Git push failed: ${error.message}`);
    }
  }

  async pathExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async executeAutomation(repoPath, repoUrl, automation, accessToken, commitMessage, userName, userEmail) {
    try {
      const { file_path, content_to_add } = automation;

      // Append content to file
      await this.appendToFile(repoPath, file_path, content_to_add);

      // Commit changes with user info
      await this.commit(repoPath, file_path, commitMessage, userName, userEmail);

      // Push to remote
      await this.push(repoPath);

      return {
        success: true,
        message: 'Automation executed successfully',
      };
    } catch (error) {
      throw new Error(`Automation execution failed: ${error.message}`);
    }
  }

  async cleanupRepo(repoPath) {
    try {
      logger.info('Cleaning up repository', { repoPath });
      await fs.rm(repoPath, { recursive: true, force: true });
      logger.info('Repository cleaned up successfully', { repoPath });
    } catch (error) {
      logger.error('Failed to cleanup repo', { repoPath, error: error.message });
    }
  }
}

module.exports = new GitOperations();
