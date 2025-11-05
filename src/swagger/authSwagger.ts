/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterUserRequest:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - password
 *         - role
 *       properties:
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "password123"
 *         role:
 *           type: string
 *           enum: [traveller, admin]
 *           example: "traveller"
 *
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         password:
 *           type: string
 *           example: "password123"
 *
 *     GoogleLoginRequest:
 *       type: object
 *       required:
 *         - idToken
 *       properties:
 *         idToken:
 *           type: string
 *           example: "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY4OGJkN..."
 *           description: Firebase ID token received from Google Sign-In
 *
 *     AuthUser:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         fullName:
 *           type: string
 *           example: "John Doe"
 *         email:
 *           type: string
 *           format: email
 *           example: "john.doe@example.com"
 *         role:
 *           type: string
 *           example: "traveller"
 *         firebaseUid:
 *           type: string
 *           example: "firebase-user-id-123"
 *           description: Firebase user ID
 *
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Operation successful"
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/AuthUser'
 *             token:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             firebaseToken:
 *               type: string
 *               example: "firebase-custom-token-or-id-token"
 *               description: Firebase authentication token
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
 * /api/auth/register-user:
 *   post:
 *     summary: Register a new user
 *     description: Single-step registration for users with traveller or admin roles. Validates that the role exists and is ACTIVE.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - validation errors or invalid role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid role or role is not active"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user (travellers and completed hosts)
 *     description: Authenticate users with email and password. Works for travellers and hosts who have completed their registration.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid credentials or incomplete registration
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               invalidCredentials:
 *                 summary: Invalid email or password
 *                 value:
 *                   success: false
 *                   message: "Invalid email or password"
 *               incompleteRegistration:
 *                 summary: Host registration incomplete
 *                 value:
 *                   success: false
 *                   message: "Account setup is incomplete. Please complete your registration."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     summary: Google Sign-In authentication
 *     description: Authenticate users using Google Sign-In. Frontend sends Firebase ID token after Google authentication. Creates new user if doesn't exist with default 'traveller' role.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLoginRequest'
 *     responses:
 *       200:
 *         description: Google login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               message: "Google login successful"
 *               data:
 *                 user:
 *                   userId: "550e8400-e29b-41d4-a716-446655440000"
 *                   fullName: "John Doe"
 *                   email: "john.doe@gmail.com"
 *                   role: "traveller"
 *                   firebaseUid: "firebase-user-id-123"
 *                 token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 firebaseToken: "eyJhbGciOiJSUzI1NiIsImtpZCI6ImY4OGJkN..."
 *       400:
 *         description: Bad request - missing ID token or email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingToken:
 *                 summary: Missing Firebase ID token
 *                 value:
 *                   success: false
 *                   message: "Firebase ID token is required"
 *               missingEmail:
 *                 summary: Email required for account creation
 *                 value:
 *                   success: false
 *                   message: "Email is required for account creation"
 *       401:
 *         description: Invalid or expired Firebase token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Invalid or expired Firebase token"
 *       500:
 *         description: Internal server error or role configuration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
