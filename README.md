# Micro Test-Runner

![node tests](https://github.com/gigabyte5671/micro-test-runner/actions/workflows/node-tests.yml/badge.svg?branch=main)

A minimal JavaScript test runner.

## Installation

```bash
npm install micro-test-runner
```

## Usage

```javascript
import test from 'micro-test-runner';
import { yourFunction } from './yourProject';

const result = test(yourFunction)	// The expression or function you would like to test.
	.times(3)			// Run the test 3 times.
	.with(['Hello', 'world!'])	// Pass any arguments you would like to test your function with.
	.expect('Hello world!')		// The result you expect your expression/function to return.

if (result) {
	// Your test passed.
} else {
	// Your test failed.
}
```
