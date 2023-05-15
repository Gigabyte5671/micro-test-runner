# Micro Test-Runner

![node tests](https://github.com/gigabyte5671/micro-test-runner/actions/workflows/node-tests.yml/badge.svg?branch=main) ![npm](https://img.shields.io/npm/dt/micro-test-runner) ![npm bundle size](https://img.shields.io/bundlephobia/min/micro-test-runner)

A minimal JavaScript test runner.

[Package](https://www.npmjs.com/package/micro-test-runner) • [Demo](https://micro-test-runner.zakweb.dev/)

## Installation

```bash
npm install micro-test-runner
```

Include Micro Test-Runner in your project with:
```javascript
import test from 'micro-test-runner';

// Or

const test = require('micro-test-runner');
```

## Usage

Create a new test-runner with:
```javascript
const testRunner = test(yourFunction);
```

If your function is asynchronous, chain the `.async` method:
```javascript
testRunner.async();
```

If your function requires a specific context (`this`), chain the `.context` method:
```javascript
class YourClass {
	public static c = 17;
	
	public static yourFunction (a, b) {
		return a + b + this.c;
	}
}

// ...

testRunner.context(YourClass);
```

Specify the arguents to pass into your function:
```javascript
testRunner.with([arg1, arg2, arg3, etc...]);
```

You can chain `.with` methods to run multiple sequential tests with different arguments:
```javascript
testRunner.with([arg1, arg2])	// Test 1.
          .with([argA, argB])	// Test 2.
          .with([argX, argY])	// Test 3.
```

Optionally, specify the number of times to run each test:
```javascript
testRunner.times(5);	// Will run each of the sequential tests 5 times.
```

Specify the results you expect your function to return from each test:
```javascript
testRunner.expect([result1, result2, result3, etc...]);
```
If a function is passed as an expected result, it will be evaluated on the value that the candidate returned for that particular test. This function should then return a boolean indicating whether the value was correct or not. For example:
```javascript
testRunner.expect([result1, result2, (value) => (/[0-9]+/u).test(value)]);
```

## Results

Calling `.expect` will also run the test, returning `true` if your function passes, `false` if not.

If your function is asynchronous, you will need to `await` this value or use `.then()`.

Alternately, if you'd like Micro Test-Runner to log the results for you, you can chain the `.logging()` method.
```javascript
import test, { FailureLogSeverity } from 'micro-test-runner';

test(yourFunction)							  // Test `yourFunction`...
	.times(3)							  // 3 times...
	.logging('Function Name', FailureLogSeverity.WARN, ['✅', '❌']) // Logging the outcome...
	.with(['Hello', 'world!'])					  // With these arguments...
	.expect(['Hello world!']);					  // And expect these results.
```
This can remove the need to handle the value returned from `.expect()`.

## Examples

```javascript
import test from 'micro-test-runner';
import { yourFunction } from './yourProject';

const result = test(yourFunction)	// Test `yourFunction`...
	.times(3)			// 3 times...
	.with(['Hello', 'world!'])	// With these arguments...
	.expect(['Hello world!']);	// And expect these results.

if (result) {
	// Your test passed.
} else {
	// Your test failed.
}
```

Async:

```javascript
import test from 'micro-test-runner';
import { apiCall } from './yourProject';

const result = await test(apiCall)			// Test your `apiCall` function...
	.async()					// Asynchronously...
	.times(3)					// 3 times...
	.with(['https://example.com/api', '/endpoint'])	// With these arguments...
	.expect([{ data: 'Hello world!' }]);		// And expect these results.

if (result) {
	// Your test passed.
} else {
	// Your test failed.
}
```

Promise:

```javascript
import test from 'micro-test-runner';
import { apiCall } from './yourProject';

test(apiCall)					// Test your `apiCall` function...
	.async()					// Asynchronously...
	.times(3)					// 3 times...
	.with(['https://example.com/api', '/endpoint'])	// With these arguments...
	.expect([{ data: 'Hello world!' }])		// And expect these results.
	.then(result => {
		if (result) {
			// Your test passed.
		} else {
			// Your test failed.
		}
	});
```

Performance Logging:

```javascript
import test, { FailureLogSeverity } from 'micro-test-runner';
import { slowFunction } from './yourProject';

test(slowFunction)					// Test `slowFunction`...
	.times(3)							// 3 times...
	.logging('Slow', FailureLogSeverity.WARN, undefined, 'table') // Logging the outcome and performance to a table...
	.with([2, 3])					// With these arguments...
	.with([4, 1])					// And these arguments...
	.expect([(value, runIndex, duration) => { 	// And expect these results (verifying them with a function).
		return
			value === 5			// Check the value returned by `slowFunction`.
			&& duration < 200;		// Check that `slowFunction` took less than 200ms.
	}]);

/* Console output...

✓ Slow test passed in 1004.742ms (x̄ 160.779ms per run, over 6 runs):
  ╭──────┬───────┬───────────────╮
  │ Test │  Run  │ Duration (ms) │
  ├──────┼───────┼───────────────┤
  │ 1    │ 1     │       150.812 │
  │      │ 2     │       184.766 │
  │      │ 3     │       161.057 │
  ├──────┼───────┼───────────────┤
  │ 2    │ 1     │       162.936 │
  │      │ 2     │       159.213 │
  │      │ 3     │       145.887 │
  ╰──────┴───────┴───────────────╯

*/
```
