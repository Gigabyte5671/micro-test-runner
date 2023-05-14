import test, { FailureLogSeverity } from '../src/index.js';

export default function performanceTest (): void {

	function candidate (): Promise<number> {
		return new Promise((resolve) => {
			setTimeout(() => resolve(1), 200);
		});
	}

	test(candidate)
		.logging('Performance', FailureLogSeverity.WARN, undefined, 'table')
		.async()
		.times(3)
		.with([])
		.with([])
		.expect([(value: number, duration: number) => 150 < duration && duration < 300]);
}
