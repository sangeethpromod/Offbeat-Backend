import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Offbeat Backend API',
      version: '1.0.0',
      description: `



## Authentication

Most endpoints require authentication via JWT Bearer token. Include in headers:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Base Response Format

All responses follow a consistent structure:
\`\`\`json
{
  "success": true/false,
  "message": "Response message",
  "data": { ... }
}
\`\`\`
      `,
      contact: {
        name: 'Offbeat API Support',
        email: 'support@offbeat.com',
      },
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://api-offbeat.westbridgeco.com/api-docs/',
        description: 'Non-production server',
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Booking - Traveller',
        description: 'Booking operations for travellers',
      },
      {
        name: 'Booking - Host/Admin',
        description: 'Booking management for hosts and administrators',
      },
      {
        name: 'Metrics',
        description: 'Analytics and metrics endpoints',
      },
      {
        name: 'Legal',
        description: 'Legal documents and policies management',
      },
      {
        name: 'Roles',
        description: 'Role management and RBAC configuration',
      },
      {
        name: 'Fees',
        description: 'Platform fee configuration',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token obtained from login/register',
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Unauthorized access' },
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: 'Insufficient permissions for this operation',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: {
                    type: 'string',
                    example: 'Access denied. Admin or Host role required.',
                  },
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Resource not found' },
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Validation failed' },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        field: { type: 'string' },
                        message: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
  },
  apis: ['./src/swagger/*.ts', './src/Model/*.ts'], // Include both swagger docs and model schemas
};

const specs = swaggerJSDoc(options);

export { swaggerUi, specs };
