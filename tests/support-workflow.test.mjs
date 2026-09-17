import assert from "node:assert/strict";
import { test } from "node:test";
import { runSupportWorkflow } from "../lib/support-workflow.ts";

function fakeClient() {
  const requests = [];
  const client = { responses: { async create(request) {
    requests.push(request);
    if (requests.length === 1) return { output: [{ type: "function_call", name: "check_refund_policy", call_id: "call_1", arguments: "{}", status: "completed" }], usage: { input_tokens: 100, output_tokens: 20, input_tokens_details: { cached_tokens: 0 } } };
    return { output_text: "A person will review your request. No refund has been issued.", output: [], usage: { input_tokens: 150, output_tokens: 30, input_tokens_details: { cached_tokens: 0 } } };
  } } };
  return { client, requests };
}

test("support agent calls policy tool and requires review after 30 days", async () => {
  const { client, requests } = fakeClient();
  const steps = [];
  const result = await runSupportWorkflow({ question: "Could I get a refund?", daysSinceDelivery: 34, amountUsd: 74.99 }, client, steps, Date.now());
  assert.equal(result.status, "review");
  assert.equal(result.policy.humanReviewRequired, true);
  assert.equal(requests.length, 2);
  assert.equal(requests[0].model, "gpt-4o-mini");
  assert.equal(requests[0].store, false);
  assert.equal(requests[0].tool_choice.name, "check_refund_policy");
  assert.equal(requests[1].tool_choice, "none");
  const toolResult = requests[1].input.find((item) => item.type === "function_call_output");
  assert.equal(JSON.parse(toolResult.output).decision, "human_review_required");
  assert.deepEqual(steps.map((step) => step.kind), ["model", "tool", "output"]);
  assert.ok(result.costUsd > 0);
});

test("support agent marks an in-window request as successful draft", async () => {
  const { client, requests } = fakeClient();
  const result = await runSupportWorkflow({ question: "Could I get a refund?", daysSinceDelivery: 30, amountUsd: 20 }, client, [], Date.now());
  assert.equal(result.status, "success");
  assert.equal(JSON.parse(requests[1].input.find((item) => item.type === "function_call_output").output).eligible, true);
});

test("support agent rejects a model response that skipped its tool", async () => {
  const client = { responses: { async create() { return { output: [], usage: null }; } } };
  await assert.rejects(runSupportWorkflow({ question: "Could I get a refund?", daysSinceDelivery: 5, amountUsd: 20 }, client, [], Date.now()), /Policy tool was not called/);
});
