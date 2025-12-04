/**
 * @swagger
 * components:
 *   schemas:
 *     HostListRequest:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Page number for pagination (starts from 1)
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           description: Number of hosts to return per page
 *           example: 10
 *         sort:
 *           type: string
 *           enum: [A-Z, Z-A, DateJoined]
 *           default: DateJoined
 *           description: |
 *             Sort order for the host list:
 *             - **A-Z**: Sort by full name alphabetically (ascending)
 *             - **Z-A**: Sort by full name reverse alphabetically (descending)
 *             - **DateJoined**: Sort by date joined (newest first)
 *           example: DateJoined
 *         status:
 *           type: string
 *           enum: [ALL, ACTIVE, PENDING, BLOCKED]
 *           default: ALL
 *           description: |
 *             Filter hosts by their current status:
 *             - **ALL**: Show all hosts regardless of status
 *             - **ACTIVE**: Hosts with completed onboarding and active accounts
 *             - **PENDING**: Hosts with incomplete onboarding
 *             - **BLOCKED**: Hosts whose accounts have been deactivated (isActive: false)
 *           example: ALL
 *
 *     HostListItem:
 *       type: object
 *       properties:
 *         hostID:
 *           type: string
 *           description: Unique identifier for the host profile (UUID)
 *           example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *         userID:
 *           type: string
 *           description: Unique identifier for the user (UUID)
 *           example: "f9e8d7c6-b5a4-3210-9876-543210fedcba"
 *         fullName:
 *           type: string
 *           description: Full name of the host
 *           example: "John Doe"
 *         emailID:
 *           type: string
 *           format: email
 *           description: Email address of the host
 *           example: "john.doe@example.com"
 *         mobileNumber:
 *           type: string
 *           description: Mobile number of the host
 *           example: "9876543210"
 *         nationality:
 *           type: string
 *           description: Nationality of the host
 *           example: "Indian"
 *         dateJoined:
 *           type: string
 *           format: date-time
 *           description: Date when the host registered (ISO 8601 format)
 *           example: "2025-11-15T10:30:00.000Z"
 *         status:
 *           type: string
 *           enum: [ACTIVE, PENDING, BLOCKED]
 *           description: Current status of the host account
 *           example: "ACTIVE"
 *
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of hosts matching the filter criteria
 *           example: 50
 *         page:
 *           type: integer
 *           description: Current page number
 *           example: 1
 *         limit:
 *           type: integer
 *           description: Number of items per page
 *           example: 10
 *         totalPages:
 *           type: integer
 *           description: Total number of pages available
 *           example: 5
 *
 *     HostListResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Host list retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             hosts:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/HostListItem'
 *             pagination:
 *               $ref: '#/components/schemas/PaginationInfo'
 *
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         message:
 *           type: string
 *           example: "Failed to fetch host list"
 *         error:
 *           type: string
 *           example: "Database connection error"
 */

