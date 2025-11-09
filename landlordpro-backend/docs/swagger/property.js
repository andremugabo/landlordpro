/**
 * @swagger
 * tags:
 *   name: Properties
 *   description: Property management (admin only for create/update/delete; managers can view their assigned properties)
 */

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property (admin only)
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
 *               - number_of_floors
 *               - has_basement
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
 *               number_of_floors:
 *                 type: integer
 *                 example: 3
 *               has_basement:
 *                 type: boolean
 *                 example: true
 *               manager_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional manager assignment
 *     responses:
 *       201:
 *         description: Property created successfully with floors
 *       400:
 *         description: Bad request (validation error)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 *
 *   get:
 *     summary: Get all properties (with pagination; managers see assigned properties only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of properties
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID (admin or assigned manager)
 *     tags: [Properties]
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
 *         description: Property details including floors
 *       404:
 *         description: Property not found or access denied
 *       401:
 *         description: Unauthorized
 *
 *   put:
 *     summary: Update property (admin only)
 *     tags: [Properties]
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
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               number_of_floors:
 *                 type: integer
 *               has_basement:
 *                 type: boolean
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
 *     summary: Soft-delete property (admin only)
 *     tags: [Properties]
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
 *         description: Property soft-deleted successfully
 *       404:
 *         description: Property not found or access denied
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */

/**
 * @swagger
 * /api/properties/{id}/assign-manager:
 *   patch:
 *     summary: Assign a manager to a property (admin only)
 *     tags: [Properties]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Property ID to which the manager will be assigned
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - manager_id
 *             properties:
 *               manager_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the manager to assign
 *           example:
 *             manager_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *     responses:
 *       200:
 *         description: Manager assigned successfully
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
 *                   example: "Manager assigned to property successfully."
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Bad request (missing or invalid manager_id)
 *       403:
 *         description: Forbidden (admin only)
 *       404:
 *         description: Property not found
 */


/**
 * @swagger
 * /api/properties/{id}/floors:
 *   get:
 *     summary: Get all floors for a specific property
 *     tags: [Properties]
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
 *         description: List of floors for the property
 *       404:
 *         description: Property not found or access denied
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/properties/{id}/locals:
 *   get:
 *     summary: Get all locals for a specific property
 *     tags: [Properties]
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
 *         description: List of locals for the property
 *       404:
 *         description: Property not found or access denied
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Property:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         location:
 *           type: string
 *         description:
 *           type: string
 *         number_of_floors:
 *           type: integer
 *         has_basement:
 *           type: boolean
 *         manager_id:
 *           type: string
 *           format: uuid
 *         floorsForProperty:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Floor'
 *     Floor:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         property_id:
 *           type: string
 *           format: uuid
 *         level_number:
 *           type: integer
 *         name:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 */
