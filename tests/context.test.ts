import test from '../src/index';

export default function contextTest (): void {

	class CandidateClass {
		public static c = 17;
		
		public static candidate (a: number, b: number): number {
			return a + b + this.c;
		}
	}

	const result =
		test(CandidateClass.candidate)
		.context(CandidateClass)
		.times(3)
		.with([24, 48])
		.with([162, 5])
		.expect([89, (value: number) => (/[0-9]+/u).test(value.toString())]);
	
	if (!result) {
		throw new Error('Context test failed.');
	}
	
	console.log('Context test passed.');
}
