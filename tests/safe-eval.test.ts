import assert from "node:assert/strict";
import { test } from "node:test";

import { safeEvaluateCondition } from "../lib/safe-eval.ts";

test("evaluates the operators condition nodes need", () => {
  assert.equal(safeEvaluateCondition("5 > 3"), true);
  assert.equal(safeEvaluateCondition("3 > 5"), false);
  assert.equal(safeEvaluateCondition("3 >= 3"), true);
  assert.equal(safeEvaluateCondition("1 !== 2"), true);
  assert.equal(safeEvaluateCondition('"a" === "a"'), true);
  assert.equal(safeEvaluateCondition('"a" == "b"'), false);
  assert.equal(safeEvaluateCondition("null == null"), true);
  assert.equal(safeEvaluateCondition("true && false"), false);
  assert.equal(safeEvaluateCondition("true || false"), true);
  assert.equal(safeEvaluateCondition("!false"), true);
  assert.equal(safeEvaluateCondition("(1 < 2) && (2 < 3)"), true);
  assert.equal(safeEvaluateCondition("-2 < -1"), true);
});

test("handles resolved-variable shapes (JSON literals)", () => {
  // workflow-execution resolves $node.refs to JSON.stringify'd values first,
  // so the evaluator sees e.g. `3 > 5` or `"ok" === "ok"`.
  assert.equal(safeEvaluateCondition('"ok" === "ok"'), true);
  assert.equal(safeEvaluateCondition("3.14 > 3"), true);
  assert.equal(safeEvaluateCondition('"line\\nbreak" === "line\\nbreak"'), true);
});

// The whole point of safe-eval: user-authored conditions must never execute
// code. Each payload must be rejected (throw) or evaluate falsy — and the
// fact that this test process is still alive afterwards is the real assert.
const ATTACK_PAYLOADS = [
  "process.exit(1)",
  "require('child_process').execSync('id')",
  "globalThis.process.mainModule",
  "(() => { throw new Error('pwn') })()",
  "constructor.constructor('return process')()",
  "`${process.env.HOME}`",
  "1; process.exit(1)",
  "a.b.c",
  "fetch('https://attacker.example')",
  "[].constructor",
  "new Date()",
  "x = 1",
];

for (const payload of ATTACK_PAYLOADS) {
  test(`rejects code execution attempt: ${payload}`, () => {
    let result: boolean | undefined;
    let threw = false;
    try {
      result = safeEvaluateCondition(payload);
    } catch {
      threw = true;
    }
    assert.ok(
      threw || result === false,
      `payload was accepted as truthy: ${payload}`
    );
  });
}
