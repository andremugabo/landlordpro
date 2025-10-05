const express = require('express');
const router = express.Router();
const localController = require('../controllers/localController');
const { authenticate, adminOnly } = require('../middleware/authMiddleware');

// Locals
router.get('/locals', authenticate, localController.getAllLocals);            
router.get('/locals/:id', authenticate, localController.getLocalById);       
router.post('/locals', authenticate, localController.createLocal);            

// Update a local (full update with PUT, partial update with PATCH)
router.put('/locals/:id', authenticate, localController.updateLocal);         
router.patch('/locals/:id', authenticate, localController.updateLocal);       

// Soft delete a local
router.delete('/locals/:id', authenticate, localController.deleteLocal);      

// Admin-only: restore a soft-deleted local
router.patch('/locals/:id/restore', authenticate, adminOnly, localController.restoreLocal);


router.patch('/locals/:id/status', authenticate, localController.updateLocalStatus);


module.exports = router;
