/**
 * @swagger
 * tags:
 *   name: Floors
 *   description: Floor management (admin only for update/delete; floors auto-created with properties)
 */

/**
 * @swagger
 * /api/floors:
 *   get:
 *     summary: Get all floors with their locals and property names
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all floors with their locals and property
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                   name:
 *                     type: string
 *                     example: "Ground Floor"
 *                   level_number:
 *                     type: integer
 *                     example: 0
 *                   property_id:
 *                     type: string
 *                     example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                   property_name:
 *                     type: string
 *                     example: "Sunset Apartments"
 *                   localsForFloor:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "l1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6"
 *                         status:
 *                           type: string
 *                           enum: [available, occupied, maintenance]
 *                           example: "available"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/floors/{id}:
 *   get:
 *     summary: Get a floor by ID with its locals
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor ID
 *     responses:
 *       200:
 *         description: Floor details including locals
 *       404:
 *         description: Floor not found
 *       401:
 *         description: Unauthorized
 * 
 *   put:
 *     summary: Update a floor (admin only)
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *                 example: "1st Floor"
 *               level_number:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Floor updated successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Floor not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 * 
 *   delete:
 *     summary: Soft-delete a floor (admin only)
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Floor soft-deleted successfully
 *       404:
 *         description: Floor not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (admin only)
 */

/**
 * @swagger
 * /api/floors/reports/occupancy:
 *   get:
 *     summary: Get occupancy report for all floors
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Occupancy report for all floors (managers see only their property floors)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   floor_id:
 *                     type: string
 *                     example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                   floor_name:
 *                     type: string
 *                     example: "Ground Floor"
 *                   level_number:
 *                     type: integer
 *                     example: 0
 *                   total_locals:
 *                     type: integer
 *                     example: 10
 *                   occupied:
 *                     type: integer
 *                     example: 7
 *                   available:
 *                     type: integer
 *                     example: 2
 *                   maintenance:
 *                     type: integer
 *                     example: 1
 *                   occupancy_rate:
 *                     type: number
 *                     format: float
 *                     example: 70.0
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/floors/{id}/occupancy:
 *   get:
 *     summary: Get occupancy report for a single floor
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Floor ID
 *     responses:
 *       200:
 *         description: Occupancy report for the floor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 floor_id:
 *                   type: string
 *                   example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                 floor_name:
 *                   type: string
 *                   example: "Ground Floor"
 *                 level_number:
 *                   type: integer
 *                   example: 0
 *                 total_locals:
 *                   type: integer
 *                   example: 10
 *                 occupied:
 *                   type: integer
 *                   example: 7
 *                 available:
 *                   type: integer
 *                   example: 2
 *                 maintenance:
 *                   type: integer
 *                   example: 1
 *                 occupancy_rate:
 *                   type: number
 *                   format: float
 *                   example: 70.0
 *       404:
 *         description: Floor not found
 *       401:
 *         description: Unauthorized
 */
