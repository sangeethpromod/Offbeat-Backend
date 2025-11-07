/**
 * @swagger
 * /api/metrics/recent:
 *   get:
 *     summary: Get top 20 recently posted stories
 *     description: |
 *       Retrieve the 20 most recently posted stories for the homepage.
 *
 *       **Sorting:** By creation date (newest first)
 *       **Filter:** Only APPROVED stories shown
 *     tags: [Metrics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recent stories retrieved successfully
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
 *                   example: "Recent stories retrieved successfully"
 *                 data:
 *                   type: array
 *                   maxItems: 20
 *                   items:
 *                     type: object
 *                     properties:
 *                       storyId:
 *                         type: string
 *                       storyTitle:
 *                         type: string
 *                       storyDescription:
 *                         type: string
 *                       location:
 *                         type: string
 *                       state:
 *                         type: string
 *                       totalPrice:
 *                         type: number
 *                       storyLength:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to retrieve stories
 *
 * /api/metrics/most-booked:
 *   get:
 *     summary: Get top 20 most booked stories
 *     description: |
 *       Retrieve the 20 most popular stories based on booking count.
 *
 *       **Sorting:** By total number of bookings (descending)
 *       **Filter:** Only APPROVED stories with bookings
 *       **Use Case:** Homepage featured stories, trending destinations
 *     tags: [Metrics]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Most booked stories retrieved successfully
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
 *                   example: "Most booked stories retrieved successfully"
 *                 data:
 *                   type: array
 *                   maxItems: 20
 *                   items:
 *                     type: object
 *                     properties:
 *                       storyId:
 *                         type: string
 *                       storyTitle:
 *                         type: string
 *                       location:
 *                         type: string
 *                       state:
 *                         type: string
 *                       totalPrice:
 *                         type: number
 *                       bookingCount:
 *                         type: integer
 *                         description: Total number of bookings
 *                       totalTravellers:
 *                         type: integer
 *                         description: Total travellers across all bookings
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to retrieve stories
 */
