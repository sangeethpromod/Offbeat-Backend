/**
 * @swagger
 * components:
 *   schemas:
 *     Role:
 *       type: object
 *       required:
 *         - roleName
 *       properties:
 *         roleId:
 *           type: string
 *           description: Auto-generated UUID for the role
 *           example: "550e8400-e29b-41d4-a716-446655440000"
 *         roleName:
 *           type: string
 *           description: Name of the role
 *           example: "Admin"
 *         roleStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Status of the role
 *           example: "active"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *     CreateRoleRequest:
 *       type: object
 *       required:
 *         - roleName
 *       properties:
 *         roleName:
 *           type: string
 *           description: Name of the role to create
 *           example: "Manager"
 *         roleStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Status of the role (defaults to active)
 *           example: "active"
 *     UpdateRoleRequest:
 *       type: object
 *       properties:
 *         roleName:
 *           type: string
 *           description: Updated name of the role
 *           example: "Senior Manager"
 *         roleStatus:
 *           type: string
 *           enum: [active, inactive]
 *           description: Updated status of the role
 *           example: "active"
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *           example: "Role not found"
 */

/**
 * @swagger
 * /api/roles/create-role:
 *   post:
 *     summary: Create a new role
 *     description: |
 *       Create a new system role for RBAC (Role-Based Access Control).
 *
 *       **Default Status:** active
 *       **Examples:** admin, host, traveller, manager
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *                 example: "manager"
 *               roleStatus:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Role created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 roleId:
 *                   type: string
 *                   format: uuid
 *                 roleName:
 *                   type: string
 *                 roleStatus:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       500:
 *         description: Internal server error
 *
 * /api/roles/get-all-roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve complete list of all system roles with their status
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   roleId:
 *                     type: string
 *                   roleName:
 *                     type: string
 *                   roleStatus:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                   updatedAt:
 *                     type: string
 *       500:
 *         description: Internal server error
 *
 * /api/roles/get-role/{id}:
 *   get:
 *     summary: Get role by ID
 *     description: Retrieve a specific role using its unique identifier
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID (UUID)
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Role found
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Internal server error
 *
 * /api/roles/update-role/{id}:
 *   put:
 *     summary: Update role by ID
 *     description: |
 *       Update role name or status.
 *
 *       **Updatable Fields:**
 *       - roleName
 *       - roleStatus (active/inactive)
 *     tags: [Roles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Role ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roleName:
 *                 type: string
 *               roleStatus:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         description: Internal server error
 */
