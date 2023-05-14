import test, { FailureLogSeverity } from '../src/index.js';

export default function integrationTest (): void {

	function candidate (a: number, b: number): number {
		return a + b;
	}

	test(candidate)
		.logging('Integration', FailureLogSeverity.ERROR, undefined, true)
		.times(3)
		.with([24, 48])
		.with([162, 5])
		.expect([72, (value: number) => (/[0-9]+/u).test(value.toString())]);
}
