const express = require('express');
const repositoryController = require('../controllers/repositoryController');
const authMiddleware = require('../middleware/auth');
const { validateBody, validateParams } = require('../middleware/validation');
const { addRepositorySchema, removeRepositorySchema } = require('../utils/validationSchemas');

const router = express.Router();

router.get('/github', authMiddleware, repositoryController.getGitHubRepositories);
router.post('/', authMiddleware, validateBody(addRepositorySchema), repositoryController.addRepository);
router.get('/', authMiddleware, repositoryController.getUserRepositories);
router.delete('/:repositoryId', authMiddleware, validateParams(removeRepositorySchema), repositoryController.removeRepository);

module.exports = router;
