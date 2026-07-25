// src/data/gridPricing.ts (TEMP stub — delete once Person A pushes real one)
import { HourlyPrice } from "../tools/optimizerHelpers";

export const gridPricing: HourlyPrice[] = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  pricePerKwh: hour >= 18 && hour <= 21 ? 12 : 5,
}));
