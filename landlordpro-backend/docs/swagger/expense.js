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
 *         vatRate:
 *           type: number
 *           example: 18
 *         vatAmount:
 *           type: number
 *           example: 27000
 *         proof:
 *           type: string
 *           nullable: true
 *           example: "/uploads/expenses/b123a7b2-9c41-4f31-b8a4-5c8e2e1c9b33/proof.pdf"
 *         propertyId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         localId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         paymentStatus:
 *           type: string
 *           example: "pending"
 *         paymentDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         paymentMethod:
 *           type: string
 *           nullable: true
 *         dueDate:
 *           type: string
 *           format: date
 *           nullable: true
 *         approvedBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         approvalDate:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdBy:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         referenceNumber:
 *           type: string
 *           nullable: true
 *         vendorName:
 *           type: string
 *           nullable: true
 *         vendorContact:
 *           type: string
 *           nullable: true
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
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: localId
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: paymentStatus
 *         schema:
 *           type: string
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of expenses with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *                     currentPage:
 *                       type: integer
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
 *                 data:
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
 *               vatRate:
 *                 type: number
 *               vatAmount:
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
 *       201:
 *         description: Expense created successfully
 *       400:
 *         description: Validation or upload error
 */

/**
 * @swagger
 * /api/expenses/{id}:
 *   put:
 *     summary: Update an expense (with optional new proof upload)
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
 *               vatRate:
 *                 type: number
 *               vatAmount:
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
 *     responses:
 *       200:
 *         description: Expense deleted successfully
 *       403:
 *         description: Forbidden
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
 *     responses:
 *       200:
 *         description: Expense restored successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Expense not found
 */

/**
 * @swagger
 * /api/expenses/bulk/payment-status:
 *   patch:
 *     summary: Bulk update payment status of multiple expenses (Admins only)
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
 *               - expenseIds
 *               - paymentStatus
 *             properties:
 *               expenseIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *               paymentStatus:
 *                 type: string
 *               paymentDate:
 *                 type: string
 *                 format: date
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment status updated successfully
 */

/**
 * @swagger
 * /api/expenses/{id}/approve:
 *   patch:
 *     summary: Approve an expense (Admins only)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - approvedBy
 *             properties:
 *               approvedBy:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Expense approved successfully
 *       403:
 *         description: Forbidden
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
