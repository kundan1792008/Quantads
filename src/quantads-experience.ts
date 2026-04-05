import { distanceMeters, isWithinTarget } from "./geofence";
import {
  ArLaunchState,
  ArLocalizedAdCampaign,
  EncounterResult,
  LocalNotificationAction,
  LocationEvent,
  QuantchatBonusResult
} from "./types";

const NOTIFICATION_CHANNEL_ID = "quantads-geo-ar";
const CAMERA_EXPERIENCE_ROUTE = "/experience/ar-localized-ad";

export const capacitorPluginManifest = {
  backgroundGeolocation: "@capacitor-community/background-geolocation",
  localNotifications: "@capacitor/local-notifications",
  app: "@capacitor/app"
} as const;

export const capacitorBackgroundTrackingConfig = {
  desiredAccuracy: "high",
  distanceFilterMeters: 15,
  stopOnTerminate: false,
  startOnBoot: true,
  stale: false,
  notificationTitle: "Quantads nearby opportunity tracking",
  notificationText: "Quantads is watching for localized AR offers."
} as const;

export function createLocalNotification(
  campaign: ArLocalizedAdCampaign,
  locationEvent: LocationEvent
): LocalNotificationAction {
  return {
    id: `${campaign.id}:${locationEvent.userId}:${locationEvent.occurredAt}`,
    title: campaign.notificationTitle,
    body: campaign.notificationBody,
    scheduleAt: locationEvent.occurredAt,
    channelId: NOTIFICATION_CHANNEL_ID,
    deepLink: `quantads://open/ar-localized-ad?campaignId=${encodeURIComponent(campaign.id)}&userId=${encodeURIComponent(locationEvent.userId)}`,
    extras: {
      campaignId: campaign.id,
      sceneId: campaign.webglOverlay.sceneId,
      quantchatMultiplier: campaign.quantchatMultiplier.multiplier,
      claimWindowSeconds: campaign.quantchatMultiplier.claimWindowSeconds
    }
  };
}

export function buildArLaunchState(
  campaign: ArLocalizedAdCampaign,
  locationEvent: LocationEvent
): ArLaunchState {
  return {
    openCameraView: true,
    experienceRoute: `${CAMERA_EXPERIENCE_ROUTE}?campaignId=${encodeURIComponent(campaign.id)}`,
    overlay: campaign.webglOverlay,
    campaignId: campaign.id,
    userCoordinate: locationEvent.coordinate
  };
}

export function evaluateEncounter(
  campaign: ArLocalizedAdCampaign,
  locationEvent: LocationEvent
): EncounterResult {
  const distance = distanceMeters(locationEvent.coordinate, campaign.target);

  if (!isWithinTarget(locationEvent.coordinate, campaign.target)) {
    return {
      triggered: false,
      distanceMeters: distance
    };
  }

  return {
    triggered: true,
    distanceMeters: distance,
    notification: createLocalNotification(campaign, locationEvent),
    arLaunchState: buildArLaunchState(campaign, locationEvent)
  };
}

export function resolveQuantchatBonus(
  campaign: ArLocalizedAdCampaign,
  notificationOpenedAt: string | undefined,
  quantchatOpenedAt: string | undefined
): QuantchatBonusResult {
  if (!notificationOpenedAt || !quantchatOpenedAt) {
    return {
      eligible: false,
      multiplier: 1,
      reason: "notification-not-opened"
    };
  }

  const openDelaySeconds =
    (Date.parse(quantchatOpenedAt) - Date.parse(notificationOpenedAt)) / 1000;

  if (openDelaySeconds <= campaign.quantchatMultiplier.claimWindowSeconds) {
    return {
      eligible: true,
      multiplier: campaign.quantchatMultiplier.multiplier,
      reason: "within-window"
    };
  }

  return {
    eligible: false,
    multiplier: 1,
    reason: "outside-window"
  };
}
