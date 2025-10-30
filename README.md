# OffBeat Backend

A TypeScript backend project with strict type safety and code formatting.

## Features

- ✅ **Strict TypeScript Configuration** - Enhanced type safety with strict compiler options
- ✅ **Prettier** - Automatic code formatting
- ✅ **Path Mapping** - Clean imports using @ aliases
- ✅ **MongoDB Integration** - Robust database connection with Mongoose
- ✅ **Development Tools** - Hot reload with nodemon

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run dev:env` - Start development server with .env.dev file
- `npm run build` - Build the project for production
- `npm start` - Start the production server
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check if code is formatted correctly
- `npm run type-check` - Run TypeScript type checking without emitting files
- `npm run clean` - Clean the dist directory

## TypeScript Configuration

This project uses strict TypeScript settings for maximum type safety:

- `strict: true` - Enables all strict type checking options
- `noImplicitAny: true` - Error on expressions with implied 'any' type
- `strictNullChecks: true` - Enable strict null checks
- `noUnusedLocals: true` - Error on unused local variables
- `noUnusedParameters: true` - Error on unused parameters
- `noImplicitReturns: true` - Error when not all code paths return a value
- `exactOptionalPropertyTypes: true` - Enforce exact optional property types

## Path Mapping

Use clean imports with configured path aliases:

```typescript
import { someUtil } from '@/utils/someUtil';
import { UserController } from '@controllers/UserController';
import { UserModel } from '@models/User';
```

## VS Code Setup

The project includes VS Code settings for:

- Format on save with Prettier
- TypeScript import suggestions
- Recommended extensions

## Project Structure

```
src/
├── Config/     # Configuration files (database.ts)
├── Controller/ # Route controllers
├── Model/      # Data models
├── Routes/     # API routes
├── Service/    # Business logic
├── Types/      # TypeScript type definitions
├── Utils/      # Utility functions
└── app.ts      # Application entry point
```
