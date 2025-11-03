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
 *     summary: Create a new fee
 *     description: Creates a new fee; feeId is auto-generated (ofb-feestrcut-001, etc.).
 *     tags: [Fees]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateFeeRequest'
 *     responses:
 *       201:
 *         description: Fee created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeeSuccessResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Required fields: feeName, feeAmount"
 *       409:
 *         description: Duplicate key (rare; retry)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   get:
 *     summary: Get all fees
 *     description: Retrieves the list of all fee structures.
 *     tags: [Fees]
 *     responses:
 *       200:
 *         description: Fee list
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FeeListResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
