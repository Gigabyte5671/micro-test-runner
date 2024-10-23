import test, { Severity } from '../src/index.js';

export default function performanceTest (): void {

	function candidate (): Promise<number> {
		return new Promise((resolve) => {
			setTimeout(() => resolve(1), 200);
		});
	}

	test(candidate)
		.logging('Performance', Severity.WARN, undefined, 'table')
		.times(3)
		.with()
		.with()
		.expect((result, run, duration) => 150 < duration && duration < 300);
}
