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
 *         vat_rate:
 *           type: number
 *           example: 18
 *         vat_amount:
 *           type: number
 *           example: 27000
 *         proof:
 *           type: string
 *           nullable: true
 *           example: "/uploads/expenses/b123a7b2-9c41-4f31-b8a4-5c8e2e1c9b33/proof.pdf"
 *         property_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         local_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         payment_status:
 *           type: string
 *           example: "pending"
 *         payment_date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         payment_method:
 *           type: string
 *           nullable: true
 *         due_date:
 *           type: string
 *           format: date
 *           nullable: true
 *         approved_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         approval_date:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created_by:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         notes:
 *           type: string
 *           nullable: true
 *         reference_number:
 *           type: string
 *           nullable: true
 *         vendor_name:
 *           type: string
 *           nullable: true
 *         vendor_contact:
 *           type: string
 *           nullable: true
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
 *         name: paymentStatus
 *         schema:
 *           type: string
 *         description: Filter by payment status (paid, pending, overdue)
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *         description: Filter by currency
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenses from this date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter expenses up to this date
 *       - in: query
 *         name: minAmount
 *         schema:
 *           type: number
 *         description: Minimum expense amount
 *       - in: query
 *         name: maxAmount
 *         schema:
 *           type: number
 *         description: Maximum expense amount
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by description, vendor name, or reference number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 50
 *         description: Limit number of results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           example: 0
 *         description: Offset for pagination
 *       - in: query
 *         name: includeDeleted
 *         schema:
 *           type: boolean
 *         description: Include soft-deleted expenses
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
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Expense'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     offset:
 *                       type: integer
 *                       example: 0
 *                     pages:
 *                       type: integer
 *                       example: 2
 *                     currentPage:
 *                       type: integer
 *                       example: 1
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
 *         description: Expense ID
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
 *               vat_rate:
 *                 type: number
 *               vat_amount:
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
 *         description: Expense ID
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
 *               vat_rate:
 *                 type: number
 *               vat_amount:
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
 * /api/expenses/overdue:
 *   get:
 *     summary: Get all overdue expenses
 *     tags: [Expenses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *     responses:
 *       200:
 *         description: List of overdue expenses
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
 *                 count:
 *                   type: integer
 */

/**
 * @swagger
 * /api/expenses/summary:
 *   get:
 *     summary: Get expense summary/statistics
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
 *     responses:
 *       200:
 *         description: Expense summary with totals, counts, and breakdowns
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
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
