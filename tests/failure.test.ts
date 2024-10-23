import test, { Severity } from '../src/index.js';

export default function failureTest (): void {
	function candidate (): string {
		try {
			test((a: any, b: any) => a + b)
				.logging('Failure Candidate', Severity.ERROR, undefined, true)
				.times(3)
				.with(196.5, 42)
				.with(10, undefined)
				.with('Hello', ' world')
				.expect(238.5, Number.isNaN, 9);

			return '';
		} catch (error) {
			return String(error);
		}
	}

	test(candidate)
		.logging('Failure', Severity.ERROR, undefined, true)
		.times(3)
		.expect(error => error.startsWith('Error: ✕ Failure Candidate test failed.\nExpected: 9\nReceived: Hello world'));
}
