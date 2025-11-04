/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Endpoints for the authenticated user's profile
 */

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get the profile of the authenticated user
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                     full_name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     role:
 *                       type: string
 *                       enum: [admin, manager, employee]
 *                       example: "manager"
 *                     avatar:
 *                       type: string
 *                       description: URL to the user's profile picture
 *                       example: "/uploads/avatars/f47ac10b/avatar.png"
 *                     is_active:
 *                       type: boolean
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-02T14:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-02T14:05:00.000Z"
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update the authenticated user's profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *               avatar:
 *                 type: string
 *                 description: URL or path to the profile picture
 *                 example: "/uploads/avatars/f47ac10b/avatar.png"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                       example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                     full_name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     role:
 *                       type: string
 *                       enum: [admin, manager, employee]
 *                       example: "manager"
 *                     avatar:
 *                       type: string
 *                       description: URL to the user's profile picture
 *                       example: "/uploads/avatars/f47ac10b/avatar.png"
 *                     is_active:
 *                       type: boolean
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-02T14:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-10-02T14:05:00.000Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
