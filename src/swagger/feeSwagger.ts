/**
 * @swagger
 * components:
 *   schemas:
 *     FeeStructure:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "675000000000000000000001"
 *         feeId:
 *           type: string
 *           example: "ofb-feestrcut-001"
 *           description: Auto-generated sequential custom ID
 *         feeName:
 *           type: string
 *           example: "Platform Fee"
 *         feeAmount:
 *           type: number
 *           example: 50
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateFeeRequest:
 *       type: object
 *       required:
 *         - feeName
 *         - feeAmount
 *       properties:
 *         feeName:
 *           type: string
 *           example: "Platform Fee"
 *         feeAmount:
 *           type: number
 *           example: 50
 *
 *     FeeSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Fee created successfully"
 *         data:
 *           $ref: '#/components/schemas/FeeStructure'
 *
 *     FeeListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/FeeStructure'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Error description"
 */

/**
 * @swagger
 * /api/fees:
 *   post:
 *     summary: Create a new platform fee
 *     description: |
 *       Create a new fee structure for the platform.
 *
 *       **Auto-generated ID:** feeId follows pattern "ofb-feestrcut-001", "ofb-feestrcut-002", etc.
 *       **Examples:** Platform fee, Service charge, Processing fee
 *     tags: [Fees]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feeName
 *               - feeAmount
 *             properties:
 *               feeName:
 *                 type: string
 *                 example: "Platform Fee"
 *                 description: Name of the fee
 *               feeAmount:
 *                 type: number
 *                 minimum: 0
 *                 example: 50
 *                 description: Fee amount in currency
 *     responses:
 *       201:
 *         description: Fee created successfully
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
 *                   example: "Fee created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     feeId:
 *                       type: string
 *                       example: "ofb-feestrcut-001"
 *                     feeName:
 *                       type: string
 *                     feeAmount:
 *                       type: number
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Duplicate fee (retry with different ID)
 *       500:
 *         description: Internal server error
 *
 *   get:
 *     summary: Get all platform fees
 *     description: Retrieve complete list of all fee structures configured in the system
 *     tags: [Fees]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Fee list retrieved successfully
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
 *                     type: object
 *                     properties:
 *                       feeId:
 *                         type: string
 *                       feeName:
 *                         type: string
 *                       feeAmount:
 *                         type: number
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
