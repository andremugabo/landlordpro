/**
 * @swagger
 * tags:
 *   name: Tenants
 *   description: Tenant management endpoints (individuals and companies)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         name:
 *           type: string
 *           description: Representative of the company or individual tenant
 *           example: "John Doe"
 *         company_name:
 *           type: string
 *           description: Name of the company, if applicable
 *           example: "Acme Corp"
 *         tin_number:
 *           type: string
 *           description: Company Tax Identification Number
 *           example: "123456789"
 *         email:
 *           type: string
 *           example: "john@example.com"
 *         phone:
 *           type: string
 *           example: "+250788123456"
 *         deletedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           example: null
 */

/**
 * @swagger
 * /api/tenants:
 *   get:
 *     summary: Get all tenants (paginated, searchable)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tenants per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, company_name, email, phone, or TIN
 *     responses:
 *       200:
 *         description: List of tenants retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tenants:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 *                 total:
 *                   type: integer
 *                   example: 45
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/tenants/{id}:
 *   get:
 *     summary: Get a tenant by ID
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Tenant ID (UUID)
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 tenant:
 *                   $ref: '#/components/schemas/Tenant'
 *       404:
 *         description: Tenant not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update a tenant completely (Admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Tenant ID to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Jane Doe"
 *               company_name:
 *                 type: string
 *                 example: "New Corp Ltd"
 *               tin_number:
 *                 type: string
 *                 example: "987654321"
 *               email:
 *                 type: string
 *                 example: "jane@example.com"
 *               phone:
 *                 type: string
 *                 example: "+250788765432"
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Tenant not found
 *   delete:
 *     summary: Soft delete a tenant (Admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Tenant ID to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant soft deleted successfully
 *       404:
 *         description: Tenant not found
 *       403:
 *         description: Forbidden (Admin only)
 */

/**
 * @swagger
 * /api/tenants/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted tenant (Admin only)
 *     tags: [Tenants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Tenant ID to restore
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tenant restored successfully
 *       403:
 *         description: Forbidden (Admin only)
 *       404:
 *         description: Tenant not found
 */
