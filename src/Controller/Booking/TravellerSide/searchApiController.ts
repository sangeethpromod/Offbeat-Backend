import { Request, Response } from 'express';
import Story from '../../../Model/storyModel';

interface PlaceInput {
  lat: number;
  lon: number;
  state?: string;
  district?: string;
  name?: string;
  suburb?: string;
  town?: string;
}

interface SearchFilters {
  tags?: string[];
  availabilityType?: 'YEAR_ROUND' | 'TRAVEL_WITH_STARS';
  budgetMin?: number;
  budgetMax?: number;
}

interface SearchRequestBody {
  place: PlaceInput;
  startDate: string;
  totalPeople: number;
  filters?: SearchFilters;
  limit?: number;
  sortBy?: 'price_low_to_high' | 'price_high_to_low' | 'relevance';
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get month name from date
 */
function getMonthName(date: Date): string {
  const months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const monthIndex = date.getMonth();
  return months[monthIndex] ?? 'December';
}

/**
 * POST /api/stories/search
 * Search for stories based on location, date, and capacity
 */
export const searchStories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Extract user information from JWT token
    const { role } = (req as any).jwtUser;

    // Check if user has Traveller role
    if (role !== 'traveller') {
      res.status(403).json({
        success: false,
        message: 'Only users with Traveller role can search stories',
      });
      return;
    }

    const {
      place,
      startDate,
      totalPeople,
      filters,
      limit = 20,
      sortBy = 'relevance',
    } = req.body as SearchRequestBody;

    // Step 1: Validate input
    if (!place || !place.lat || !place.lon) {
      res.status(400).json({
        success: false,
        message: 'Place with lat and lon is required',
      });
      return;
    }

    if (!totalPeople || totalPeople < 1) {
      res.status(400).json({
        success: false,
        message: 'totalPeople must be at least 1',
      });
      return;
    }

    if (!startDate) {
      res.status(400).json({
        success: false,
        message: 'startDate is required',
      });
      return;
    }

