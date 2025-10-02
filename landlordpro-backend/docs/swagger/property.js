/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property management (admin only for create/update/delete)
 */

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Sunset Apartments"
 *               location:
 *                 type: string
 *                 example: "123 Main St, Kigali"
 *               description:
 *                 type: string
 *                 example: "A spacious 2-bedroom apartment"
 *     responses:
 *       201:
 *         description: Property created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties (with pagination)
 *     tags: [Properties]
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
 *         description: Number of properties per page
 *     responses:
 *       200:
 *         description: List of properties with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 50
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 properties:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                       name:
 *                         type: string
 *                         example: "Sunset Apartments"
 *                       location:
 *                         type: string
 *                         example: "123 Main St, Kigali"
 *                       description:
 *                         type: string
 *                         example: "A spacious 2-bedroom apartment"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-10-02T14:00:00.000Z"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get a property by ID
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property details
 *       404:
 *         description: Property not found
 *       401:
 *         description: Unauthorized
 * 
 *   put:
 *     summary: Update a property (admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Property updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 * 
 *   delete:
 *     summary: Delete a property (admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *       404:
 *         description: Property not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */
