{
  // =====================================================================
  // MASTER SEARCH REQUEST VARIANT FILE
  // Uncomment any block you want to test.
  // =====================================================================

  // ---------------------------------------------------------------------
  // 1. MINIMAL REQUIRED PAYLOAD
  // ---------------------------------------------------------------------
  "variant_minimal": {
    "place": {
      "lat": 10.8505,
      "lon": 76.2711
    },
    "startDate": "2025-12-15",
    "totalPeople": 2
  },

  // ---------------------------------------------------------------------
  // 2. MINIMAL + LIMIT
  // ---------------------------------------------------------------------
  "variant_minimal_with_limit": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "limit": 10
  },

  // ---------------------------------------------------------------------
  // 3. MINIMAL + SORT VARIANTS
  // ---------------------------------------------------------------------
  "variant_sort_price_low_to_high": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "sortBy": "price_low_to_high"
  },

  "variant_sort_price_high_to_low": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "sortBy": "price_high_to_low"
  },

  "variant_sort_relevance": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "sortBy": "relevance"
  },

  // ---------------------------------------------------------------------
  // 4. FULL PLACE OBJECT (all possible geo fields)
  // ---------------------------------------------------------------------
  "variant_full_place_object": {
    "place": {
      "lat": 10.8505,
      "lon": 76.2711,
      "state": "Kerala",
      "district": "Palakkad",
      "name": "Malampuzha",
      "suburb": "East",
      "town": "Palakkad Town"
    },
    "startDate": "2025-12-15",
    "totalPeople": 4
  },

  // ---------------------------------------------------------------------
  // 5. ONLY AVAILABILITY FILTER VARIANTS
  // ---------------------------------------------------------------------
  "variant_filter_year_round": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "filters": {
      "availabilityType": "YEAR_ROUND"
    }
  },

  "variant_filter_travel_with_stars": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "filters": {
      "availabilityType": "TRAVEL_WITH_STARS"
    }
  },

  // ---------------------------------------------------------------------
  // 6. BUDGET FILTER VARIANTS
  // ---------------------------------------------------------------------

  "variant_budget_min_only": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "filters": { "budgetMin": 5000 }
  },

  "variant_budget_max_only": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "filters": { "budgetMax": 50000 }
  },

  "variant_budget_min_max": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "filters": {
      "budgetMin": 5000,
      "budgetMax": 20000
    }
  },

  // ---------------------------------------------------------------------
  // 7. TAG FILTER VARIANTS
  // ---------------------------------------------------------------------

  "variant_tags_single": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "filters": {
      "tags": ["Adventure"]
    }
  },

  "variant_tags_multiple": {
    "place": { "lat": 10.8505, "lon": 76.2711 },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "filters": {
      "tags": ["Adventure", "Nature", "Budget"]
    }
  },

  // ---------------------------------------------------------------------
  // 8. FULL FILTER BLOCK (your original input, fully expanded)
  // ---------------------------------------------------------------------
  "variant_full_filters_complete": {
    "place": {
      "lat": 10.8505,
      "lon": 76.2711,
      "state": "Kerala",
      "district": "Palakkad"
    },
    "startDate": "2025-12-15",
    "totalPeople": 2,
    "filters": {
      "availabilityType": "YEAR_ROUND",
      "budgetMin": 5000,
      "budgetMax": 50000,
      "tags": ["Adventure", "Nature"]
    },
    "sortBy": "price_low_to_high",
    "limit": 20
  },

  // ---------------------------------------------------------------------
  // 9. STRESS TEST PAYLOAD (max fields + complex filters + high limit)
  // ---------------------------------------------------------------------
  "variant_stress_test": {
    "place": {
      "lat": 9.9312,
      "lon": 76.2673,
      "state": "Kerala",
      "district": "Ernakulam",
      "name": "Fort Kochi",
      "suburb": "West",
      "town": "Kochi"
    },
    "startDate": "2026-01-20",
    "totalPeople": 8,
    "filters": {
      "availabilityType": "TRAVEL_WITH_STARS",
      "budgetMin": 10000,
      "budgetMax": 80000,
      "tags": ["Luxury", "Cruise", "Nature"]
    },
    "sortBy": "relevance",
    "limit": 50
  },

  // ---------------------------------------------------------------------
  // 10. FALLBACK / SIMPLE NATURAL PAYLOAD
  // ---------------------------------------------------------------------
  "variant_simple_with_state": {
    "place": {
      "lat": 10.8505,
      "lon": 76.2711,
      "state": "Kerala"
    },
    "startDate": "2025-12-15",
    "totalPeople": 3
  }
}
