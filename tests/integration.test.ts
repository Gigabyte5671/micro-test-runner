import test from '../src/index';

export default function integrationTest (): void {

	function candidate (a: number, b: number) {
		return a + b;
	}

	const result = test(candidate)
		.times(3)
		.with([24, 48])
		.expect(72);
	
	if (!result) {
		throw new Error('Integration test failed.');
	}
	
	console.log('Integration test passed.');
}
