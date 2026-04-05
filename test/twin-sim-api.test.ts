import test, { after } from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import { app } from "../src/server";
import { ArLocalizedAdCampaign, TwinSimulationRequest } from "../src/types";

const campaign: ArLocalizedAdCampaign = {
  id: "central-park-pass",
  title: "Central Park AR Pass",
  target: {
    latitude: 40.7794,
    longitude: -73.9632,
    radiusMeters: 200
  },
  notificationTitle: "AR pass nearby",
  notificationBody: "Claim your Central Park AR pass now.",
  webglOverlay: {
    sceneId: "central-park-pass",
    assetUrl: "https://cdn.quantads.example/ar/central-park-pass.glb",
    shaderPreset: "billboard",
    anchorMode: "world-locked",
    ctaLabel: "View pass"
  },
  quantchatMultiplier: {
    multiplier: 10,
    claimWindowSeconds: 20
  }
};

test("POST /api/v1/twin-sim summarizes triggered users and bonus claims", async () => {
  const server = app.listen(0);
  await once(server, "listening");

  try {
    const address = server.address();

    if (!address || typeof address === "string") {
      throw new Error("Expected a numeric listening port.");
    }

    const payload: TwinSimulationRequest = {
      campaign,
      audience: [
        {
          userId: "twin-1",
          route: [
            { latitude: 40.7805, longitude: -73.9632 },
            { latitude: 40.7794, longitude: -73.9632 }
          ],
          quantchatOpenDelaySeconds: 10
        },
        {
          userId: "twin-2",
          route: [{ latitude: 40.7808, longitude: -73.9632 }],
          quantchatOpenDelaySeconds: 50
        }
      ]
    };

    const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/twin-sim`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });

    assert.equal(response.status, 200);

    const body = (await response.json()) as {
      summary: { triggerCount: number; projectedQuantchatBonusClaims: number };
      users: Array<{ userId: string; triggered: boolean }>;
    };

    assert.equal(body.summary.triggerCount, 2);
    assert.equal(body.summary.projectedQuantchatBonusClaims, 1);
    assert.equal(body.users.length, 2);
  } finally {
    server.close();
  }
});

after(() => {
  app.close();
});
