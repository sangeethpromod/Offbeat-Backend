/**
 * @swagger
 * /api/legal/all-legal:
 *   get:
 *     summary: Get all legal documents
 *     description: |
 *       Retrieve all legal documents in the system.
 *
 *       **Returns:** Terms of Service, Privacy Policy, Cancellation Policy, etc.
 *     tags: [Legal]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Legal documents retrieved successfully
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       legalId:
 *                         type: string
 *                       title:
 *                         type: string
 *                       content:
 *                         type: string
 *                       category:
 *                         type: string
 *                       version:
 *                         type: string
 *                       effectiveDate:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /api/legal/single-legal/{id}:
 *   get:
 *     summary: Get single legal document by ID
 *     description: Retrieve a specific legal document using its unique identifier
 *     tags: [Legal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Legal document ID
 *     responses:
 *       200:
 *         description: Legal document retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /api/legal/create-legal:
 *   post:
 *     summary: Create new legal document (Admin only)
 *     description: |
 *       Create a new legal document in the system.
 *
 *       **Examples:** Terms of Service, Privacy Policy, Refund Policy
 *     tags: [Legal]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Terms of Service"
 *               content:
 *                 type: string
 *                 example: "These terms govern your use..."
 *               category:
 *                 type: string
 *                 example: "terms"
 *               version:
 *                 type: string
 *                 example: "1.0"
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Legal document created successfully
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /api/legal/update-legal/{id}:
 *   put:
 *     summary: Update legal document (Admin only)
 *     description: Update an existing legal document's content or metadata
 *     tags: [Legal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Legal document ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               category:
 *                 type: string
 *               version:
 *                 type: string
 *               effectiveDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Legal document updated successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *
 * /api/legal/delete-legal/{id}:
 *   delete:
 *     summary: Delete legal document (Admin only)
 *     description: Permanently delete a legal document from the system
 *     tags: [Legal]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Legal document ID
 *     responses:
 *       200:
 *         description: Legal document deleted successfully
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
