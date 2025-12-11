# Story Update Guide

## Overview

This guide explains the difference between the **story creation flow** (with step-by-step status updates) and the **story update flow** (preserving status for published/approved stories).

---

## Story Creation Flow (Multi-Step)

These endpoints are used when **creating a new story** from scratch. Each step updates the story status progressively:

### Step 1: Create Story

**Endpoint:** `POST /api/stories/create-story`

- Creates basic story information
- **Status:** `STEP 1 COMPLETED`

### Step 2: Add Location & Host Details

**Endpoint:** `PATCH /api/stories/create-story/:id/page2`

- Adds pickup/dropoff locations and host information
- **Status:** `STEP 2 COMPLETED`

### Step 3: Add Pricing

**Endpoint:** `PATCH /api/stories/create-story/:id/page3`

- Adds pricing and fee calculations
- **Status:** `STEP 3 COMPLETED`

### Step 4: Upload Images

**Endpoint:** `PATCH /api/stories/create-story/:id/page4`

- Uploads banner, story, and other images
- **Status:** `STEP 4 COMPLETED`

### Step 5: Add Itinerary

**Endpoint:** `PATCH /api/stories/create-story/:id/page5`

- Adds pickup/dropoff times and daily itinerary
- **Status:** `STEP 5 COMPLETED`

### Step 6: Publish Story

**Endpoint:** `PATCH /api/stories/create-story/:id/publish`

- Host publishes the story for admin review
- **Status:** `PUBLISHED`

### Step 7: Admin Approval

**Endpoint:** `PATCH /api/stories/create-story/:id/approve`

- Admin approves the story (admin only)
- **Status:** `APPROVED`

---





## Story Update Flow (Status Preserving)

These endpoints are used to **update existing published/approved stories** without changing their status. Perfect for making edits after a story is live.

### Update Basic Information

**Endpoint:** `PUT /api/stories/update-story/:id`

- Updates title, description, state, location, tags, availability type
- Includes geolocation data (nominatimData)
- **Status:** Unchanged ✅

**Body Example:**

```json
{
  "storyTitle": "Updated Title",
  "storyDescription": "Updated description",
  "state": "Karnataka",
  "location": "Bangalore",
  "tags": ["adventure", "nature", "camping", "trekking"],
  "nominatimData": {
    "lat": "12.9716",
    "lon": "77.5946",
    "display_name": "Bangalore, Karnataka, India",
    "address": { ... }
  }
}
```

### Update Location Details (Pickup/Dropoff)

**Endpoint:** `PATCH /api/stories/:id/update-location`

- Updates pickup/dropoff locations and Google Map links
- Validates based on locationType
- **Status:** Unchanged ✅

**Body Example:**

```json
{
  "locationType": "Pickup and Dropoff",
  "pickupLocation": "New Pickup Point",
  "pickupGoogleMapLink": "https://maps.google.com/...",
  "dropOffLocation": "New Dropoff Point",
  "dropOffGoogleMapLink": "https://maps.google.com/..."
}
```

### Update Host Information

**Endpoint:** `PATCH /api/stories/:id/update-host`

- Updates host name and description
- **Status:** Unchanged ✅

**Body Example:**

```json
{
  "hostName": "New Host Name",
  "hostDescription": "Updated host bio"
}
```

### Update Pricing

**Endpoint:** `PATCH /api/stories/:id/update-pricing`

- Updates pricing type, amount, and discount
- Automatically recalculates fees and total price
- **Status:** Unchanged ✅

**Body Example:**

```json
{
  "pricingType": "PER_PERSON",
  "amount": 5000,
  "discount": 500
}
```

### Update Images

**Endpoint:** `PATCH /api/stories/:id/update-images`

- Replaces story images (banner, main, others)
- Automatically deletes old images from S3
- Supports partial updates (only upload what you want to change)
- **Status:** Unchanged ✅

**Form Data:**

```
bannerImage: [file] (optional)
storyImage: [file] (optional)
otherImages: [file1, file2, ...] (optional, max 10)
```

### Update Itinerary

**Endpoint:** `PATCH /api/stories/:id/update-itinerary`

- Updates pickup/dropoff times and daily itinerary
- **Status:** Unchanged ✅

**Body Example:**

```json
{
  "pickUpTime": "2024-01-15T09:00:00Z",
  "dropOffTime": "2024-01-15T17:00:00Z",
  "itinerary": [
    {
      "day": 1,
      "activities": [
        {
          "type": "Morning",
          "activityName": "Breakfast & Trek Start"
        }
      ]
    }
  ]
}
```

---

## Key Differences

| Feature            | Creation Flow                 | Update Flow                               |
| ------------------ | ----------------------------- | ----------------------------------------- |
| **Purpose**        | Create new story step-by-step | Edit existing story                       |
| **Status Updates** | ✅ Changes with each step     | ❌ Status preserved                       |
| **Use Case**       | First-time story creation     | Editing published/approved stories        |
| **Image Handling** | Upload new images             | Replace existing images (with S3 cleanup) |
| **Endpoints**      | `/create-story/...`           | `/update-story/...` or `/:id/update-...`  |

---

## Common Use Cases

### 1. **Host wants to change dropoff location after story is approved**

Use: `PATCH /api/stories/:id/update-location`

- Story remains `APPROVED` ✅
- Only location details are updated

### 2. **Host wants to update pricing for an active story**

Use: `PATCH /api/stories/:id/update-pricing`

- Story remains `APPROVED` ✅
- Fees automatically recalculated

### 3. **Host wants to replace the banner image**

Use: `PATCH /api/stories/:id/update-images`

- Upload only the `bannerImage` field
- Old banner automatically deleted from S3
- Story status unchanged ✅

### 4. **Host wants to update the entire itinerary**

Use: `PATCH /api/stories/:id/update-itinerary`

- Replace entire itinerary array
- Story remains `APPROVED` ✅

### 5. **Host wants to change story title and description**

Use: `PUT /api/stories/update-story/:id`

- Update basic information
- Story status unchanged ✅

---

## Authentication & Authorization

All endpoints require:

- **Authentication:** JWT token via `Authorization: Bearer <token>`
- **Authorization:**
  - Host can only update their own stories
  - Admin can update any story

---

## Best Practices

1. **During Creation:** Use the step-by-step creation flow (`/create-story/...`)
2. **After Approval:** Use the update endpoints (`/update-...`) to preserve status
3. **Image Updates:** Only upload images you want to change (old ones are auto-deleted)
4. **Partial Updates:** You don't need to send all fields, only what you want to change
5. **Pricing Updates:** Let the system recalculate fees automatically

---

## Error Handling

All endpoints return standard responses:

**Success:**

```json
{
  "success": true,
  "message": "Story updated successfully",
  "data": {
    /* updated story object */
  }
}
```

**Error:**

```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Notes

- ✅ Status is preserved in all update endpoints
- ✅ Old S3 images are automatically deleted when replacing
- ✅ Ownership verification ensures hosts can only edit their stories
- ✅ Admin bypass allows admins to edit any story
- ✅ Validation ensures data integrity on all updates