/**
 * @swagger
 * /api/admin/hosts:
 *   post:
 *     summary: Get paginated list of hosts with filtering and sorting
 *     description: |
 *       Retrieve a paginated list of all hosts in the system with support for:
 *       - **Pagination**: Control page number and items per page
 *       - **Sorting**: Sort by name (A-Z, Z-A) or date joined (newest first)
 *       - **Filtering**: Filter by status (ALL, ACTIVE, PENDING, BLOCKED)
 *
 *       **Status Definitions:**
 *       - **ACTIVE**: Host has completed onboarding and account is active
 *       - **PENDING**: Host has not completed onboarding process
 *       - **BLOCKED**: Host account has been deactivated by admin (isActive: false)
 *
 *       **Authentication Required:** Admin role only
 *     tags:
 *       - Admin - Host Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       description: Optional filters and pagination parameters. All fields have default values.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HostListRequest'
 *           examples:
 *             defaultPagination:
 *               summary: Default - First page with 10 items
 *               description: Get the first page with default pagination (10 items per page), sorted by date joined
 *               value:
 *                 page: 1
 *                 limit: 10
 *                 sort: "DateJoined"
 *                 status: "ALL"
 *             sortAlphabetically:
 *               summary: Sort A-Z - Alphabetical order by name
 *               description: Get hosts sorted alphabetically by full name (ascending)
 *               value:
 *                 page: 1
 *                 limit: 10
 *                 sort: "A-Z"
 *                 status: "ALL"
 *             sortReverseAlpha:
 *               summary: Sort Z-A - Reverse alphabetical order
 *               description: Get hosts sorted in reverse alphabetical order by full name (descending)
 *               value:
 *                 page: 1
 *                 limit: 10
 *                 sort: "Z-A"
 *                 status: "ALL"
 *             filterActive:
 *               summary: Filter ACTIVE - Only active hosts
 *               description: Get only hosts with completed onboarding and active accounts
 *               value:
 *                 page: 1
 *                 limit: 10
 *                 sort: "DateJoined"
 *                 status: "ACTIVE"
 *             filterPending:
 *               summary: Filter PENDING - Only pending hosts
 *               description: Get only hosts with incomplete onboarding
 *               value:
 *                 page: 1
 *                 limit: 10
 *                 sort: "DateJoined"
 *                 status: "PENDING"
 *             filterBlocked:
 *               summary: Filter BLOCKED - Only blocked hosts
 *               description: Get only hosts whose accounts have been deactivated
 *               value:
 *                 page: 1
 *                 limit: 10
 *                 sort: "DateJoined"
 *                 status: "BLOCKED"
 *             customPagination:
 *               summary: Custom - Page 2 with 20 items
 *               description: Get second page with 20 items per page, active hosts only
 *               value:
 *                 page: 2
 *                 limit: 20
 *                 sort: "A-Z"
 *                 status: "ACTIVE"
 *             largeLimit:
 *               summary: Large Limit - 50 items per page
 *               description: Get many items at once (useful for exports or dashboards)
 *               value:
 *                 page: 1
 *                 limit: 50
 *                 sort: "DateJoined"
 *                 status: "ALL"
 *     responses:
 *       200:
 *         description: Host list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HostListResponse'
 *             examples:
 *               successWithData:
 *                 summary: Successful response with hosts
 *                 value:
 *                   success: true
 *                   message: "Host list retrieved successfully"
 *                   data:
 *                     hosts:
 *                       - hostID: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                         userID: "f9e8d7c6-b5a4-3210-9876-543210fedcba"
 *                         fullName: "John Doe"
 *                         emailID: "john.doe@example.com"
 *                         mobileNumber: "9876543210"
 *                         nationality: "Indian"
 *                         dateJoined: "2025-11-15T10:30:00.000Z"
 *                         status: "ACTIVE"
 *                       - hostID: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                         userID: "e8d7c6b5-a432-1098-7654-3210fedcba98"
 *                         fullName: "Jane Smith"
 *                         emailID: "jane.smith@example.com"
 *                         mobileNumber: "9123456789"
 *                         nationality: "Indian"
 *                         dateJoined: "2025-11-10T14:20:00.000Z"
 *                         status: "PENDING"
 *                     pagination:
 *                       total: 50
 *                       page: 1
 *                       limit: 10
 *                       totalPages: 5
 *               emptyResult:
 *                 summary: No hosts found
 *                 value:
 *                   success: true
 *                   message: "Host list retrieved successfully"
 *                   data:
 *                     hosts: []
 *                     pagination:
 *                       total: 0
 *                       page: 1
 *                       limit: 10
 *                       totalPages: 0
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Unauthorized access"
 *       403:
 *         description: Forbidden - User does not have admin role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Access denied. Admin role required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Failed to fetch host list"
 *               error: "Database connection timeout"
 */

