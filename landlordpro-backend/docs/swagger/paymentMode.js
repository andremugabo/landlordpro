/**
 * @swagger
 * tags:
 *   name: PaymentModes
 *   description: Payment mode management (e.g., cash, mobile money, bank transfer)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "d290f1ee-6c54-4b01-90e6-d701748f0851"
 *         code:
 *           type: string
 *           example: "MOMO"
 *           description: Short code for the payment mode
 *         displayName:
 *           type: string
 *           example: "Mobile Money"
 *           description: Friendly display name
 *         requiresProof:
 *           type: boolean
 *           example: true
 *           description: Whether a proof of payment is required
 *         description:
 *           type: string
 *           example: "Payments made via mobile money"
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     PaymentModeInput:
 *       type: object
 *       required:
 *         - code
 *         - displayName
 *       properties:
 *         code:
 *           type: string
 *           example: "BANK"
 *         displayName:
 *           type: string
 *           example: "Bank Transfer"
 *         requiresProof:
 *           type: boolean
 *           example: false
 *         description:
 *           type: string
 *           example: "Payments made via bank transfer"
 */

/**
 * @swagger
 * /api/payment-modes:
 *   get:
 *     summary: Get all payment modes
 *     tags: [PaymentModes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment modes
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
 *                     $ref: '#/components/schemas/PaymentMode'
 *   post:
 *     summary: Create a new payment mode
 *     tags: [PaymentModes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentModeInput'
 *     responses:
 *       201:
 *         description: Payment mode created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/payment-modes/{id}:
 *   get:
 *     summary: Get a payment mode by ID
 *     tags: [PaymentModes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment mode ID
 *     responses:
 *       200:
 *         description: Payment mode details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 paymentMode:
 *                   $ref: '#/components/schemas/PaymentMode'
 *       404:
 *         description: Payment mode not found
 *   put:
 *     summary: Update a payment mode
 *     tags: [PaymentModes]
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
 *             $ref: '#/components/schemas/PaymentModeInput'
 *     responses:
 *       200:
 *         description: Payment mode updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Payment mode not found
 *   delete:
 *     summary: Delete a payment mode
 *     tags: [PaymentModes]
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
 *       204:
 *         description: Payment mode deleted successfully
 *       404:
 *         description: Payment mode not found
 */
