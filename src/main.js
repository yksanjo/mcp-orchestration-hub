const PROJECT = "mcp-orchestration-hub";
const DOMAIN = "infrastructure";
const GOAL = "service health and change events to reduce operational risk";

import { classifyScore, computeScore } from "./scoring.js";

export function assess(signal) {
  const { score, reasons } = computeScore(signal);
  const status = classifyScore(score);
  const recommendations = status === "critical"
    ? ["page-oncall", "open-incident", "contain-impact"]
    : status === "high"
      ? ["create-ticket", "assign-owner", "increase-observability"]
      : status === "medium"
        ? ["queue-review", "collect-context"]
        : ["record-signal"];
  return {
    project: PROJECT,
    domain: DOMAIN,
    goal: GOAL,
    score,
    status,
    reasons,
    recommendations,
    reason: "Context-aware baseline model for service health and change events to reduce operational risk.",
    timestamp: new Date().toISOString(),
  };
}

export function summarize(signal) {
  const result = assess(signal);
  return `${result.project} [${result.domain}] status=${result.status} score=${result.score.toFixed(2)}`;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(summarize("baseline health check with warning latency"));
}
