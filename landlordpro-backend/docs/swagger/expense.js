/**
 * @swagger
 * tags:
 *   name: Expenses
 *   description: Expense management for tracking costs related to properties or locals
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
 *         propertyId:
 *           type: string
 *           format: uuid
 *           example: "a8b5d15c-2ef4-4f1b-a2c8-2e1b9b76f55d"
 *         localId:
 *           type: string
 *           format: uuid
 *           example: "f3a6b8d2-9f44-4e5a-aab8-ef8a6c31b22c"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
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
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of expenses per page
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
 *     responses:
 *       200:
 *         description: List of expenses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 expenses:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
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
 *                 expense:
 *                   $ref: '#/components/schemas/Expense'
 *       404:
 *         description: Expense not found
 */

/**
 * @swagger
 * /api/expenses:
 *   post:
 *     summary: Create a new expense
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - category
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
 *               propertyId:
 *                 type: string
 *                 format: uuid
 *                 example: "f3a6b8d2-9f44-4e5a-aab8-ef8a6c31b22c"
 *               localId:
 *                 type: string
 *                 format: uuid
 *                 example: "a8b5d15c-2ef4-4f1b-a2c8-2e1b9b76f55d"
 *     responses:
 *       201:
 *         description: Expense created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an existing expense
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Expense'
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
 *     summary: Delete an expense (Admins only)
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
 *         description: Expense deleted successfully
 *       403:
 *         description: Forbidden (Admins only)
 *       404:
 *         description: Expense not found
 */
