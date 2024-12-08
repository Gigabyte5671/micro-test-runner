import test from '../src/index.js';

export default function failureTest (): void {
	async function candidate (): Promise<string> {
		try {
			await test((a: any, b: any) => a + b)
				.logging('Failure Candidate', 'error', undefined, 'average')
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
		.logging('Failure', 'error', undefined, 'average')
		.times(3)
		.expect(error => error.startsWith('Error: ✕ Failure Candidate test failed.\nExpected: 9\nReceived: Hello world'));
}
