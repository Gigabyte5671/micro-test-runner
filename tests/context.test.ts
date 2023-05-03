import test from '../src/index.js';

export default function contextTest (): void {

	class CandidateClass {
		public static c = 17;
		
		public static candidate (a: number, b: number): number {
			return a + b + this.c;
		}
	}

	test(CandidateClass.candidate)
		.context(CandidateClass)
		.logging('Context', 2)
		.times(3)
		.with([24, 48])
		.with([162, 5])
		.expect([89, (value: number) => (/[0-9]+/u).test(value.toString())]);
}
