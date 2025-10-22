const express = require('express');
const router = express.Router();
const localController = require('../controllers/localController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// ✅ Get all locals (any authenticated user)
router.get('/locals', authenticate, localController.getAllLocals);

// ✅ Get a single local by ID (any authenticated user)
router.get('/locals/:id', authenticate, localController.getLocalById);

// ✅ Create a new local (admin only)
router.post('/locals', authenticate, adminOnly, localController.createLocal);

// ✅ Update a local (PUT = full update, PATCH = partial update) (admin only)
router.put('/locals/:id', authenticate, adminOnly, localController.updateLocal);
router.patch('/locals/:id', authenticate, adminOnly, localController.updateLocal);

// ✅ Soft delete a local (admin only)
router.delete('/locals/:id', authenticate, adminOnly, localController.deleteLocal);

// ✅ Restore a soft-deleted local (admin only)
router.patch('/locals/:id/restore', authenticate, adminOnly, localController.restoreLocal);

// ✅ Update local status (available to authenticated users, optional adminOnly)
router.patch('/locals/:id/status', authenticate, localController.updateLocalStatus);

module.exports = router;
