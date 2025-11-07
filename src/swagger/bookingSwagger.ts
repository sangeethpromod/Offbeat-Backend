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
 * /api/bookings/create-booking:
 *   post:
 *     summary: Create a new booking (Traveller)
 *     description: |
 *       Create a booking for a story with comprehensive validation.
 *
 *       **Validation Process:**
 *       - Story exists and is published
 *       - Booking duration matches story length
 *       - Capacity available for all dates in range
 *       - Traveller details match traveller count
 *       - Transaction-based to ensure data consistency
 *
 *       **Capacity Management:**
 *       - Checks available spots for each date in booking range
 *       - Prevents overbooking beyond maxTravelersPerDay
 *
 *       **Performance:**
 *       - Uses MongoDB transactions
 *       - Comprehensive New Relic monitoring
 *     tags: [Booking - Traveller]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - storyId
 *               - startDate
 *               - endDate
 *               - noOfTravellers
 *               - travellers
 *               - paymentDetails
 *             properties:
 *               storyId:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *                 description: UUID of the story to book
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-10"
 *                 description: Booking start date (ISO 8601)
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-15"
 *                 description: Booking end date (ISO 8601)
 *               noOfTravellers:
 *                 type: integer
 *                 minimum: 1
 *                 example: 3
 *                 description: Total number of travellers
 *               travellers:
 *                 type: array
 *                 minItems: 1
 *                 description: Array of traveller details (must match noOfTravellers)
 *                 items:
 *                   type: object
 *                   required:
 *                     - fullName
 *                     - emailAddress
 *                     - phoneNumber
 *                   properties:
 *                     fullName:
 *                       type: string
 *                       example: "John Doe"
 *                     emailAddress:
 *                       type: string
 *                       format: email
 *                       example: "john@example.com"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *               paymentDetails:
 *                 type: array
 *                 minItems: 1
 *                 description: Payment breakdown details
 *                 items:
 *                   type: object
 *                   required:
 *                     - totalBase
 *                     - totalPayment
 *                   properties:
 *                     totalBase:
 *                       type: number
 *                       minimum: 0
 *                       example: 1500
 *                     platformFee:
 *                       type: number
 *                       minimum: 0
 *                       example: 50
 *                       description: Defaults to 50 if not provided
 *                     discount:
 *                       type: number
 *                       minimum: 0
 *                       example: 100
 *                       description: Defaults to 0 if not provided
 *                     totalPayment:
 *                       type: number
 *                       minimum: 0
 *                       example: 1450
 *     responses:
 *       201:
 *         description: Booking created successfully
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
 *                   example: "Booking created successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookingId:
 *                       type: string
 *                       format: uuid
 *                     storyId:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     endDate:
 *                       type: string
 *                       format: date-time
 *                     totalTravellers:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       example: "confirmed"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Validation failed or capacity exceeded
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Story not found
 *
 * /api/bookings/traveller/my-bookings:
 *   get:
 *     summary: Get traveller's bookings (Production-optimized)
 *     description: |
 *       Retrieve all confirmed bookings for the authenticated traveller.
 *
 *       **Performance Optimizations:**
 *       - Single aggregation pipeline with index-aware queries
 *       - Memory-efficient projection stages
 *       - Optimized $lookup for story details
 *       - Date formatting done in MongoDB (not JavaScript)
 *       - Comprehensive New Relic instrumentation
 *
 *       **Recommended Index:** `{ userId: 1, status: 1, startDate: 1 }`
 *
 *       **Response Format:**
 *       - Formatted dates (e.g., "10-15 Nov 2025")
 *       - Story details included
 *       - Total price and traveller count
 *     tags: [Booking - Traveller]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
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
 *                   example: "Traveller bookings retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       storyName:
 *                         type: string
 *                         example: "Mountain Adventure"
 *                       location:
 *                         type: string
 *                         example: "Shimla"
 *                       state:
 *                         type: string
 *                         example: "Himachal Pradesh"
 *                       totalprice:
 *                         type: number
 *                         example: 1450
 *                       Dates:
 *                         type: string
 *                         example: "10-15 Nov 2025"
 *                       totalTravellers:
 *                         type: integer
 *                         example: 3
 *                 meta:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 5
 *                     queryTimeMs:
 *                       type: number
 *                       example: 45.23
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to retrieve bookings
 *
 * /api/bookings/traveller-bookings:
 *   get:
 *     summary: Get categorized traveller bookings (Past/Upcoming)
 *     description: |
 *       Retrieve bookings categorized into past and upcoming based on end date.
 *
 *       **Categorization Logic:**
 *       - **Upcoming:** End date is today or in the future
 *       - **Past:** End date is before today
 *
 *       **Includes:** Story details, dates, location, traveller count
 *     tags: [Booking - Host/Admin]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Categorized bookings retrieved successfully
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
 *                   example: "User bookings retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     upcoming:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           bookingId:
 *                             type: string
 *                           storyId:
 *                             type: string
 *                           storyName:
 *                             type: string
 *                           storylocation:
 *                             type: string
 *                           storyState:
 *                             type: string
 *                           Dates:
 *                             type: object
 *                             properties:
 *                               startDate:
 *                                 type: string
 *                                 format: date-time
 *                               endDate:
 *                                 type: string
 *                                 format: date-time
 *                           totalNoOfTravellers:
 *                             type: integer
 *                     past:
 *                       type: array
 *                       items:
 *                         type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /api/bookings/details/{bookingId}:
 *   get:
 *     summary: Get detailed booking summary (Admin/Host only)
 *     description: |
 *       Retrieve comprehensive booking details including story information, traveller details, and payment breakdown.
 *
 *       **Access Control:** Admin or Host role required
 *
 *       **Includes:**
 *       - Complete story information
 *       - All traveller details
 *       - Payment breakdown
 *       - Formatted date range
 *       - Primary contact phone number
 *     tags: [Booking - Host/Admin]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique booking identifier
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Booking details retrieved successfully
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
 *                   example: "Booking details retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     storyName:
 *                       type: string
 *                       example: "Mountain Adventure"
 *                     storyDescription:
 *                       type: string
 *                     location:
 *                       type: string
 *                       example: "Shimla"
 *                     state:
 *                       type: string
 *                       example: "Himachal Pradesh"
 *                     Dates:
 *                       type: string
 *                       example: "10-15 Nov 2025"
 *                     phone:
 *                       type: string
 *                       example: "+1234567890"
 *                       description: Primary traveller's phone number
 *                     totalTravellers:
 *                       type: integer
 *                       example: 3
 *                     totalBase:
 *                       type: number
 *                       example: 1500
 *                     platformFee:
 *                       type: number
 *                       example: 50
 *                     discount:
 *                       type: number
 *                       example: 100
 *                     totalPayment:
 *                       type: number
 *                       example: 1450
 *                     travellers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           travellerName:
 *                             type: string
 *                           travellerEmail:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Booking not found
 *
 * /api/bookings/analytics:
 *   post:
 *     summary: Get booking analytics for specific date (Admin/Host)
 *     description: |
 *       Retrieve booking analytics and statistics for a specific date.
 *
 *       **Metrics Include:**
 *       - Total bookings
 *       - Total travellers
 *       - Revenue metrics
 *       - Booking status distribution
 *
 *       **Use Case:** Dashboard analytics, reporting, capacity planning
 *     tags: [Booking - Host/Admin]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2025-11-10"
 *                 description: Date for analytics (ISO 8601)
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       400:
 *         description: Invalid date format
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
