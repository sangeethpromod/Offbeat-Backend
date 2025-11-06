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
 *
 *     UpdateStoryImagesRequest:
 *       type: object
 *       properties:
 *         bannerImage:
 *           type: string
 *           format: binary
 *           description: "Banner image file for the story"
 *         storyImage:
 *           type: string
 *           format: binary
 *           description: "Main story image file"
 *         otherImages:
 *           type: array
 *           items:
 *             type: string
 *             format: binary
 *           description: "Additional story images (multiple files allowed)"
 *
 *     StoryActivity:
 *       type: object
 *       required:
 *         - type
 *         - activityName
 *       properties:
 *         type:
 *           type: string
 *           example: "Adventure"
 *         activityName:
 *           type: string
 *           example: "Beach Trek"
 *         activityDescription:
 *           type: string
 *           example: "2km coastal walk to hidden beach"
 *         activityTime:
 *           type: string
 *           example: "09:00 AM"
 *         activityDuration:
 *           type: string
 *           example: "3 hours"
 *         activityLocation:
 *           type: string
 *           example: "Gokarna Coast"
 *
 *     StoryItineraryDay:
 *       type: object
 *       required:
 *         - day
 *         - activities
 *       properties:
 *         day:
 *           type: integer
 *           minimum: 1
 *           example: 1
 *         activities:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StoryActivity'
 *
 *     UpdateStoryItineraryRequest:
 *       type: object
 *       properties:
 *         pickUpTime:
 *           type: string
 *           format: date-time
 *           example: "2025-11-10T08:00:00.000Z"
 *         dropOffTime:
 *           type: string
 *           format: date-time
 *           example: "2025-11-12T18:00:00.000Z"
 *         itinerary:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/StoryItineraryDay'
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

/**
 * @swagger
 * /api/stories/create-story/{id}/images:
 *   patch:
 *     summary: Update story images (Step 4)
 *     description: Upload and update story images including banner, main story image, and additional images. Images are uploaded to AWS S3.
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
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateStoryImagesRequest'
 *           encoding:
 *             bannerImage:
 *               contentType: image/jpeg, image/png, image/webp
 *             storyImage:
 *               contentType: image/jpeg, image/png, image/webp
 *             otherImages:
 *               contentType: image/jpeg, image/png, image/webp
 *     responses:
 *       200:
 *         description: Story images updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryResponse'
 *       400:
 *         description: Invalid file format or missing story
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
 *         description: Internal server error or S3 upload failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/stories/create-story/{id}/itinerary:
 *   patch:
 *     summary: Update story itinerary (Step 5)
 *     description: Update story pickup/dropoff times and detailed day-by-day itinerary with activities. Validates itinerary structure and activity requirements.
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
 *             $ref: '#/components/schemas/UpdateStoryItineraryRequest'
 *           example:
 *             pickUpTime: "2025-11-10T08:00:00.000Z"
 *             dropOffTime: "2025-11-12T18:00:00.000Z"
 *             itinerary:
 *               - day: 1
 *                 activities:
 *                   - type: "Transportation"
 *                     activityName: "Pickup from meeting point"
 *                     activityTime: "08:00 AM"
 *                     activityDuration: "30 minutes"
 *                     activityLocation: "Gokarna Bus Stand"
 *                   - type: "Adventure"
 *                     activityName: "Beach Trek"
 *                     activityDescription: "2km coastal walk to hidden beach"
 *                     activityTime: "09:00 AM"
 *                     activityDuration: "3 hours"
 *                     activityLocation: "Gokarna Coast"
 *               - day: 2
 *                 activities:
 *                   - type: "Cultural"
 *                     activityName: "Temple Visit"
 *                     activityDescription: "Visit ancient Mahabaleshwar Temple"
 *                     activityTime: "10:00 AM"
 *                     activityDuration: "2 hours"
 *                     activityLocation: "Mahabaleshwar Temple"
 *     responses:
 *       200:
 *         description: Story itinerary updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StoryResponse'
 *       400:
 *         description: Validation error (invalid itinerary structure, missing activities, etc.)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalid_itinerary:
 *                 value:
 *                   success: false
 *                   message: "Itinerary must be an array"
 *               missing_activity_fields:
 *                 value:
 *                   success: false
 *                   message: "Each activity must have type and activityName"
 *               invalid_day_number:
 *                 value:
 *                   success: false
 *                   message: "Each itinerary day must have a valid day number (minimum 1)"
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
