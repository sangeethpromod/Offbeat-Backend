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
 *
 * /api/bookings/search:
 *   post:
 *     summary: Search for stories by location, date, and capacity (Traveller only)
 *     description: |
 *       Advanced geospatial search API that finds stories within a 20km radius of the specified location.
 *
 *       **Search Algorithm:**
 *       1. Uses MongoDB $near geospatial query for location-based search
 *       2. Filters by availability (date range and capacity)
 *       3. Calculates relevance score based on multiple factors
 *       4. Returns sorted results by relevance
 *
 *       **Scoring System:**
 *       - Text Match (name/suburb/town): +100 per match
 *       - District Match: +30
 *       - State Match: +20
 *       - Tag Overlap: +10 per matching tag
 *       - Distance Score: 100 - (distance_km × 5)
 *       - Availability Bonus: +25 if dates fit
 *       - Capacity Bonus: +15 if 20% extra capacity available
 *
 *       **Availability Rules:**
 *       - YEAR_ROUND: maxTravelersPerDay >= totalPeople
 *       - TRAVEL_WITH_STARS: startDate within range AND maxTravellersScheduled >= totalPeople
 *
 *       **Use Case:** Traveller search and discovery, location-based filtering
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
 *               - place
 *               - startDate
 *               - totalPeople
 *             properties:
 *               place:
 *                 type: object
 *                 required:
 *                   - lat
 *                   - lon
 *                 properties:
 *                   lat:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: 12.9716
 *                     description: Latitude of search location
 *                   lon:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: 77.5946
 *                     description: Longitude of search location
 *                   state:
 *                     type: string
 *                     example: "Karnataka"
 *                     description: Optional state name for scoring
 *                   district:
 *                     type: string
 *                     example: "Bengaluru Urban"
 *                     description: Optional district name for scoring
 *                   name:
 *                     type: string
 *                     example: "Bangalore"
 *                     description: Optional city/place name for scoring
 *                   suburb:
 *                     type: string
 *                     example: "Koramangala"
 *                     description: Optional suburb name for scoring
 *                   town:
 *                     type: string
 *                     example: "Bangalore"
 *                     description: Optional town name for scoring
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-12-15T00:00:00Z"
 *                 description: Desired start date for the story (ISO 8601 format)
 *               totalPeople:
 *                 type: integer
 *                 minimum: 1
 *                 example: 4
 *                 description: Total number of people (adults + children)
 *               filters:
 *                 type: object
 *                 properties:
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["adventure", "hiking", "camping", "wildlife"]
 *                     description: Filter by story tags
 *                   availabilityType:
 *                     type: string
 *                     enum: [YEAR_ROUND, TRAVEL_WITH_STARS]
 *                     example: "YEAR_ROUND"
 *                     description: Filter by availability type
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 20
 *                 example: 20
 *                 description: Maximum number of results to return
 *           examples:
 *             basicSearch:
 *               summary: Basic location search
 *               value:
 *                 place:
 *                   lat: 12.9716
 *                   lon: 77.5946
 *                   name: "Bangalore"
 *                   state: "Karnataka"
 *                 startDate: "2025-12-15T00:00:00Z"
 *                 totalPeople: 4
 *             advancedSearch:
 *               summary: Advanced search with filters
 *               value:
 *                 place:
 *                   lat: 15.3173
 *                   lon: 75.7139
 *                   name: "Hampi"
 *                   district: "Vijayanagara"
 *                   state: "Karnataka"
 *                   town: "Hampi"
 *                 startDate: "2025-12-20T00:00:00Z"
 *                 totalPeople: 2
 *                 filters:
 *                   tags: ["heritage", "history", "photography"]
 *                   availabilityType: "YEAR_ROUND"
 *                 limit: 10
 *             groupSearch:
 *               summary: Large group search
 *               value:
 *                 place:
 *                   lat: 11.2588
 *                   lon: 75.7804
 *                   name: "Kozhikode"
 *                   state: "Kerala"
 *                 startDate: "2026-01-05T00:00:00Z"
 *                 totalPeople: 12
 *                 filters:
 *                   availabilityType: "TRAVEL_WITH_STARS"
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 results:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       storyId:
 *                         type: string
 *                         example: "abc123-def456-ghi789"
 *                       storyTitle:
 *                         type: string
 *                         example: "Hampi Heritage Trek"
 *                       bannerImage:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             example: "stories/abc123/banner/img.jpg"
 *                           url:
 *                             type: string
 *                             example: "https://bucket.s3.region.amazonaws.com/stories/abc123/banner/img.jpg"
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["heritage", "history", "photography", "culture"]
 *                       pricingType:
 *                         type: string
 *                         enum: [Per Person, Per Day]
 *                         example: "Per Person"
 *                       amount:
 *                         type: number
 *                         example: 3000
 *                       totalPrice:
 *                         type: number
 *                         example: 3050
 *                       storyLength:
 *                         type: number
 *                         example: 3
 *                         description: Duration in days
 *                       finalScore:
 *                         type: number
 *                         example: 245
 *                         description: Relevance score (higher = more relevant)
 *                       isAvailable:
 *                         type: boolean
 *                         example: true
 *                       priceNote:
 *                         type: string
 *                         example: "This price is lower than the average price in December"
 *                       calculatedTotal:
 *                         type: number
 *                         example: 12000
 *                         description: Total price for all people (amount × totalPeople for Per Person, or totalPrice for Per Day)
 *                 total:
 *                   type: integer
 *                   example: 5
 *                   description: Number of results returned
 *             examples:
 *               successResponse:
 *                 summary: Successful search with multiple results
 *                 value:
 *                   success: true
 *                   results:
 *                     - storyId: "story-uuid-1"
 *                       storyTitle: "Hampi Heritage Trek - 3 Days"
 *                       bannerImage:
 *                         key: "stories/story-uuid-1/banner/image.jpg"
 *                         url: "https://bucket.s3.region.amazonaws.com/stories/story-uuid-1/banner/image.jpg"
 *                       tags: ["heritage", "history", "photography", "culture"]
 *                       pricingType: "Per Person"
 *                       amount: 3000
 *                       totalPrice: 3050
 *                       storyLength: 3
 *                       finalScore: 245
 *                       isAvailable: true
 *                       priceNote: "This price is lower than the average price in December"
 *                       calculatedTotal: 12000
 *                     - storyId: "story-uuid-2"
 *                       storyTitle: "Hampi Rock Climbing Adventure"
 *                       bannerImage:
 *                         key: "stories/story-uuid-2/banner/image.jpg"
 *                         url: "https://bucket.s3.region.amazonaws.com/stories/story-uuid-2/banner/image.jpg"
 *                       tags: ["adventure", "climbing", "outdoor", "photography"]
 *                       pricingType: "Per Day"
 *                       amount: 2500
 *                       totalPrice: 2550
 *                       storyLength: 2
 *                       finalScore: 210
 *                       isAvailable: true
 *                       priceNote: "This price is lower than the average price in December"
 *                       calculatedTotal: 2550
 *                   total: 2
 *               emptyResults:
 *                 summary: No stories found
 *                 value:
 *                   success: true
 *                   results: []
 *                   total: 0
 *       400:
 *         description: Invalid request parameters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "totalPeople must be at least 1"
 *       403:
 *         description: Forbidden - Only travellers can search
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Only users with Traveller role can search stories"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
