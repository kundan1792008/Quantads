import test from "node:test";
import assert from "node:assert/strict";
import { BiddingEngine } from "../src/bidding/BiddingEngine";

test("BiddingEngine increases outcome price for higher-LTV audiences within limits", () => {
  const engine = new BiddingEngine();
  const baseline = engine.calculateOutcomeBid({
    baseOutcomePrice: 20,
    audience: {
      verifiedLtv: 25,
      intentScore: 0.4,
      conversionRate: 0.25
    }
  });
  const premium = engine.calculateOutcomeBid({
    baseOutcomePrice: 20,
    maxPrice: 40,
    audience: {
      verifiedLtv: 120,
      intentScore: 0.9,
      conversionRate: 0.65,
      recencyMultiplier: 1.1
    },
    marketPressure: 1.2
  });

  assert.ok(premium.finalBid > baseline.finalBid);
  assert.equal(premium.pricingModel, "outcome-based");
  assert.ok(premium.finalBid <= 40);
});

test("BiddingEngine throws on invalid baseOutcomePrice", () => {
  const engine = new BiddingEngine();
  assert.throws(() => {
    engine.calculateOutcomeBid({
      baseOutcomePrice: 0,
      audience: { verifiedLtv: 10, intentScore: 0.5, conversionRate: 0.3 }
    });
  });
});

test("BiddingEngine throws on invalid verifiedLtv", () => {
  const engine = new BiddingEngine();
  assert.throws(() => {
    engine.calculateOutcomeBid({
      baseOutcomePrice: 10,
      audience: { verifiedLtv: 0, intentScore: 0.5, conversionRate: 0.3 }
    });
  });
});
