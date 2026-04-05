import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { simulateTwinAudience } from "./simulation/TwinSimulator";
import { BiddingEngine, OutcomeBidRequest } from "./bidding/BiddingEngine";
import { createOutcomeQuote, OutcomePaymentRequest } from "./payments/x402";
import { TwinSimulationRequest } from "./types";

const biddingEngine = new BiddingEngine();

const sendJson = (response: ServerResponse, statusCode: number, body: unknown): void => {
  response.writeHead(statusCode, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
};

const readJson = async (request: IncomingMessage): Promise<unknown> => {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : (chunk as Buffer));
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
};

export const app = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      sendJson(response, 200, { status: "ok", service: "quantads" });
      return;
    }

    // Geofence-based twin simulation
    if (request.method === "POST" && request.url === "/api/v1/twin-sim") {
      const payload = await readJson(request) as TwinSimulationRequest;
      sendJson(response, 200, simulateTwinAudience(payload));
      return;
    }

    // Outcome-based bid calculation
    if (request.method === "POST" && request.url === "/api/v1/bid") {
      const payload = await readJson(request);
      const result = biddingEngine.calculateOutcomeBid(payload as OutcomeBidRequest);
      sendJson(response, 200, result);
      return;
    }

    // x402 payment quote
    if (request.method === "POST" && request.url === "/api/v1/payments/x402/quote") {
      const payload = await readJson(request) as OutcomePaymentRequest;
      sendJson(response, 200, createOutcomeQuote(payload));
      return;
    }

    sendJson(response, 404, { error: "Not found" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    sendJson(response, 400, { error: message });
  }
});

if (require.main === module) {
  const port = Number(process.env["PORT"] ?? "3000");
  app.listen(port, () => {
    process.stdout.write(`Quantads API listening on port ${port}\n`);
  });
}
