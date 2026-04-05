export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface GeofenceTarget extends Coordinate {
  radiusMeters: number;
}

export interface QuantchatMultiplierConfig {
  multiplier: number;
  claimWindowSeconds: number;
}

export interface WebGLOverlayConfig {
  sceneId: string;
  assetUrl: string;
  shaderPreset: "billboard" | "portal" | "lightfield";
  anchorMode: "world-locked";
  ctaLabel: string;
}

export interface ArLocalizedAdCampaign {
  id: string;
  title: string;
  target: GeofenceTarget;
  notificationTitle: string;
  notificationBody: string;
  webglOverlay: WebGLOverlayConfig;
  quantchatMultiplier: QuantchatMultiplierConfig;
}

export interface LocationEvent {
  userId: string;
  coordinate: Coordinate;
  occurredAt: string;
  platform: "ios" | "android" | "web";
}

export interface LocalNotificationAction {
  id: string;
  title: string;
  body: string;
  scheduleAt: string;
  channelId: string;
  deepLink: string;
  extras: Record<string, string | number | boolean>;
}

export interface ArLaunchState {
  openCameraView: boolean;
  experienceRoute: string;
  overlay: WebGLOverlayConfig;
  campaignId: string;
  userCoordinate: Coordinate;
}

export interface QuantchatBonusResult {
  eligible: boolean;
  multiplier: number;
  reason: "within-window" | "outside-window" | "notification-not-opened";
}

export interface EncounterResult {
  triggered: boolean;
  distanceMeters: number;
  notification?: LocalNotificationAction;
  arLaunchState?: ArLaunchState;
}

export interface SimulatedAudienceMember {
  userId: string;
  route: Coordinate[];
  quantchatOpenDelaySeconds?: number;
}

export interface TwinSimulationRequest {
  campaign: ArLocalizedAdCampaign;
  audience: SimulatedAudienceMember[];
}

export interface TwinSimulationSummary {
  triggerCount: number;
  projectedNotificationOpens: number;
  projectedQuantchatBonusClaims: number;
  averageTriggerDistanceMeters: number;
}

export interface TwinSimulationResponse {
  summary: TwinSimulationSummary;
  users: Array<{
    userId: string;
    triggered: boolean;
    distanceMeters: number | null;
    notificationDeepLink?: string;
    quantchatBonusEligible?: boolean;
  }>;
}
