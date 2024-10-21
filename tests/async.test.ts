import test from '../src/index.js';

export default function asyncTest (): void {

	function candidate (a: number, b: number): Promise<number> {
		return new Promise((resolve) => {
			setTimeout(() => resolve(a + b), 250);
		});
	}

	test(candidate)
		.logging('Async Logging', 2, undefined, true)
		.async()
		.times(6)
		.with(24, 48)
		.with(162, 5)
		.expect(72, (value: number) => (/[0-9]+/u).test(value.toString()))
		.then(result => {
			if (!result) {
				throw new Error('✕ Async test failed.');
			}
			
			console.log('✓ Async test passed.');
		});
}
