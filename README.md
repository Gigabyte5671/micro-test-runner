# Micro Test-Runner

![node tests](https://github.com/gigabyte5671/micro-test-runner/actions/workflows/node-tests.yml/badge.svg?branch=main)

A minimal JavaScript test runner.

## Installation

```bash
npm install micro-test-runner
```

## Usage

Create a new test-runner with:
```javascript
const testRunner = test(yourFunction);
```

Specify the arguents to pass into your function with:
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

## Example

```javascript
import test from 'micro-test-runner';
import { yourFunction } from './yourProject';

const result = test(yourFunction)	// The expression or function you would like to test.
	.times(3)			// Run the test 3 times.
	.with(['Hello', 'world!'])	// Pass any arguments you would like to test your function with.
	.expect(['Hello world!'])		// The result you expect your expression/function to return.

if (result) {
	// Your test passed.
} else {
	// Your test failed.
}
```
