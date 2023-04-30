# Micro Test-Runner

![node tests](https://github.com/gigabyte5671/micro-test-runner/actions/workflows/node-tests.yml/badge.svg?branch=main)

A minimal JavaScript test runner.

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

(Optional) Specify the number of times to run each test:
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

const result = test(apiCall)				// Test your `apiCall` function...
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
