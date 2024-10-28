type Candidate<Args extends unknown[], Return = unknown> = (...args: Args) => Promise<Return> | Return;
type FailureSeverity = 'log' | 'warn' | 'error';
type PerformanceLogFormat = 'none' | 'average' | 'table';
type PerformanceMeasurement = { start: number, end: number };
type Validator<Return = unknown> = Return | ((result: Return, run: number, duration: number) => boolean);

interface TestResult {
	passed: boolean;
	expected?: unknown;
	received?: unknown;
};

class MicroTestRunner <Args extends unknown[], Return = unknown> {
	private candidate: Candidate<Args, Return>;
	private log = {
		name: <string | undefined> undefined,
		icons: ['✓', '✕'],
		severity: <FailureSeverity> 'log'
	};
	private candidateContext: any;
	private args: Args[] = [];
	private conditions: unknown[] = [];
	private runs = 1;
	private currentRun = 0;
	private performance = {
		format: <PerformanceLogFormat> 'none',
		measurements: <PerformanceMeasurement[][]> []
	};
	private passing: boolean[] = [];
	private result: TestResult = {
		passed: false
	};

	constructor (candidate: Candidate<Args, Return>) {
		this.candidate = candidate;
	}

	private get logMessage (): string {
		let performanceMessage = '';
		let performanceTable = '';
		if (this.result.passed && this.performance.format !== 'none' && this.performance.measurements.length > 0) {
			if (this.performance.format === 'table') {
				performanceTable = '\n  ╭───────┬───────┬───────────────╮\n  │ Test  │ Run   │ Duration (ms) │';
			}
			const startTimestamp = this.performance.measurements[0][0].start;
			const endTimestamp = this.performance.measurements[this.performance.measurements.length - 1][this.performance.measurements[this.performance.measurements.length - 1].length - 1].end;
			const testDuration = Number(endTimestamp - startTimestamp);
			let averageRunDuration = 0;
			let totalRuns = 0;
			this.performance.measurements.forEach((test, testIndex) => {
				if (this.performance.format === 'table') {
					performanceTable += '\n  ├───────┼───────┼───────────────┤';
				}
				test.forEach((run, runIndex) => {
					const runDuration = run.end - run.start;
					averageRunDuration += runDuration;
					if (this.performance.format === 'table') {
						performanceTable += `\n  │ ${runIndex === 0 ? (testIndex + 1).toString().padEnd(5, ' ') : '     '} │ ${(runIndex + 1).toString().padEnd(5, ' ')} │ ${runDuration.toFixed(3).padStart(13, ' ')} │`;
					}
					totalRuns++;
				});
			});
			if (this.performance.format === 'table') {
				performanceTable += '\n  ╰───────┴───────┴───────────────╯';
			}
			averageRunDuration = Number(averageRunDuration / totalRuns);
			performanceMessage = ` in ${testDuration.toFixed(3)}ms${ totalRuns > 1 ? ` (x̄ ${averageRunDuration.toFixed(3)}ms per run, over ${totalRuns} runs)` : ''}`;
		}
		const part1 = `${this.result.passed ? this.log.icons[0] : this.log.icons[1]} ${this.log.name} test ${this.result.passed ? 'passed' : 'failed'}`;
		const part2 = `${performanceMessage}`;
		const part3 = `${this.result.passed && this.performance.format === 'table' ? ':' : '.'}${performanceTable}`;
		const part4 = !this.result.passed && 'expected' in this.result ? `\nExpected: ${this.result.expected}` : '';
		const part5 = !this.result.passed && 'received' in this.result ? `\nReceived: ${this.result.received}` : '';
		return part1 + part2 + part3 + part4 + part5;
	}

	/**
	 * Log the test result with the appropriate severity.
	 */
	private logResult (): void {
		if (!this.result.passed) {
			if (this.log.severity === 'error') {
				throw new Error(this.logMessage);
			} else if (this.log.severity === 'warn') {
				console.warn(this.logMessage);
				return;
			}
		}
		console.info(this.logMessage);
	}

