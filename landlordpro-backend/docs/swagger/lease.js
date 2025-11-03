/**
 * @swagger
 * tags:
 *   name: Leases
 *   description: Lease management for tenants and locals
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Lease:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: d290f1ee-6c54-4b01-90e6-d701748f0851
 *         reference:
 *           type: string
 *           example: "LEASE-JOHN-DOE"
 *           description: Auto-generated lease reference (LEASE-NAME-OF-THE-TENANT)
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: 2025-10-05T10:00:00Z
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: 2026-10-05T10:00:00Z
 *         leaseAmount:
 *           type: number
 *           format: decimal
 *           example: 750000.00
 *           description: Monthly lease amount or rent value
 *         status:
 *           type: string
 *           enum: [active, expired, cancelled]
 *           example: active
 *         localId:
 *           type: string
 *           format: uuid
 *           example: f47ac10b-58cc-4372-a567-0e02b2c3d479
 *         tenantId:
 *           type: string
 *           format: uuid
 *           example: c56a4180-65aa-42ec-a945-5fd21dec0538
 *         tenant:
 *           $ref: '#/components/schemas/Tenant'
 *         local:
 *           $ref: '#/components/schemas/Local'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 * 
 *     LeaseInput:
 *       type: object
 *       required:
 *         - startDate
 *         - endDate
 *         - leaseAmount
 *         - localId
 *         - tenantId
 *       properties:
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: 2025-10-05T10:00:00Z
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: 2026-10-05T10:00:00Z
 *         leaseAmount:
 *           type: number
 *           format: decimal
 *           example: 500000.00
 *           description: Agreed lease amount (monthly or total)
 *         status:
 *           type: string
 *           enum: [active, expired, cancelled]
 *           example: active
 *         localId:
 *           type: string
 *           format: uuid
 *         tenantId:
 *           type: string
 *           format: uuid
 */

/**
 * @swagger
 * /api/leases:
 *   get:
 *     summary: Get all leases (paginated, optionally filtered by status)
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, expired, cancelled]
 *         description: Filter leases by status
 *     responses:
 *       200:
 *         description: List of leases retrieved successfully
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
 *                     $ref: '#/components/schemas/Lease'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *       403:
 *         description: Forbidden (manager trying to access unauthorized leases)
 *       500:
 *         description: Internal server error
 * 
 *   post:
 *     summary: Create a new lease
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaseInput'
 *     responses:
 *       201:
 *         description: Lease created successfully (reference auto-generated)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 lease:
 *                   $ref: '#/components/schemas/Lease'
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/leases/{id}:
 *   get:
 *     summary: Get lease by ID
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Lease ID
 *     responses:
 *       200:
 *         description: Lease details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 lease:
 *                   $ref: '#/components/schemas/Lease'
 *       403:
 *         description: Forbidden (manager trying to access unauthorized lease)
 *       404:
 *         description: Lease not found
 *
 *   put:
 *     summary: Update a lease by ID
 *     tags: [Leases]
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
 *             $ref: '#/components/schemas/LeaseInput'
 *     responses:
 *       200:
 *         description: Lease updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 lease:
 *                   $ref: '#/components/schemas/Lease'
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden (manager trying to update unauthorized lease)
 *       404:
 *         description: Lease not found
 *
 *   delete:
 *     summary: Soft-delete a lease by ID
 *     tags: [Leases]
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
 *         description: Lease soft-deleted successfully
 *       403:
 *         description: Forbidden (manager trying to delete unauthorized lease)
 *       404:
 *         description: Lease not found
 */

/**
 * @swagger
 * /api/report/pdf:
 *   get:
 *     summary: Download a PDF report of all leases
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF report generated successfully
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/leases/trigger-expired:
 *   post:
 *     summary: Manually mark expired leases (admin only)
 *     tags: [Leases]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired leases updated successfully
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
 *                   example: "3 lease(s) marked as expired."
 *       403:
 *         description: Forbidden (admin only)
 *       500:
 *         description: Internal server error
 */
