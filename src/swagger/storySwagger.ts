/**
 * @swagger
 * components:
 *   schemas:
 *     StoryPriceItem:
 *       type: object
 *       properties:
 *         label:
 *           type: string
 *           example: "Base Price"
 *         value:
 *           type: number
 *           example: 1500
 *
 *     CreateStoryRequest:
 *       type: object
 *       required:
 *         - storyTitle
 *         - storyDescription
 *         - state
 *         - location
 *         - startDate
 *         - endDate
 *         - maxTravelersPerDay
 *       properties:
 *         storyTitle:
 *           type: string
 *           example: "Gokarna Beach Trek"
 *         storyDescription:
 *           type: string
 *           example: "Coastal hike with hidden beaches"
 *         state:
 *           type: string
 *           example: "Karnataka"
 *         location:
 *           type: string
 *           example: "Gokarna"
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2025-12-01"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2025-12-03"
 *         maxTravelersPerDay:
 *           type: number
 *           example: 10
 *
 *     UpdateStoryPage2Request:
 *       type: object
 *       required:
 *         - locationType
 *         - hostName
 *         - hostDescription
 *       properties:
 *         locationType:
 *           type: string
 *           enum: ["Pickup and Dropoff", "Pickup Only", "Drop Only", "None"]
 *           example: "Pickup Only"
 *         pickupLocation:
 *           type: string
 *           example: "Gokarna Bus Stand"
 *         pickupGoogleMapLink:
 *           type: string
 *           example: "https://maps.google.com/?q=gokarna-bus-stand"
 *         dropOffLocation:
 *           type: string
 *         dropOffGoogleMapLink:
 *           type: string
 *         hostName:
 *           type: string
 *           example: "Anita"
 *         hostDescription:
 *           type: string
 *           example: "Local guide with 5 years experience."
 *
 *     UpdateStoryPage3Request:
 *       type: object
 *       required:
 *         - pricingType
 *         - amount
 *       properties:
 *         pricingType:
 *           type: string
 *           enum: ["Per Day", "Per Person"]
 *           example: "Per Day"
 *         amount:
 *           type: number
 *           example: 1500
 *         discount:
 *           type: number
 *           example: 200
 *
 *     Story:
 *       type: object
 *       properties:
 *         storyId:
 *           type: string
 *           example: "f0a3c0f5-8e2c-4fd5-9a5a-6b4d8b2e9f30"
 *         storyTitle:
 *           type: string
 *         storyDescription:
 *           type: string
 *         state:
 *           type: string
 *         location:
 *           type: string
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         noOfDays:
 *           type: number
 *         maxTravelersPerDay:
 *           type: number
 *         status:
 *           type: string
 *           enum: ["DRAFT", "INCOMPLETE", "PUBLISHED"]
 *         locationType:
 *           type: string
 *           enum: ["Pickup and Dropoff", "Pickup Only", "Drop Only", "None"]
 *         pickupLocation:
 *           type: string
 *         pickupGoogleMapLink:
 *           type: string
 *         dropOffLocation:
 *           type: string
 *         dropOffGoogleMapLink:
 *           type: string
 *         hostName:
 *           type: string
 *         hostDescription:
 *           type: string
 *         pricingType:
 *           type: string
 *           enum: ["Per Day", "Per Person"]
 *         amount:
 *           type: number
 *         discount:
 *           type: number
 *         platformFee:
 *           type: number
 *           example: 50
 *         totalPrice:
 *           type: number
 *         priceBreakdown:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StoryPriceItem'
 *
 *     StoryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *         data:
 *           $ref: '#/components/schemas/Story'
 *         storyId:
 *           type: string
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 */

/**
 * @swagger
 * /api/stories/create-story:
 *   post:
 *     summary: Create a new story (Step 1)
 *     description: Validates required fields and auto-calculates noOfDays from startDate and endDate. Creates story with status DRAFT.
 *     tags: [Stories]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateStoryRequest'
 *     responses:
 *       201:
 *         description: Story created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryResponse'
 *       400:
 *         description: Validation error (e.g., dates order)
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
 */

/**
 * @swagger
 * /api/stories/create-story/{id}/page2:
 *   patch:
 *     summary: Update story (Step 2)
 *     description: Updates location/host details. Dynamic validation based on locationType.
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: storyId from create response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStoryPage2Request'
 *     responses:
 *       200:
 *         description: Story updated (page 2)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryResponse'
 *       400:
 *         description: Validation error (missing fields based on locationType)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Story not found
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
 */

/**
 * @swagger
 * /api/stories/create-story/{id}/page3:
 *   patch:
 *     summary: Update story pricing (Step 3)
 *     description: Computes totalPrice = (amount - discountIfAny) + 50 and stores a detailed priceBreakdown.
 *     tags: [Stories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: storyId from create response
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStoryPage3Request'
 *     responses:
 *       200:
 *         description: Story updated (page 3)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryResponse'
 *       400:
 *         description: Validation error (missing pricing fields)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Story not found
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
 */