/**
 * @swagger
 * /api/admin/hosts/approve:
 *   patch:
 *     summary: Approve a host
 *     description: |
 *       Change a host's status from PENDING to APPROVED.
 *       This action allows the host to start creating and publishing stories.
 *
 *       **Requirements:**
 *       - Host must exist
 *       - Host status must be PENDING
 *       - Cannot approve a BLOCKED host (must unblock first)
 *
 *       **Authentication Required:** Admin role only
 *     tags:
 *       - Admin - Host Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hostId
 *             properties:
 *               hostId:
 *                 type: string
 *                 description: Unique identifier for the host (UUID)
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *           example:
 *             hostId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Host approved successfully
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
 *                   example: "Host approved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hostId:
 *                       type: string
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     userId:
 *                       type: string
 *                       example: "f9e8d7c6-b5a4-3210-9876-543210fedcba"
 *                     status:
 *                       type: string
 *                       example: "APPROVED"
 *                     approvedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-03T10:30:00.000Z"
 *       400:
 *         description: Bad request - Invalid host state or already approved
 *         content:
 *           application/json:
 *             examples:
 *               alreadyApproved:
 *                 value:
 *                   success: false
 *                   message: "Host is already approved"
 *               hostBlocked:
 *                 value:
 *                   success: false
 *                   message: "Cannot approve a blocked host. Please unblock first."
 *               missingHostId:
 *                 value:
 *                   success: false
 *                   message: "hostId is required"
 *       404:
 *         description: Host not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Host not found"
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *       403:
 *         description: Forbidden - User does not have admin role
 *       500:
 *         description: Internal server error
 *
 * /api/admin/hosts/block:
 *   patch:
 *     summary: Block a host with reason
 *     description: |
 *       Change a host's status to BLOCKED and record the reason.
 *       Blocked hosts cannot access their account or create stories.
 *       The block reason will be visible when viewing host details.
 *
 *       **Requirements:**
 *       - Host must exist
 *       - Block reason is mandatory and must not be empty
 *       - Can block hosts in any status (PENDING or APPROVED)
 *
 *       **Authentication Required:** Admin role only
 *     tags:
 *       - Admin - Host Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hostId
 *               - blockReason
 *             properties:
 *               hostId:
 *                 type: string
 *                 description: Unique identifier for the host (UUID)
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *               blockReason:
 *                 type: string
 *                 description: Reason for blocking the host (mandatory)
 *                 minLength: 1
 *                 example: "Violated community guidelines - Posted inappropriate content"
 *           examples:
 *             violationReason:
 *               summary: Policy Violation
 *               value:
 *                 hostId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                 blockReason: "Violated community guidelines - Posted inappropriate content"
 *             fraudReason:
 *               summary: Fraudulent Activity
 *               value:
 *                 hostId: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
 *                 blockReason: "Suspected fraudulent activity - Multiple fake bookings detected"
 *             safetyReason:
 *               summary: Safety Concerns
 *               value:
 *                 hostId: "c3d4e5f6-a7b8-9012-cdef-123456789012"
 *                 blockReason: "Safety concerns raised by multiple travelers"
 *     responses:
 *       200:
 *         description: Host blocked successfully
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
 *                   example: "Host blocked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hostId:
 *                       type: string
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     userId:
 *                       type: string
 *                       example: "f9e8d7c6-b5a4-3210-9876-543210fedcba"
 *                     status:
 *                       type: string
 *                       example: "BLOCKED"
 *                     blockReason:
 *                       type: string
 *                       example: "Violated community guidelines - Posted inappropriate content"
 *                     blockedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-03T10:30:00.000Z"
 *       400:
 *         description: Bad request - Invalid input or host already blocked
 *         content:
 *           application/json:
 *             examples:
 *               alreadyBlocked:
 *                 value:
 *                   success: false
 *                   message: "Host is already blocked"
 *                   data:
 *                     blockReason: "Previous violation - Account suspended"
 *               missingReason:
 *                 value:
 *                   success: false
 *                   message: "blockReason is required"
 *               missingHostId:
 *                 value:
 *                   success: false
 *                   message: "hostId is required"
 *       404:
 *         description: Host not found
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *       403:
 *         description: Forbidden - User does not have admin role
 *       500:
 *         description: Internal server error
 *
 * /api/admin/hosts/unblock:
 *   patch:
 *     summary: Unblock a host
 *     description: |
 *       Change a host's status from BLOCKED back to PENDING.
 *       This removes the block and clears the block reason.
 *       The host will need to be re-approved by admin to become APPROVED again.
 *
 *       **Requirements:**
 *       - Host must exist
 *       - Host status must be BLOCKED
 *
 *       **Authentication Required:** Admin role only
 *     tags:
 *       - Admin - Host Management
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - hostId
 *             properties:
 *               hostId:
 *                 type: string
 *                 description: Unique identifier for the host (UUID)
 *                 example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *           example:
 *             hostId: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *     responses:
 *       200:
 *         description: Host unblocked successfully
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
 *                   example: "Host unblocked successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     hostId:
 *                       type: string
 *                       example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 *                     userId:
 *                       type: string
 *                       example: "f9e8d7c6-b5a4-3210-9876-543210fedcba"
 *                     status:
 *                       type: string
 *                       example: "PENDING"
 *                     previousBlockReason:
 *                       type: string
 *                       example: "Violated community guidelines - Posted inappropriate content"
 *                     unblockedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-03T10:30:00.000Z"
 *       400:
 *         description: Bad request - Host is not blocked
 *         content:
 *           application/json:
 *             examples:
 *               notBlocked:
 *                 value:
 *                   success: false
 *                   message: "Host is not blocked"
 *                   data:
 *                     currentStatus: "APPROVED"
 *               missingHostId:
 *                 value:
 *                   success: false
 *                   message: "hostId is required"
 *       404:
 *         description: Host not found
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *       403:
 *         description: Forbidden - User does not have admin role
 *       500:
 *         description: Internal server error
 *
 * /api/admin/stories/{storyId}:
 *   get:
 *     summary: Get detailed story information by storyId (Admin only)
 *     description: |
 *       Retrieve comprehensive details about a specific story including all metadata,
 *       pricing, itinerary, host information, and images.
 *
 *       **Use Cases:**
 *       - Admin review and moderation
 *       - Story approval workflow
 *       - Detailed story inspection
 *       - Content verification
 *
 *       **Returned Information:**
 *       - Basic story metadata (title, status, dates)
 *       - Creator/host information
 *       - Location details with geolocation data
 *       - Availability and capacity details
 *       - Pricing breakdown
 *       - Pickup/dropoff information
 *       - Complete itinerary
 *       - All uploaded images
 *     tags: [Admin - Story Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: storyId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the story
 *         example: "d2786740-a221-4bd8-9c10-6a530b78b77d"
 *     responses:
 *       200:
 *         description: Story details retrieved successfully
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
 *                     storyId:
 *                       type: string
 *                       example: "d2786740-a221-4bd8-9c10-6a530b78b77d"
 *                     storyTitle:
 *                       type: string
 *                       example: "Backwaters of Alleppey"
 *                     status:
 *                       type: string
 *                       enum: [DRAFT, STEP 1 COMPLETED, STEP 2 COMPLETED, STEP 3 COMPLETED, STEP 4 COMPLETED, STEP 5 COMPLETED, PUBLISHED, APPROVED, BLOCKED]
 *                       example: "PUBLISHED"
 *                     blockReason:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *                     createdBy:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: "user-uuid-123"
 *                         fullName:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-05-15T10:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-12-01T15:30:00.000Z"
 *                     storyDescription:
 *                       type: string
 *                       example: "Experience the serene backwaters of Alleppey with traditional houseboats and local cuisine."
 *                     state:
 *                       type: string
 *                       example: "Kerala"
 *                     location:
 *                       type: string
 *                       example: "Alleppey"
 *                     locationDetails:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         lat:
 *                           type: number
 *                           example: 9.4981
 *                         lon:
 *                           type: number
 *                           example: 76.3388
 *                         geoPoint:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               example: "Point"
 *                             coordinates:
 *                               type: array
 *                               items:
 *                                 type: number
 *                               example: [76.3388, 9.4981]
 *                         displayName:
 *                           type: string
 *                           example: "Alleppey, Kerala, India"
 *                         state:
 *                           type: string
 *                           example: "Kerala"
 *                         district:
 *                           type: string
 *                           example: "Alappuzha"
 *                     availabilityType:
 *                       type: string
 *                       enum: [YEAR_ROUND, TRAVEL_WITH_STARS]
 *                       example: "YEAR_ROUND"
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Adventure", "Culture", "Nature", "Relaxation"]
 *                     availabilityDetails:
 *                       type: object
 *                       properties:
 *                         storyLength:
 *                           type: number
 *                           nullable: true
 *                           example: 2
 *                         maxTravelersPerDay:
 *                           type: number
 *                           nullable: true
 *                           example: 10
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                         endDate:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           example: null
 *                         maxTravellersScheduled:
 *                           type: number
 *                           nullable: true
 *                           example: null
 *                     hostDetails:
 *                       type: object
 *                       properties:
 *                         locationType:
 *                           type: string
 *                           enum: [Pickup and Dropoff, Pickup Only, Drop Only, None]
 *                           nullable: true
 *                           example: "Pickup and Dropoff"
 *                         pickupLocation:
 *                           type: string
 *                           nullable: true
 *                           example: "Alleppey Boat Jetty"
 *                         pickupGoogleMapLink:
 *                           type: string
 *                           nullable: true
 *                           example: "https://maps.google.com/..."
 *                         dropOffLocation:
 *                           type: string
 *                           nullable: true
 *                           example: "Alleppey Boat Jetty"
 *                         dropOffGoogleMapLink:
 *                           type: string
 *                           nullable: true
 *                           example: "https://maps.google.com/..."
 *                         hostName:
 *                           type: string
 *                           nullable: true
 *                           example: "John Doe"
 *                         hostDescription:
 *                           type: string
 *                           nullable: true
 *                           example: "Experienced host with 5 years in tourism."
 *                     pricingDetails:
 *                       type: object
 *                       properties:
 *                         pricingType:
 *                           type: string
 *                           enum: [Per Day, Per Person]
 *                           nullable: true
 *                           example: "Per Person"
 *                         amount:
 *                           type: number
 *                           example: 5000
 *                         discount:
 *                           type: number
 *                           example: 500
 *                         platformFee:
 *                           type: number
 *                           example: 250
 *                         totalPrice:
 *                           type: number
 *                           example: 4750
 *                         priceBreakdown:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               label:
 *                                 type: string
 *                                 example: "Base Amount"
 *                               value:
 *                                 type: number
 *                                 example: 5000
 *                           example:
 *                             - label: "Base Amount"
 *                               value: 5000
 *                             - label: "Discount"
 *                               value: -500
 *                             - label: "Platform Fee"
 *                               value: 250
 *                             - label: "Total"
 *                               value: 4750
 *                     storyImages:
 *                       type: object
 *                       properties:
 *                         bannerImage:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             key:
 *                               type: string
 *                               example: "stories/story-id/banner/image.jpg"
 *                             url:
 *                               type: string
 *                               example: "https://bucket.s3.region.amazonaws.com/stories/story-id/banner/image.jpg"
 *                         storyImage:
 *                           type: object
 *                           nullable: true
 *                           properties:
 *                             key:
 *                               type: string
 *                             url:
 *                               type: string
 *                         otherImages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               key:
 *                                 type: string
 *                               url:
 *                                 type: string
 *                     timing:
 *                       type: object
 *                       properties:
 *                         pickUpTime:
 *                           type: string
 *                           nullable: true
 *                           example: "09:00 AM"
 *                         dropOffTime:
 *                           type: string
 *                           nullable: true
 *                           example: "05:00 PM"
 *                         pickUpTimeRaw:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         dropOffTimeRaw:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                     itinerary:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           day:
 *                             type: number
 *                             example: 1
 *                           activities:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 type:
 *                                   type: string
 *                                   example: "Sightseeing"
 *                                 activityName:
 *                                   type: string
 *                                   example: "Boat Ride"
 *                                 activityDescription:
 *                                   type: string
 *                                   example: "Cruise through the backwaters"
 *                                 activityTime:
 *                                   type: string
 *                                   example: "10:00 AM"
 *                                 activityDuration:
 *                                   type: string
 *                                   example: "3 hours"
 *                                 activityLocation:
 *                                   type: string
 *                                   example: "Alleppey Backwaters"
 *       400:
 *         description: Bad request - Story ID missing
 *       404:
 *         description: Story not found
 *       401:
 *         description: Unauthorized - Missing or invalid authentication token
 *       403:
 *         description: Forbidden - User does not have admin role
 *       500:
 *         description: Internal server error
 */
