import test from "node:test";
import assert from "node:assert/strict";
import { distanceMeters } from "../src/geofence";
import {
  buildArLaunchState,
  createLocalNotification,
  evaluateEncounter,
  resolveQuantchatBonus
} from "../src/quantads-experience";
import { ArLocalizedAdCampaign, LocationEvent } from "../src/types";

const campaign: ArLocalizedAdCampaign = {
  id: "coffee-run",
  title: "Coffee Run AR Promo",
  target: {
    latitude: 37.7749,
    longitude: -122.4194,
    radiusMeters: 75
  },
  notificationTitle: "Nearby AR offer unlocked",
  notificationBody: "Open Quantads to view the localized ad in AR.",
  webglOverlay: {
    sceneId: "coffee-run-portal",
    assetUrl: "https://cdn.quantads.example/ar/coffee-run.glb",
    shaderPreset: "portal",
    anchorMode: "world-locked",
    ctaLabel: "Open offer"
  },
  quantchatMultiplier: {
    multiplier: 10,
    claimWindowSeconds: 30
  }
};

const locationEvent: LocationEvent = {
  userId: "user-123",
  coordinate: {
    latitude: 37.775,
    longitude: -122.4194
  },
  occurredAt: "2026-04-02T05:13:44.006Z",
  platform: "ios"
};

test("distanceMeters returns small distance for nearby coordinates", () => {
  const distance = distanceMeters(locationEvent.coordinate, campaign.target);
  assert.ok(distance > 0);
  assert.ok(distance < campaign.target.radiusMeters);
});

test("createLocalNotification includes campaign deep link and extras", () => {
  const notification = createLocalNotification(campaign, locationEvent);
  assert.match(notification.deepLink, /campaignId=coffee-run/);
  assert.equal(notification.extras.quantchatMultiplier, 10);
});

test("buildArLaunchState opens camera view with webgl overlay", () => {
  const launchState = buildArLaunchState(campaign, locationEvent);
  assert.equal(launchState.openCameraView, true);
  assert.equal(launchState.overlay.sceneId, "coffee-run-portal");
  assert.match(launchState.experienceRoute, /ar-localized-ad/);
});

test("evaluateEncounter triggers only inside the geofence", () => {
  const triggered = evaluateEncounter(campaign, locationEvent);
  assert.equal(triggered.triggered, true);

  const missed = evaluateEncounter(campaign, {
    ...locationEvent,
    coordinate: {
      latitude: 37.7849,
      longitude: -122.4194
    }
  });

  assert.equal(missed.triggered, false);
  assert.ok(missed.distanceMeters > campaign.target.radiusMeters);
});

test("resolveQuantchatBonus grants the 10x multiplier only within the claim window", () => {
  const granted = resolveQuantchatBonus(
    campaign,
    "2026-04-02T05:13:44.006Z",
    "2026-04-02T05:14:00.006Z"
  );
  assert.deepEqual(granted, {
    eligible: true,
    multiplier: 10,
    reason: "within-window"
  });

  const denied = resolveQuantchatBonus(
    campaign,
    "2026-04-02T05:13:44.006Z",
    "2026-04-02T05:15:00.006Z"
  );
  assert.equal(denied.eligible, false);
  assert.equal(denied.multiplier, 1);
  assert.equal(denied.reason, "outside-window");
});
