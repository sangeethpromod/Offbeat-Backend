/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterHostStep1Request:
 *       type: object
 *       required:
 *         - fullName
 *         - email
 *         - age
 *         - gender
 *         - mobileNumber
 *         - nationality
 *         - role
 *       properties:
 *         fullName:
 *           type: string
 *           example: "Jane Smith"
 *         email:
 *           type: string
 *           format: email
 *           example: "jane.smith@example.com"
 *         age:
 *           type: number
 *           example: 28
 *         gender:
 *           type: string
 *           example: "Female"
 *         mobileNumber:
 *           type: string
 *           example: "+1234567890"
 *         nationality:
 *           type: string
 *           example: "American"
 *         role:
 *           type: string
 *           example: "host"
 *
 *     RegisterHostStep2Request:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 *           minLength: 6
 *           example: "securepassword123"
 *
 *     HostStepResponse:
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
 *             hostId:
 *               type: string
 *               example: "660e8400-e29b-41d4-a716-446655440001"
 *             userId:
 *               type: string
 *               example: "550e8400-e29b-41d4-a716-446655440002"
 *             onboardingStep:
 *               type: number
 *               example: 1
 *             isOnboardingComplete:
 *               type: boolean
 *               example: false
 *             message:
 *               type: string
 *               example: "Please proceed to step 2 to set your password"
 *             token:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             user:
 *               $ref: '#/components/schemas/AuthUser'
 *
 *     HostStatusResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Host status retrieved successfully"
 *         data:
 *           type: object
 *           properties:
 *             userId:
 *               type: string
 *               example: "550e8400-e29b-41d4-a716-446655440002"
 *             hostId:
 *               type: string
 *               example: "660e8400-e29b-41d4-a716-446655440001"
 *             fullName:
 *               type: string
 *               example: "Jane Smith"
 *             email:
 *               type: string
 *               example: "jane.smith@example.com"
 *             onboardingStep:
 *               type: number
 *               example: 2
 *             isOnboardingComplete:
 *               type: boolean
 *               example: false
 *             hasPassword:
 *               type: boolean
 *               example: true
 */

/**
 * @swagger
 * /api/host/register-step1:
 *   post:
 *     summary: Host registration step 1 - Basic information
 *     description: Create AuthUser and HostProfile with basic information. This is the first step of the multi-step host onboarding process.
 *     tags: [Host Registration]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterHostStep1Request'
 *     responses:
 *       201:
 *         description: Step 1 completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HostStepResponse'
 *       400:
 *         description: Bad request - validation errors or invalid role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: "All fields are required: fullName, email, age, gender, mobileNumber, nationality, role"
 *               invalidRole:
 *                 summary: Invalid or inactive role
 *                 value:
 *                   success: false
 *                   message: "Invalid role or role is not active"
 *               userExists:
 *                 summary: User already exists
 *                 value:
 *                   success: false
 *                   message: "User with this email already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/host/register-step2/{userId}:
 *   patch:
 *     summary: Host registration step 2 - Set password
 *     description: Set password for the host account. Uses PATCH to avoid overwriting existing data from step 1.
 *     tags: [Host Registration]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID from step 1 response
 *         example: "550e8400-e29b-41d4-a716-446655440002"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterHostStep2Request'
 *     responses:
 *       200:
 *         description: Step 2 completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HostStepResponse'
 *       400:
 *         description: Bad request - validation errors or wrong step
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingPassword:
 *                 summary: Password is required
 *                 value:
 *                   success: false
 *                   message: "Password is required"
 *               wrongStep:
 *                 summary: Invalid onboarding step
 *                 value:
 *                   success: false
 *                   message: "Invalid step. Expected step 2, but user is on step 3"
 *       404:
 *         description: User or host profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               userNotFound:
 *                 summary: User not found
 *                 value:
 *                   success: false
 *                   message: "User not found"
 *               hostProfileNotFound:
 *                 summary: Host profile not found
 *                 value:
 *                   success: false
 *                   message: "Host profile not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/host/register-step3/{userId}:
 *   patch:
 *     summary: Host registration step 3 - Upload documents
 *     description: Upload required documents to AWS S3 and complete the host registration process. Returns JWT token for immediate login upon completion.
 *     tags: [Host Registration]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID from step 1 response
 *         example: "550e8400-e29b-41d4-a716-446655440002"
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - location
 *               - aadharNumber
 *               - aadharFile
 *               - pccCertificateFile
 *               - livePicFile
 *             properties:
 *               location:
 *                 type: string
 *                 description: Host location/address
 *                 example: "New York, USA"
 *               aadharNumber:
 *                 type: string
 *                 description: Aadhar card number
 *                 example: "123456789012"
 *               aadharFile:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Aadhar document files (PDF/Images, max 2 files)
 *                 maxItems: 2
 *               pccCertificateFile:
 *                 type: string
 *                 format: binary
 *                 description: Police Clearance Certificate file (PDF/Images)
 *               livePicFile:
 *                 type: string
 *                 format: binary
 *                 description: Live picture file (Images only)
 *           encoding:
 *             aadharFile:
 *               contentType: application/pdf, image/jpeg, image/png, image/gif
 *             pccCertificateFile:
 *               contentType: application/pdf, image/jpeg, image/png, image/gif
 *             livePicFile:
 *               contentType: image/jpeg, image/png, image/gif
 *     responses:
 *       200:
 *         description: Registration completed successfully with JWT token
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/HostStepResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         isOnboardingComplete:
 *                           type: boolean
 *                           example: true
 *                         token:
 *                           type: string
 *                           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                         user:
 *                           $ref: '#/components/schemas/AuthUser'
 *       400:
 *         description: Bad request - validation errors, missing files, or wrong step
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFields:
 *                 summary: Missing required fields
 *                 value:
 *                   success: false
 *                   message: "Location and aadharNumber are required"
 *               missingFiles:
 *                 summary: Missing required files
 *                 value:
 *                   success: false
 *                   message: "All files are required: aadharFile, pccCertificateFile, livePicFile"
 *               wrongStep:
 *                 summary: Invalid onboarding step
 *                 value:
 *                   success: false
 *                   message: "Invalid step. Expected step 3, but user is on step 2"
 *       404:
 *         description: User or host profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error or file upload failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               uploadError:
 *                 summary: File upload failed
 *                 value:
 *                   success: false
 *                   message: "Failed to upload files. Please try again."
 *               serverError:
 *                 summary: Internal server error
 *                 value:
 *                   success: false
 *                   message: "Internal server error"
 */

/**
 * @swagger
 * /api/host/status/{userId}:
 *   get:
 *     summary: Get host onboarding status
 *     description: Retrieve the current onboarding status and progress for a host user.
 *     tags: [Host Registration]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to check status for
 *         example: "550e8400-e29b-41d4-a716-446655440002"
 *     responses:
 *       200:
 *         description: Host status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HostStatusResponse'
 *       404:
 *         description: User or host profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               userNotFound:
 *                 summary: User not found
 *                 value:
 *                   success: false
 *                   message: "User not found"
 *               hostProfileNotFound:
 *                 summary: Host profile not found
 *                 value:
 *                   success: false
 *                   message: "Host profile not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