    const searchDate = new Date(startDate);
    if (isNaN(searchDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Invalid startDate format. Use ISO date string.',
      });
      return;
    }

    // Validate coordinates
    if (
      place.lat < -90 ||
      place.lat > 90 ||
      place.lon < -180 ||
      place.lon > 180
    ) {
      res.status(400).json({
        success: false,
        message: 'Invalid coordinates',
      });
      return;
    }

    // Step 2: Build MongoDB geo query with expanded radius
    // Start with geo query for nearby results (50km radius instead of 20km)
    const geoQuery: any = {
      'locationDetails.geoPoint': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [place.lon, place.lat],
          },
          $maxDistance: 500000, // 500 km radius for more results
        },
      },
      status: 'APPROVED', // Only show approved stories
    };

    // Add availability type filter if provided
    if (filters?.availabilityType) {
      geoQuery.availabilityType = filters.availabilityType;
    }

    // Execute geo query
    let geoStories = await Story.find(geoQuery).limit(limit * 3); // Get more candidates

    // Step 2b: If not enough results, also fetch by district and state
    let additionalStories: any[] = [];

    if (geoStories.length < limit) {
      const locationQuery: any = {
        status: 'APPROVED',
        $or: [],
      };

      // Add district match
      if (place.district) {
        locationQuery.$or.push({
          'locationDetails.district': {
            $regex: new RegExp(place.district, 'i'),
          },
        });
      }

      // Add state match
      if (place.state) {
        locationQuery.$or.push({
          'locationDetails.state': { $regex: new RegExp(place.state, 'i') },
        });
      }

      // Add name match (town/city)
      if (place.name) {
        locationQuery.$or.push({
          'locationDetails.name': { $regex: new RegExp(place.name, 'i') },
        });
        locationQuery.$or.push({
          'locationDetails.town': { $regex: new RegExp(place.name, 'i') },
        });
      }

      // Add availability type filter if provided
      if (filters?.availabilityType) {
        locationQuery.availabilityType = filters.availabilityType;
      }

      if (locationQuery.$or.length > 0) {
        // Exclude stories already found in geo query
        const geoStoryIds = geoStories.map(s => s.storyId);
        if (geoStoryIds.length > 0) {
          locationQuery.storyId = { $nin: geoStoryIds };
        }

        additionalStories = await Story.find(locationQuery).limit(limit * 2);
      }
    }

    // Combine both result sets
    const allStories = [...geoStories, ...additionalStories];

    // Step 3: Filter by availability and calculate scores
    const scoredResults = allStories
      .map(story => {
        let isAvailable = false;
        let availabilityDateBonus = 0;
        let capacityBonus = 0;

        // Check availability based on type
        if (story.availabilityType === 'YEAR_ROUND') {
          if (
            story.maxTravelersPerDay &&
            story.maxTravelersPerDay >= totalPeople
          ) {
            isAvailable = true;
            availabilityDateBonus = 25; // Always fits for year-round

            // Capacity bonus if 20% more capacity available
            if (story.maxTravelersPerDay >= totalPeople * 1.2) {
              capacityBonus = 15;
            }
          }
        } else if (story.availabilityType === 'TRAVEL_WITH_STARS') {
          if (
            story.startDate &&
            story.endDate &&
            story.maxTravellersScheduled &&
            searchDate >= story.startDate &&
            searchDate <= story.endDate &&
            story.maxTravellersScheduled >= totalPeople
          ) {
            isAvailable = true;
            availabilityDateBonus = 25; // Date fits

            // Capacity bonus if 20% more capacity available
            if (story.maxTravellersScheduled >= totalPeople * 1.2) {
              capacityBonus = 15;
            }
          }
        }

        // Skip if not available
        if (!isAvailable) {
          return null;
        }

        // Step 4: Calculate scoring
        let textScore = 0;
        let boundaryScore = 0;
        let tagScore = 0;

        // Text matching (name, suburb, town)
        const searchName = place.name?.toLowerCase();
        const searchSuburb = place.suburb?.toLowerCase();
        const searchTown = place.town?.toLowerCase();

        if (
          searchName &&
          story.locationDetails?.name?.toLowerCase() === searchName
        ) {
          textScore += 100;
        }
        if (
          searchSuburb &&
          story.locationDetails?.suburb?.toLowerCase() === searchSuburb
        ) {
          textScore += 100;
        }
        if (
          searchTown &&
          story.locationDetails?.town?.toLowerCase() === searchTown
        ) {
          textScore += 100;
        }

        // Boundary matching
        if (
          place.district &&
          story.locationDetails?.district?.toLowerCase() ===
            place.district.toLowerCase()
        ) {
          boundaryScore += 30;
        }
        if (
          place.state &&
          story.locationDetails?.state?.toLowerCase() ===
            place.state.toLowerCase()
        ) {
          boundaryScore += 20;
        }

        // Tag matching
        if (filters?.tags && filters.tags.length > 0 && story.tags) {
          const searchTags = filters.tags.map((t: string) => t.toLowerCase());
          const storyTags = story.tags.map((t: string) => t.toLowerCase());
          const overlappingTags = searchTags.filter(tag =>
            storyTags.includes(tag)
          );
          tagScore = overlappingTags.length * 10;
        }

        // Distance score
        let distanceScore = 0;
        if (story.locationDetails?.lat && story.locationDetails?.lon) {
          const distanceKm = calculateDistance(
            place.lat,
            place.lon,
            story.locationDetails.lat,
            story.locationDetails.lon
          );
          // More lenient distance scoring: max 100, decays slower (2 points per km instead of 5)
          distanceScore = Math.max(0, 100 - distanceKm * 2);
        } else {
          // If no coordinates, give a base score of 30 for district/state matches
          if (boundaryScore > 0) {
            distanceScore = 30;
          }
        }

        // Step 5: Calculate final score
        const finalScore =
          textScore +
          boundaryScore +
          tagScore +
          distanceScore +
          availabilityDateBonus +
          capacityBonus;

        // Step 7: Calculate total price
        let calculatedTotal = 0;
        let displayAmount = story.amount || 0;
        let formattedAmount = '';

        if (story.pricingType === 'Per Person') {
          // For Per Person: amount is per person, multiply by totalPeople
          calculatedTotal = totalPeople * (story.amount || 0);
          formattedAmount = `${displayAmount}/per person`;
        } else if (story.pricingType === 'Per Day') {
          // For Per Day: totalPrice is the price per day for the whole group
          // Use totalPrice if available, otherwise use amount
          displayAmount = story.totalPrice || story.amount || 0;
          calculatedTotal = displayAmount; // Total is just the per-day price (not multiplied by people)
          formattedAmount = `${displayAmount}/per day`;
        }

        // Generate price note with month
        const monthName = getMonthName(searchDate);
        const priceNote = `This price is lower than the average price in ${monthName}`;

        return {
          storyId: story.storyId,
          storyTitle: story.storyTitle,
          bannerImage: story.storyImages?.bannerImage || null,
          tags: story.tags,
          pricingType: story.pricingType,
          amount: formattedAmount,
          totalPrice: story.totalPrice,
          storyLength: story.storyLength,
          finalScore,
          isAvailable,
          priceNote,
          calculatedTotal,
        };
      })
      .filter(result => result !== null); // Remove unavailable stories

    // Step 5.5: Apply budget filter if provided
    let filteredResults = scoredResults;
    if (filters?.budgetMin !== undefined || filters?.budgetMax !== undefined) {
      filteredResults = scoredResults.filter(result => {
        if (!result) return false;
        const price = result.calculatedTotal;

        const minBudget = filters.budgetMin ?? 0;
        const maxBudget = filters.budgetMax ?? Infinity;

        return price >= minBudget && price <= maxBudget;
      });
    }

    // Step 6: Sort by final score or price
    if (sortBy === 'price_low_to_high') {
      filteredResults.sort((a, b) => a!.calculatedTotal - b!.calculatedTotal);
    } else if (sortBy === 'price_high_to_low') {
      filteredResults.sort((a, b) => b!.calculatedTotal - a!.calculatedTotal);
    } else {
      // Default: sort by relevance (final score)
      filteredResults.sort((a, b) => b!.finalScore - a!.finalScore);
    }

    // Step 6b: If we still don't have enough results, get any available stories from the same state
    if (filteredResults.length < 10 && place.state) {
      const fallbackQuery: any = {
        status: 'APPROVED',
        'locationDetails.state': { $regex: new RegExp(place.state, 'i') },
      };

      // Exclude already found stories
      const foundStoryIds = filteredResults.map(r => r!.storyId);
      if (foundStoryIds.length > 0) {
        fallbackQuery.storyId = { $nin: foundStoryIds };
      }

      if (filters?.availabilityType) {
        fallbackQuery.availabilityType = filters.availabilityType;
      }

      const fallbackStories = await Story.find(fallbackQuery).limit(20);

      // Process fallback stories with basic scoring
      const fallbackResults = fallbackStories
        .map(story => {
          let isAvailable = false;
          let availabilityDateBonus = 0;

          // Check availability
          if (story.availabilityType === 'YEAR_ROUND') {
            if (
              story.maxTravelersPerDay &&
              story.maxTravelersPerDay >= totalPeople
            ) {
              isAvailable = true;
              availabilityDateBonus = 25;
            }
          } else if (story.availabilityType === 'TRAVEL_WITH_STARS') {
            if (
              story.startDate &&
              story.endDate &&
              story.maxTravellersScheduled &&
              searchDate >= story.startDate &&
              searchDate <= story.endDate &&
              story.maxTravellersScheduled >= totalPeople
            ) {
              isAvailable = true;
              availabilityDateBonus = 25;
            }
          }

          if (!isAvailable) {
            return null;
          }

          // Basic scoring for fallback results
          let finalScore = 20 + availabilityDateBonus; // Base score for state match

          // Calculate total price
          let calculatedTotal = 0;
          let displayAmount = story.amount || 0;
          let formattedAmount = '';

          if (story.pricingType === 'Per Person') {
            // For Per Person: amount is per person, multiply by totalPeople
            calculatedTotal = totalPeople * (story.amount || 0);
            formattedAmount = `${displayAmount}/per person`;
          } else if (story.pricingType === 'Per Day') {
            // For Per Day: totalPrice is the price per day for the whole group
            displayAmount = story.totalPrice || story.amount || 0;
            calculatedTotal = displayAmount; // Total is just the per-day price
            formattedAmount = `${displayAmount}/per day`;
          }

          // Apply budget filter to fallback results
          if (
            filters?.budgetMin !== undefined ||
            filters?.budgetMax !== undefined
          ) {
            const minBudget = filters.budgetMin ?? 0;
            const maxBudget = filters.budgetMax ?? Infinity;

            if (calculatedTotal < minBudget || calculatedTotal > maxBudget) {
              return null;
            }
          }

          const monthName = getMonthName(searchDate);
          const priceNote = `This price is lower than the average price in ${monthName}`;

          return {
            storyId: story.storyId,
            storyTitle: story.storyTitle,
            bannerImage: story.storyImages?.bannerImage || null,
            tags: story.tags,
            pricingType: story.pricingType,
            amount: formattedAmount,
            totalPrice: story.totalPrice,
            storyLength: story.storyLength,
            finalScore,
            isAvailable,
            priceNote,
            calculatedTotal,
          };
        })
        .filter(result => result !== null);

      // Add fallback results to main results
      filteredResults.push(...fallbackResults);

      // Re-sort after adding fallback results
      if (sortBy === 'price_low_to_high') {
        filteredResults.sort((a, b) => a!.calculatedTotal - b!.calculatedTotal);
      } else if (sortBy === 'price_high_to_low') {
        filteredResults.sort((a, b) => b!.calculatedTotal - a!.calculatedTotal);
      } else {
        filteredResults.sort((a, b) => b!.finalScore - a!.finalScore);
      }
    }

    // Apply limit
    const limitedResults = filteredResults.slice(0, limit);

    res.status(200).json({
      success: true,
      results: limitedResults,
      total: limitedResults.length,
    });
  } catch (error: any) {
    console.error('Error searching stories:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error',
    });
  }
};
