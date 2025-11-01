/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Manage and track property- or local-related expenses with proof uploads
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Expense:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "b123a7b2-9c41-4f31-b8a4-5c8e2e1c9b33"
 *         amount:
 *           type: number
 *           example: 150000
 *         category:
 *           type: string
 *           example: "Repairs"
 *         description:
 *           type: string
 *           example: "Fixed plumbing issues in Block A"
 *         date:
 *           type: string
 *           format: date
 *           example: "2025-10-06"
 *         vat:
 *           type: number
 *           example: 18
 *         proof:
 *           type: string
 *           example: "/uploads/expenses/b123a7b2-9c41-4f31-b8a4-5c8e2e1c9b33/proof.pdf"
 *         propertyId:
 *           type: string
 *           format: uuid
 *           example: "a8b5d15c-2ef4-4f1b-a2c8-2e1b9b76f55d"
 *         localId:
 *           type: string
 *           format: uuid
 *           example: "f3a6b8d2-9f44-4e5a-aab8-ef8a6c31b22c"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/expenses:
 *   get:
 *     summary: Get all expenses with optional filters
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by property ID
 *       - in: query
 *         name: localId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by local ID
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by specific date
 *     responses:
 *       200:
 *         description: List of all expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 expenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 */

/**
 * @swagger
 * /api/expenses/{id}:
 *   get:
 *     summary: Get a single expense by ID
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Expense ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Expense details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       404:
 *         description: Expense not found
 */

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense (with optional proof upload)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - category
 *               - date
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 250000
 *               category:
 *                 type: string
 *                 example: "Maintenance"
 *               description:
 *                 type: string
 *                 example: "Painting common area walls"
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-10-06"
 *               vat:
 *                 type: number
 *                 example: 18
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *               localId:
 *                 type: string
 *                 format: uuid
 *               proof:
 *                 type: string
 *                 format: binary
 *                 description: Upload an image or PDF as proof
 *     responses:
 *       201:
 *         description: Expense created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Expense created successfully"
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       400:
 *         description: Validation or upload error
 */

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an existing expense (with optional new proof upload)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Expense ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               vat:
 *                 type: number
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *               localId:
 *                 type: string
 *                 format: uuid
 *               proof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Expense updated successfully
 *       404:
 *         description: Expense not found
 */

/**
 * @swagger
 * /api/expenses/{id}:
 *   delete:
 *     summary: Soft delete an expense (Admins only)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       403:
 *         description: Forbidden (Admins only)
 *       404:
 *         description: Expense not found
 */

/**
 * @swagger
 * /api/expenses/{id}/restore:
 *   patch:
 *     summary: Restore a previously deleted expense (Admins only)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Expense ID
 *     responses:
 *       200:
 *         description: Expense restored successfully
 *       403:
 *         description: Forbidden (Admins only)
 *       404:
 *         description: Expense not found
 */

/**
 * @swagger
 * /api/expenses/{expenseId}/proof/{filename}:
 *   get:
 *     summary: Retrieve uploaded proof file (image or PDF)
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: expenseId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns the uploaded proof file
 *       404:
 *         description: Proof file not found
 */
