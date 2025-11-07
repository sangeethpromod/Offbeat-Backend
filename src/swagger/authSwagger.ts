/**
 * @swagger
 * /api/auth/register-user:
 *   post:
 *     summary: Register a new user (Traveller or Admin)
 *     description: |
 *       Single-step registration for users with traveller or admin roles.
 *
 *       **Process:**
 *       - Validates that the specified role exists and is ACTIVE in the system
 *       - Hashes the password using bcrypt
 *       - Creates user account in MongoDB
 *       - Generates JWT access and refresh tokens
 *
 *       **Note:** For host registration, use the dedicated host registration endpoints.
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: "John Doe"
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *                 description: Unique email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "SecurePass123"
 *                 description: Password (minimum 6 characters)
 *               role:
 *                 type: string
 *                 enum: [traveller, admin]
 *                 example: "traveller"
 *                 description: User role (must be active in system)
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: "User registered successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                           example: "550e8400-e29b-41d4-a716-446655440000"
 *                         fullName:
 *                           type: string
 *                           example: "John Doe"
 *                         email:
 *                           type: string
 *                           example: "john.doe@example.com"
 *                         role:
 *                           type: string
 *                           example: "traveller"
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: JWT access token (15 minutes validity)
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: JWT refresh token (30 days validity)
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already registered
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
 *                   example: "Email already exists"
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user with email and password
 *     description: |
 *       Authenticate users with email and password credentials.
 *
 *       **Supported Users:**
 *       - Travellers (fully registered)
 *       - Hosts (who have completed 3-step registration)
 *       - Admins
 *
 *       **Authentication Flow:**
 *       - Validates credentials against database
 *       - Checks account status (active/inactive)
 *       - Generates new JWT access and refresh tokens
 *       - Returns user details and tokens
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         userId:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         role:
 *                           type: string
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid credentials or incomplete registration
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     summary: Google Sign-In authentication
 *     description: |
 *       Authenticate users using Google Sign-In via Firebase.
 *
 *       **Process:**
 *       1. Frontend obtains Firebase ID token from Google Sign-In
 *       2. Send ID token to this endpoint
 *       3. Server verifies token with Firebase
 *       4. Creates new user if doesn't exist (default 'traveller' role)
 *       5. Returns JWT tokens for API authentication
 *
 *       **Auto-created users:** Default role is 'traveller'
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 example: "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY4OGJkN..."
 *                 description: Firebase ID token from Google Sign-In
 *     responses:
 *       200:
 *         description: Google login successful
 *       400:
 *         description: Missing ID token or email
 *       401:
 *         description: Invalid Firebase token
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Generate new access token using valid refresh token.
 *
 *       **Token Rotation:**
 *       - Validates and revokes old refresh token
 *       - Issues new access token (15 min validity)
 *       - Issues new refresh token (30 day validity)
 *
 *       **Security:** Previous refresh token becomes invalid after use
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 description: Valid refresh token
 *     responses:
 *       200:
 *         description: Token refreshed successfully
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
 *                   example: "Token refreshed"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 *       400:
 *         description: Missing refresh token
 */

/**
 * @swagger
 * /api/auth/sync:
 *   get:
 *     summary: Sync Firebase user to MongoDB
 *     description: |
 *       Ensures a Firebase-created user exists in MongoDB database.
 *
 *       **Use Case:**
 *       - When user authenticates with Firebase but hasn't been persisted to MongoDB
 *       - For manual account synchronization
 *
 *       **Authorization:** Requires valid Firebase ID token in Bearer header
 *     tags: [Authentication]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User synced successfully
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
 *                   example: "User synced"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         description: Failed to sync user
 */