	/**
	 * Test an expression or function.
	 * @param candidate The expression/function to test.
	 * @returns The test-runner.
	 */
	static test <Args extends unknown[], Return = unknown> (candidate: Candidate<Args, Return>): MicroTestRunner<Args, Return> {
		return new MicroTestRunner<Args, Return>(candidate);
	}

	/**
	 * Automatically log the outcome of the test.
	 * @param name The name of the test.
	 * @param severity `(Optional)` The severity used to log the test's failure. Either `'log'`, `'warn'`, or `'error'`.
	 * @param icons `(Optional)` Icons used to visually indicate the outcome of the test.
	 * Default: `['✓', '✕']`.
	 * @param performance `(Optional)` Log the performance of each test run in the desired format:
	 * 
	 * • `'average'` - The average of all runs.
	 * 
	 * • `'table'` - A table showing the performance of each run.
	 */
	logging (name: string, severity: FailureSeverity = 'log', icons?: [string, string], performance: PerformanceLogFormat = 'none'): MicroTestRunner<Args, Return> {
		this.log.name = name;
		this.log.severity = severity;
		if (Array.isArray(icons) && icons.length === 2) {
			this.log.icons = icons;
		}
		if (globalThis.performance) {
			this.performance.format = performance;
		}
		if (typeof performance === 'string') {
			this.performance.format = performance;
		}
		return this;
	}

	/**
	 * Run the candidate function within a given context. Useful if the candidate needs access to a particular `this`.
	 * @param context The context.
	 */
	context (context: any): MicroTestRunner<Args, Return> {
		this.candidateContext = context;
		return this;
	}

	/**
	 * Run each test multiple times.
	 * @param number The number of times to run each test.
	 */
	times (number: number): MicroTestRunner<Args, Return> {
		this.runs = Math.max(Math.ceil(number), 1);
		return this;
	}

	/**
	 * Provide arguments to the candidate.
	 * @param args The arguments.
	 */
	with (...args: Args): MicroTestRunner<Args, Return> {
		this.args.push(args);
		return this;
	}

	/**
	 * The results to expect from each test.
	 * @param conditions The expected results.
	 * @returns `true` if all test runs passed, `false` if any run failed.
	 */
	async expect (...conditions: Validator<Awaited<Return>>[]): Promise<boolean> {
		this.conditions = conditions;

		if (!this.args.length) {
			this.args.push([] as unknown as Args);
		}

		let halt = false;
		for (const [index, argumentGroup] of this.args.entries()) {
			this.currentRun = 0;
			this.performance.measurements.push([]);
			while (this.currentRun < this.runs) {
				try {
					let runDuration: number | undefined = undefined;
					if (this.performance.format !== 'none') {
						this.performance.measurements[index].push({ start: performance.now(), end: 0 });
					}
					const runResult = await Promise.resolve(this.candidate.apply(this.candidateContext, argumentGroup));
					if (this.performance.format !== 'none') {
						this.performance.measurements[index][this.currentRun].end = performance.now();
						runDuration = this.performance.measurements[index][this.currentRun].end - this.performance.measurements[index][this.currentRun].start;
					}
					const condition = this.conditions[Math.min(index, this.conditions.length - 1)];
					const pass = typeof condition === 'function' ? condition(runResult, this.currentRun, runDuration) : runResult === condition;
					this.passing.push(pass);
					if (!pass) {
						halt = true;
						this.result.received = runResult;
						if (typeof condition !== 'function') {
							this.result.expected = condition;
						}
					}
				} catch (error) {
					console.warn('MicroTestRunner: Run failed with error:\n', error);
				}
				this.currentRun++;
				if (halt) break;
			}
			if (halt) break;
		}

		// Return false if any one of the tests failed.
		this.result.passed = !this.passing.includes(false);

		if (this.log.name) {
			this.logResult();
		}

		return this.result.passed;
	}
}

export default MicroTestRunner.test;
