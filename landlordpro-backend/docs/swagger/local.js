/**
 * @swagger
 * tags:
 *   name: Locals
 *   description: Local (unit) management within properties
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Local:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         reference_code:
 *           type: string
 *           example: "LOC-101"
 *         status:
 *           type: string
 *           enum: ["available", "occupied", "maintenance"]
 *           example: "available"
 *         size_m2:
 *           type: number
 *           example: 45.5
 *         property_id:
 *           type: string
 *           format: uuid
 *           example: "c56a4180-65aa-42ec-a945-5fd21dec0538"
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         property:
 *           $ref: '#/components/schemas/Property'
 *     Property:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "c56a4180-65aa-42ec-a945-5fd21dec0538"
 *         name:
 *           type: string
 *           example: "Sunset Apartments"
 *         location:
 *           type: string
 *           example: "Kigali, Rwanda"
 *         description:
 *           type: string
 *           example: "Luxury apartments in the city center"
 */

/**
 * @swagger
 * /api/locals:
 *   get:
 *     summary: Get all locals with pagination and optional property filter
 *     tags: [Locals]
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
 *         description: Number of items per page
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter locals by property ID
 *     responses:
 *       200:
 *         description: List of locals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 locals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Local'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 */

/**
 * @swagger
 * /api/locals/{id}:
 *   get:
 *     summary: Get a local by ID
 *     tags: [Locals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Local ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Local details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 local:
 *                   $ref: '#/components/schemas/Local'
 *       404:
 *         description: Local not found
 */

/**
 * @swagger
 * /api/locals:
 *   post:
 *     summary: Create a new local
 *     tags: [Locals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reference_code
 *               - property_id
 *             properties:
 *               reference_code:
 *                 type: string
 *                 example: "LOC-101"
 *               status:
 *                 type: string
 *                 enum: ["available", "occupied", "maintenance"]
 *                 example: "available"
 *               size_m2:
 *                 type: number
 *                 example: 45.5
 *               property_id:
 *                 type: string
 *                 format: uuid
 *                 example: "c56a4180-65aa-42ec-a945-5fd21dec0538"
 *     responses:
 *       201:
 *         description: Local created successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/locals/{id}:
 *   put:
 *     summary: Update a local completely
 *     tags: [Locals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Local ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reference_code:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ["available", "occupied", "maintenance"]
 *               size_m2:
 *                 type: number
 *               property_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Local updated successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/locals/{id}:
 *   patch:
 *     summary: Partially update a local
 *     tags: [Locals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Local ID
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reference_code:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: ["available", "occupied", "maintenance"]
 *               size_m2:
 *                 type: number
 *               property_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Local partially updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Local not found
 */

/**
 * @swagger
 * /api/locals/{id}:
 *   delete:
 *     summary: Soft delete a local
 *     tags: [Locals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Local ID
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Local soft deleted successfully
 *       400:
 *         description: Validation error
 */

/**
 * @swagger
 * /api/locals/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted local (Admins only)
 *     tags: [Locals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Local ID to restore
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Local restored successfully
 *       403:
 *         description: Forbidden (only admins)
 *       404:
 *         description: Local not found
 */

/**
 * @swagger
 * /api/locals/{id}/status:
 *   patch:
 *     summary: Update the status of a local
 *     tags: [Locals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the local to update
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: ["available", "occupied", "maintenance"]
 *     responses:
 *       200:
 *         description: Local status updated successfully
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Local not found
 */
