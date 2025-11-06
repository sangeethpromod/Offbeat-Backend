# Database Migrations

This folder contains database migration scripts for the Offbeat Backend application.

## Available Migrations

### `updateStorySchema.ts`

**Purpose**: Updates the Story collection schema to replace date-based availability with story length.

**Changes**:

- Removes old fields: `startDate`, `endDate`, `noOfDays`, `currentCapacity`
- Adds new field: `storyLength` (defaults to 1)

**Usage**:

```bash
npm run migrate:stories
```

**Important Notes**:

- This migration is destructive - old date fields will be permanently removed
- All stories will get `storyLength: 1` by default
- After running this migration, update individual stories with appropriate lengths through your admin interface
- Make sure to backup your database before running this migration

### `addFieldToCollection.ts`

**Purpose**: Template/example migration for adding fields to collections.

**Usage**:

```bash
npx ts-node src/Migration/addFieldToCollection.ts
```

## Running Migrations

1. **Always backup your database first**
2. Run the migration script: `npm run migrate:<migration-name>`
3. Verify the changes in your database
4. Update your application code as needed

## Migration Best Practices

- Test migrations on a development database first
- Always backup before running destructive migrations
- Run migrations during low-traffic periods
- Document all changes clearly
- Test application functionality after migration
