export const results = {
  passed: 0,
  failed: 0,
  failures: [],
};

// Run a named test and collect pass/fail counts.
export function test(name, fn) {
  try {
    fn();
    results.passed++;
    console.log(`  PASS: ${name}`);
  } catch (error) {
    results.failed++;
    results.failures.push({ name, error: error.message });
    console.error(`  FAIL: ${name}`);
    console.error(`        ${error.message}`);
  }
}

// Assert that a condition is truthy.
export function assert(condition, message = 'Assertion failed') {
  if (!condition) throw new Error(message);
}

// Assert strict equality.
export function assertEqual(actual, expected, message = 'Values should match') {
  if (actual !== expected) throw new Error(`${message}: expected ${expected}, got ${actual}`);
}

// Print aggregate test results and set Node's exit code when available.
export function summarize() {
  console.log('');
  console.log(`Results: ${results.passed} passed, ${results.failed} failed`);
  if (results.failures.length > 0) {
    results.failures.forEach(failure => console.log(`  - ${failure.name}: ${failure.error}`));
  }
  if (typeof process !== 'undefined') {
    process.exitCode = results.failed > 0 ? 1 : 0;
  }
}
