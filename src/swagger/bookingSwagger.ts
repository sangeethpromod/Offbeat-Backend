/**
 * @swagger
 * components:
 *   schemas:
 *     Traveller:
 *       type: object
 *       required:
 *         - fullName
 *         - emailAddress
 *         - phoneNumber
 *       properties:
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         emailAddress:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         phoneNumber:
 *           type: string
 *           example: "+1234567890"
 *
 *     PaymentDetail:
 *       type: object
 *       required:
 *         - totalBase
 *         - totalPayment
 *       properties:
 *         totalBase:
 *           type: number
 *           minimum: 0
 *           example: 1000
 *         platformFee:
 *           type: number
 *           minimum: 0
 *           default: 50
 *           example: 50
 *         discount:
 *           type: number
 *           minimum: 0
 *           default: 0
 *           example: 100
 *         totalPayment:
 *           type: number
 *           minimum: 0
 *           example: 950
 *
 *     CreateBookingRequest:
 *       type: object
 *       required:
 *         - storyId
 *         - startDate
 *         - endDate
 *         - noOfTravellers
 *         - travellers
 *         - paymentDetails
 *       properties:
 *         storyId:
 *           type: string
 *           format: uuid
 *           example: "0f8b15d1-3458-4477-925a-af51b6066ea5"
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2025-11-10"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2025-11-14"
 *         noOfTravellers:
 *           type: integer
 *           minimum: 1
 *           example: 2
 *         travellers:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/Traveller'
 *         paymentDetails:
 *           type: array
 *           minItems: 1
 *           items:
 *             $ref: '#/components/schemas/PaymentDetail'
 *
 *     BookingResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Booking created successfully"
 *         data:
 *           type: object
 *           properties:
 *             bookingId:
 *               type: string
 *               example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *             storyId:
 *               type: string
 *               format: uuid
 *               example: "0f8b15d1-3458-4477-925a-af51b6066ea5"
 *             startDate:
 *               type: string
 *               format: date-time
 *             endDate:
 *               type: string
 *               format: date-time
 *             totalTravellers:
 *               type: number
 *               example: 2
 *             status:
 *               type: string
 *               enum: ["confirmed", "cancelled"]
 *               example: "confirmed"
 *             createdAt:
 *               type: string
 *               format: date-time
 *
 *     GetBookingsByDateRequest:
 *       type: object
 *       required:
 *         - date
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2025-11-10"
 *
 *     BookingAnalytics:
 *       type: object
 *       properties:
 *         bookingId:
 *           type: string
 *           example: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *         startDate:
 *           type: string
 *           format: date-time
 *         endDate:
 *           type: string
 *           format: date-time
 *         totalNoOfTravellers:
 *           type: integer
 *           example: 2
 *         itineraryDay:
 *           type: integer
 *           example: 2
 *           description: "Which day of the story this booking is on (1-based)"
 *
 *     StoryAnalytics:
 *       type: object
 *       properties:
 *         storyId:
 *           type: string
 *           format: uuid
 *           example: "0f8b15d1-3458-4477-925a-af51b6066ea5"
 *         title:
 *           type: string
 *           example: "Mountain Adventure"
 *         maxTravelersPerDay:
 *           type: integer
 *           example: 15
 *         storyLength:
 *           type: integer
 *           example: 5
 *         bookings:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/BookingAnalytics'
 *
 *     BookingAnalyticsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Booking analytics retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             date:
 *               type: string
 *               format: date
 *               example: "2025-11-10"
 *             activeStories:
 *               type: integer
 *               example: 2
 *               description: "Number of stories with active bookings on this date"
 *             totalTravellers:
 *               type: integer
 *               example: 8
 *               description: "Total number of travellers booked for this date"
 *             totalSpace:
 *               type: integer
 *               example: 30
 *               description: "Total available space (sum of maxTravelersPerDay for active stories)"
 *             spaceLeft:
 *               type: integer
 *               example: 22
 *               description: "Available space remaining (totalSpace - totalTravellers)"
 *             stories:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StoryAnalytics'
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
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     description: Creates a booking for a published story with capacity validation. The booking duration must match the story's length, and there must be available capacity for all dates in the booking range.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateBookingRequest'
 *           example:
 *             storyId: "0f8b15d1-3458-4477-925a-af51b6066ea5"
 *             startDate: "2025-11-10"
 *             endDate: "2025-11-14"
 *             noOfTravellers: 2
 *             travellers:
 *               - fullName: "Reyvanth"
 *                 emailAddress: "reyvanth@example.com"
 *                 phoneNumber: "+919876543210"
 *               - fullName: "Rahul Nair"
 *                 emailAddress: "rahul@example.com"
 *                 phoneNumber: "+919812345678"
 *             paymentDetails:
 *               - totalBase: 12500
 *                 platformFee: 50
 *                 discount: 500
 *                 totalPayment: 12050
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingResponse'
 *       400:
 *         description: Validation failed or booking constraints not met
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validation_error:
 *                 value:
 *                   success: false
 *                   message: "Validation failed"
 *                   errors: [...]
 *               duration_mismatch:
 *                 value:
 *                   success: false
 *                   message: "Booking duration must match story length or story is not published"
 *               capacity_exceeded:
 *                 value:
 *                   success: false
 *                   message: "Booking exceeds maximum capacity of 10 travellers per day"
 *               traveller_count_mismatch:
 *                 value:
 *                   success: false
 *                   message: "Number of traveller details (2) must match noOfTravellers (3)"
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 * /api/bookings/analytics:
 *   post:
 *     summary: Get booking analytics for a specific date
 *     description: Returns comprehensive booking analytics for a given date including active stories, traveller counts, capacity information, and detailed booking breakdowns with itinerary days.
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GetBookingsByDateRequest'
 *           example:
 *             date: "2025-11-10"
 *     responses:
 *       200:
 *         description: Booking analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BookingAnalyticsResponse'
 *             example:
 *               success: true
 *               message: "Booking analytics retrieved successfully"
 *               data:
 *                 date: "2025-11-10"
 *                 activeStories: 2
 *                 totalTravellers: 8
 *                 totalSpace: 30
 *                 spaceLeft: 22
 *                 stories:
 *                   - storyId: "0f8b15d1-3458-4477-925a-af51b6066ea5"
 *                     title: "Mountain Adventure"
 *                     maxTravelersPerDay: 15
 *                     storyLength: 5
 *                     bookings:
 *                       - bookingId: "f47ac10b-58cc-4372-a567-0e02b2c3d479"
 *                         startDate: "2025-11-10T00:00:00.000Z"
 *                         endDate: "2025-11-14T00:00:00.000Z"
 *                         totalNoOfTravellers: 3
 *                         itineraryDay: 1
 *                       - bookingId: "a1b2c3d4-5678-9012-3456-789012345678"
 *                         startDate: "2025-11-09T00:00:00.000Z"
 *                         endDate: "2025-11-13T00:00:00.000Z"
 *                         totalNoOfTravellers: 2
 *                         itineraryDay: 2
 *                   - storyId: "1a2b3c4d-5678-9012-3456-789012345678"
 *                     title: "Desert Safari"
 *                     maxTravelersPerDay: 15
 *                     storyLength: 3
 *                     bookings:
 *                       - bookingId: "b2c3d4e5-6789-0123-4567-890123456789"
 *                         startDate: "2025-11-10T00:00:00.000Z"
 *                         endDate: "2025-11-12T00:00:00.000Z"
 *                         totalNoOfTravellers: 3
 *                         itineraryDay: 1
 *       400:
 *         description: Date parameter is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Date is required"
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
