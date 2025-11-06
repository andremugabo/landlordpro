/**
 * @swagger
 * tags:
 *   name: Floors
 *   description: Floor management (admin only for update/delete; floors auto-created with properties)
 */

/**
 * @swagger
 * /api/floors/summary:
 *   get:
 *     summary: Get floor summary statistics for dashboard (with optional property filter)
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Optional property ID to filter summary by property
 *         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: Floor summary statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_floors:
 *                       type: integer
 *                       example: 5
 *                     total_locals:
 *                       type: integer
 *                       example: 45
 *                     occupied_locals:
 *                       type: integer
 *                       example: 32
 *                     available_locals:
 *                       type: integer
 *                       example: 10
 *                     maintenance_locals:
 *                       type: integer
 *                       example: 3
 *                     occupancy_rate:
 *                       type: number
 *                       format: float
 *                       example: 71.11
 *                 filtered_by_property:
 *                   type: boolean
 *                   example: true
 *                 property_id:
 *                   type: string
 *                   example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/floors:
 *   get:
 *     summary: Get all floors with their locals and property names (with optional property filter)
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Optional property ID to filter floors by property
 *         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: List of all floors with their locals and property
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                       name:
 *                         type: string
 *                         example: "Ground Floor"
 *                       level_number:
 *                         type: integer
 *                         example: 0
 *                       property_id:
 *                         type: string
 *                         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                       property_name:
 *                         type: string
 *                         example: "Sunset Apartments"
 *                       property_location:
 *                         type: string
 *                         example: "123 Main St"
 *                       locals:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "l1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6"
 *                             status:
 *                               type: string
 *                               enum: [available, occupied, maintenance]
 *                               example: "available"
 *                       locals_count:
 *                         type: integer
 *                         example: 8
 *                       locals_details:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                               example: "l1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6"
 *                             status:
 *                               type: string
 *                               enum: [available, occupied, maintenance]
 *                               example: "available"
 *                             local_number:
 *                               type: string
 *                               example: "G-101"
 *                             area:
 *                               type: number
 *                               format: float
 *                               example: 150.5
 *                 filtered_by_property:
 *                   type: boolean
 *                   example: true
 *                 property_id:
 *                   type: string
 *                   example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/floors/property/{propertyId}:
 *   get:
 *     summary: Get floors for a specific property with detailed information
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID to get floors for
 *         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: List of floors for the specified property
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 property:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                     name:
 *                       type: string
 *                       example: "Sunset Apartments"
 *                     location:
 *                       type: string
 *                       example: "123 Main St"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                       name:
 *                         type: string
 *                         example: "Ground Floor"
 *                       level_number:
 *                         type: integer
 *                         example: 0
 *                       property_id:
 *                         type: string
 *                       property_name:
 *                         type: string
 *                         example: "Sunset Apartments"
 *                       property_location:
 *                         type: string
 *                         example: "123 Main St"
 *                       locals:
 *                         type: array
 *                         items:
 *                           type: object
 *                       locals_count:
 *                         type: integer
 *                         example: 8
 *                       locals_details:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             status:
 *                               type: string
 *                             local_number:
 *                               type: string
 *                             area:
 *                               type: number
 *                             rent_price:
 *                               type: number
 *                       occupancy:
 *                         type: object
 *                         properties:
 *                           total:
 *                             type: integer
 *                             example: 8
 *                           occupied:
 *                             type: integer
 *                             example: 5
 *                           available:
 *                             type: integer
 *                             example: 2
 *                           maintenance:
 *                             type: integer
 *                             example: 1
 *                           occupancy_rate:
 *                             type: number
 *                             format: float
 *                             example: 62.5
 *       404:
 *         description: No floors found for this property
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/floors/stats:
 *   get:
 *     summary: Get floors with detailed statistics (with optional property filter)
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Optional property ID to filter floors by property
 *         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: Floors with detailed statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                       name:
 *                         type: string
 *                         example: "Ground Floor"
 *                       level_number:
 *                         type: integer
 *                         example: 0
 *                       property_id:
 *                         type: string
 *                       property_name:
 *                         type: string
 *                         example: "Sunset Apartments"
 *                       property_location:
 *                         type: string
 *                         example: "123 Main St"
 *                       locals:
 *                         type: array
 *                         items:
 *                           type: object
 *                       locals_count:
 *                         type: integer
 *                         example: 10
 *                       statistics:
 *                         type: object
 *                         properties:
 *                           total_locals:
 *                             type: integer
 *                             example: 10
 *                           occupied:
 *                             type: integer
 *                             example: 7
 *                           available:
 *                             type: integer
 *                             example: 2
 *                           maintenance:
 *                             type: integer
 *                             example: 1
 *                           occupancy_rate:
 *                             type: number
 *                             format: float
 *                             example: 70.0
 *                           total_area:
 *                             type: number
 *                             format: float
 *                             example: 1500.5
 *                           total_rent:
 *                             type: number
 *                             format: float
 *                             example: 12500.0
 *                           occupied_rent:
 *                             type: number
 *                             format: float
 *                             example: 8750.0
 *                           revenue_percentage:
 *                             type: number
 *                             format: float
 *                             example: 70.0
 *                 filtered_by_property:
 *                   type: boolean
 *                   example: true
 *                 property_id:
 *                   type: string
 *                   example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/floors/property/{propertyId}/simple:
 *   get:
 *     summary: Get simple floor list for a specific property
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID to get floors for
 *         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: Simple list of floors for the property
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 3
 *                 property_id:
 *                   type: string
 *                   example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                       name:
 *                         type: string
 *                         example: "Ground Floor"
 *                       level_number:
 *                         type: integer
 *                         example: 0
 *                       locals_count:
 *                         type: integer
 *                         example: 8
 *                       occupancy:
 *                         type: object
 *                         properties:
 *                           total:
 *                             type: integer
 *                             example: 8
 *                           occupied:
 *                             type: integer
 *                             example: 5
 *                           available:
 *                             type: integer
 *                             example: 2
 *                           maintenance:
 *                             type: integer
 *                             example: 1
 *                           occupancy_rate:
 *                             type: number
 *                             format: float
 *                             example: 62.5
 *       404:
 *         description: No floors found for this property
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                     name:
 *                       type: string
 *                       example: "Ground Floor"
 *                     level_number:
 *                       type: integer
 *                       example: 0
 *                     property_id:
 *                       type: string
 *                     property_name:
 *                       type: string
 *                       example: "Sunset Apartments"
 *                     property_location:
 *                       type: string
 *                       example: "123 Main St"
 *                     property_floors_count:
 *                       type: integer
 *                       example: 5
 *                     locals:
 *                       type: array
 *                       items:
 *                         type: object
 *                     locals_count:
 *                       type: integer
 *                       example: 8
 *                     locals_details:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           status:
 *                             type: string
 *                           local_number:
 *                             type: string
 *                           area:
 *                             type: number
 *                           rent_price:
 *                             type: number
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
 *                   example: "Floor updated successfully."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     level_number:
 *                       type: integer
 *                     property_id:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
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
 *                   example: "Floor deleted successfully"
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
 *     summary: Get occupancy report for all floors (with optional property filter)
 *     tags: [Floors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *         description: Optional property ID to filter occupancy report by property
 *         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *     responses:
 *       200:
 *         description: Occupancy report for all floors (managers see only their property floors)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       floor_id:
 *                         type: string
 *                         example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                       floor_name:
 *                         type: string
 *                         example: "Ground Floor"
 *                       level_number:
 *                         type: integer
 *                         example: 0
 *                       property_id:
 *                         type: string
 *                         example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                       property_name:
 *                         type: string
 *                         example: "Sunset Apartments"
 *                       total_locals:
 *                         type: integer
 *                         example: 10
 *                       occupied:
 *                         type: integer
 *                         example: 7
 *                       available:
 *                         type: integer
 *                         example: 2
 *                       maintenance:
 *                         type: integer
 *                         example: 1
 *                       occupancy_rate:
 *                         type: number
 *                         format: float
 *                         example: 70.0
 *                       total_area:
 *                         type: number
 *                         format: float
 *                         example: 1500.5
 *                       total_rent:
 *                         type: number
 *                         format: float
 *                         example: 12500.0
 *                       occupied_rent:
 *                         type: number
 *                         format: float
 *                         example: 8750.0
 *                       revenue_percentage:
 *                         type: number
 *                         format: float
 *                         example: 70.0
 *                 filtered_by_property:
 *                   type: boolean
 *                   example: true
 *                 property_id:
 *                   type: string
 *                   example: "c1a2b3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
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
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     floor_id:
 *                       type: string
 *                       example: "a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6"
 *                     floor_name:
 *                       type: string
 *                       example: "Ground Floor"
 *                     level_number:
 *                       type: integer
 *                       example: 0
 *                     property_name:
 *                       type: string
 *                       example: "Sunset Apartments"
 *                     total_locals:
 *                       type: integer
 *                       example: 10
 *                     occupied:
 *                       type: integer
 *                       example: 7
 *                     available:
 *                       type: integer
 *                       example: 2
 *                     maintenance:
 *                       type: integer
 *                       example: 1
 *                     occupancy_rate:
 *                       type: number
 *                       format: float
 *                       example: 70.0
 *                     total_area:
 *                       type: number
 *                       format: float
 *                       example: 1500.5
 *                     total_rent:
 *                       type: number
 *                       format: float
 *                       example: 12500.0
 *                     occupied_rent:
 *                       type: number
 *                       format: float
 *                       example: 8750.0
 *                     revenue_percentage:
 *                       type: number
 *                       format: float
 *                       example: 70.0
 *                     locals:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "l1a2b3c4-d5e6-7f8g-9h0i-j1k2l3m4n5o6"
 *                           local_number:
 *                             type: string
 *                             example: "G-101"
 *                           status:
 *                             type: string
 *                             enum: [available, occupied, maintenance]
 *                             example: "available"
 *                           area:
 *                             type: number
 *                             format: float
 *                             example: 150.5
 *                           rent_price:
 *                             type: number
 *                             format: float
 *                             example: 1250.0
 *       404:
 *         description: Floor not found
 *       401:
 *         description: Unauthorized
 */