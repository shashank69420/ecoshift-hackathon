// src/data/gridPricing.ts
// Owned by Person A.
// Mock hour-by-hour Time-of-Use (TOU) electricity pricing for a single day.
// Person B's tools/fetchGridPricing.ts wraps `getGridPricing()` as an MCP tool.
//
// Pricing shape is realistic for a TOU utility rate:
//  - Overnight / off-peak (11pm-7am): cheapest
//  - Mid-day shoulder (7am-2pm, 6pm-11pm): medium
//  - Peak (2pm-6pm): most expensive, 3-5x off-peak

import { GridPricePoint } from "../types";

const HOURLY_PRICES: number[] = [
  0.08, 0.08, 0.07, 0.07, 0.07, 0.08, 0.09, 0.11, // 0-7   (overnight -> early morning)
  0.13, 0.14, 0.15, 0.16, 0.17, 0.19,             // 8-13  (mid-morning shoulder)
  0.34, 0.38, 0.4, 0.36,                          // 14-17 (peak: 2pm-6pm)
  0.22, 0.18, 0.15, 0.12,                         // 18-21 (evening shoulder)
  0.1, 0.09,                                      // 22-23 (late evening)
];

/**
 * Returns today's hour-by-hour grid pricing.
 * `date` is accepted for API-shape realism / future extension but the mock
 * currently returns the same 24-hour curve regardless of date.
 */
export function getGridPricing(date: Date = new Date()): GridPricePoint[] {
  return HOURLY_PRICES.map((price, hour) => ({ hour, price }));
}

/**
 * Convenience helper: price for a specific hour (0-23).
 */
export function getPriceForHour(hour: number): number {
  const clamped = ((hour % 24) + 24) % 24;
  return HOURLY_PRICES[clamped];
}