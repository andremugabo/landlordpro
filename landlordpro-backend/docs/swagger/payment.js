/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment history and management
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Payment:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         amount:
 *           type: number
 *           format: double
 *           example: 250.50
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: "2025-10-01T00:00:00.000Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: "2025-10-31T23:59:59.999Z"
 *         invoiceNumber:
 *           type: string
 *           example: "INV-20251006-001"
 *         proofUrl:
 *           type: string
 *           nullable: true
 *           example: "/uploads/payments/f47ac10b-58cc-4372-a567-0e02b2c3d479/proof.jpg"
 *         leaseId:
 *           type: string
 *           format: uuid
 *           example: "c56a4180-65aa-42ec-a945-5fd21dec0538"
 *         paymentModeId:
 *           type: string
 *           format: uuid
 *           example: "907e68e4-2a10-4aab-813f-97a034592fc4"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get all payments with optional search
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: term
 *         schema:
 *           type: string
 *         description: Search term (by invoice number, lease reference, etc.)
 *     responses:
 *       200:
 *         description: List of payments
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
 *                     $ref: '#/components/schemas/Payment'
 */

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get a payment by ID
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       404:
 *         description: Payment not found
 */

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create a new payment
 *     tags: [Payments]
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
 *               - leaseId
 *               - paymentModeId
 *               - startDate
 *               - endDate
 *             properties:
 *               amount:
 *                 type: number
 *                 format: double
 *                 example: 250.50
 *               leaseId:
 *                 type: string
 *                 format: uuid
 *               paymentModeId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               proof:
 *                 type: string
 *                 format: binary
 *                 description: Optional proof of payment file
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Payment'
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Update a payment (full update)
 *     tags: [Payments]
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
 *                 format: double
 *               leaseId:
 *                 type: string
 *                 format: uuid
 *               paymentModeId:
 *                 type: string
 *                 format: uuid
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               proof:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Payment updated successfully
 */

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Soft delete a payment
 *     tags: [Payments]
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
 *         description: Payment soft deleted successfully
 */

/**
 * @swagger
 * /api/payments/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted payment (Admins only)
 *     tags: [Payments]
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
 *         description: Payment restored successfully
 */

/**
 * @swagger
 * /api/payments/proof/{paymentId}/{filename}:
 *   get:
 *     summary: Get proof file for a payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
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
 *         description: File returned successfully
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */

/**
 * @swagger
 * /api/payments/notify-upcoming:
 *   post:
 *     summary: Trigger notifications for leases with payments expiring in one month (Admins only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications triggered successfully
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
 *                   example: Notifications triggered successfully
 *       403:
 *         description: Forbidden (Admin only)
 */
