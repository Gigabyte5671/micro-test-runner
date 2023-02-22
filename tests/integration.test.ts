import test from '../src/index';

export default function integrationTest (): void {

	function candidate (a: number, b: number) {
		return a + b;
	}

	const result = test(candidate)
		.times(3)
		.with([24, 48])
		.with([162, 5])
		.expect([72, (value: number) => (/[0-9]+/u).test(value.toString())]);
	
	if (!result) {
		throw new Error('Integration test failed.');
	}
	
	console.log('Integration test passed.');
}
