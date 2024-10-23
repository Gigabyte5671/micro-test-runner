/**
 * The severity with which to log test failures.
 */
export enum Severity {
	LOG,
	WARN,
	ERROR
}

type Candidate<Async extends 'sync' | 'async', Args extends unknown[], Return = unknown> = (...args: Args) => (Async extends 'async' ? Promise<Return> : Return);
type PerformanceLogFormat = 'average' | 'table';
type PerformanceMeasurement = { start: number, end: number };
type Validator<Return = unknown> = Return | ((result: Return, run: number, duration: number) => boolean);

interface TestResult {
	passed: boolean;
	expected?: unknown;
	received?: unknown;
};

class MicroTestRunner <Async extends 'sync' | 'async', Args extends unknown[], Return = unknown> {
	private candidate: Candidate<Async, Args, Return>;
	private log = {
		name: <string | undefined> undefined,
		icons: ['✓', '✕'],
		severity: Severity.LOG
	};
	private asynchronous = 'sync' as Async;
	private candidateContext: any;
	private args: Args[] = [];
	private conditions: unknown[] = [];
	private runs = 1;
	private currentRun = 0;
	private performance = {
		enabled: false,
		logFormat: <PerformanceLogFormat> 'average',
		measurements: <PerformanceMeasurement[][]> []
	};
	private passing: boolean[] = [];
	private result: TestResult = {
		passed: false
	};

	constructor (candidate: Candidate<Async, Args, Return>) {
		this.candidate = candidate;
	}

	private get logMessage (): string {
		let performanceMessage = '';
		let performanceTable = '';
		if (this.result.passed && this.performance.enabled && this.performance.measurements.length > 0) {
			if (this.performance.logFormat === 'table') {
				performanceTable = '\n  ╭───────┬───────┬───────────────╮\n  │ Test  │ Run   │ Duration (ms) │';
			}
			const startTimestamp = this.performance.measurements[0][0].start;
			const endTimestamp = this.performance.measurements[this.performance.measurements.length - 1][this.performance.measurements[this.performance.measurements.length - 1].length - 1].end;
			const testDuration = Number(endTimestamp - startTimestamp);
			let averageRunDuration = 0;
			let totalRuns = 0;
			this.performance.measurements.forEach((test, testIndex) => {
				if (this.performance.logFormat === 'table') {
					performanceTable += '\n  ├───────┼───────┼───────────────┤';
				}
				test.forEach((run, runIndex) => {
					const runDuration = run.end - run.start;
					averageRunDuration += runDuration;
					if (this.performance.logFormat === 'table') {
						performanceTable += `\n  │ ${runIndex === 0 ? (testIndex + 1).toString().padEnd(5, ' ') : '     '} │ ${(runIndex + 1).toString().padEnd(5, ' ')} │ ${runDuration.toFixed(3).padStart(13, ' ')} │`;
					}
					totalRuns++;
				});
			});
			if (this.performance.logFormat === 'table') {
				performanceTable += '\n  ╰───────┴───────┴───────────────╯';
			}
			averageRunDuration = Number(averageRunDuration / totalRuns);
			performanceMessage = ` in ${testDuration.toFixed(3)}ms${ totalRuns > 1 ? ` (x̄ ${averageRunDuration.toFixed(3)}ms per run, over ${totalRuns} runs)` : ''}`;
		}
		const part1 = `${this.result.passed ? this.log.icons[0] : this.log.icons[1]} ${this.log.name} test ${this.result.passed ? 'passed' : 'failed'}`;
		const part2 = `${performanceMessage}`;
		const part3 = `${this.result.passed && this.performance.logFormat === 'table' ? ':' : '.'}${performanceTable}`;
		const part4 = !this.result.passed && 'expected' in this.result ? `\nExpected: ${this.result.expected}` : '';
		const part5 = !this.result.passed && 'received' in this.result ? `\nReceived: ${this.result.received}` : '';
		return part1 + part2 + part3 + part4 + part5;
	}

	/**
	 * Log the test result with the appropriate severity.
	 */
	private logResult (): void {
		if (!this.result.passed) {
			if (this.log.severity === Severity.ERROR) {
				throw new Error(this.logMessage);
			} else if (this.log.severity === Severity.WARN) {
				console.warn(this.logMessage);
				return;
			}
		}
		console.log(this.logMessage);
	}

	/**
	 * Test an expression or function.
	 * @param candidate The expression/function to test.
	 * @returns The test-runner.
	 */
	static test <Args extends unknown[], Return = unknown> (candidate: Candidate<'sync', Args, Return>): MicroTestRunner<'sync', Args, Return> {
		return new MicroTestRunner<'sync', Args, Return>(candidate);
	}

	/**
	 * Automatically log the outcome of the test.
	 * @param name The name of the test.
	 * @param severity `(Optional)` The severity used to log the test's failure.
	 * 
	 * • `0 - console.log`
	 * 
	 * • `1 - console.warn`
	 * 
	 * • `2 - throw`
	 * @param icons `(Optional)` Icons used to visually indicate the outcome of the test.
	 * Default: `['✓', '✕']`.
	 * @param performance `(Optional)` Log the performance of each test run in the desired format:
	 * 
	 * • `true` - Average of all runs.
	 * 
	 * • `'average'` - Average of all runs.
	 * 
	 * • `'table'` - A table showing the performance of each run.
	 */
	logging (name: string, severity = Severity.LOG, icons?: [string, string], performance: boolean | PerformanceLogFormat = false): MicroTestRunner<Async, Args, Return> {
		this.log.name = name;
		this.log.severity = severity;
		if (Array.isArray(icons) && icons.length === 2) {
			this.log.icons = icons;
		}
		this.performance.enabled = Boolean(performance) && Boolean(globalThis.performance);
		if (typeof performance === 'string') {
			this.performance.logFormat = performance;
		}
		return this;
	}

	/**
	 * Run each test asynchronously.
	 */
	async (): MicroTestRunner<'async', Args, Return> {
		this.asynchronous = 'async' as Async;
		return this as MicroTestRunner<'async', Args, Return>;
	}

	/**
	 * Run the candidate function within a given context. Useful if the candidate needs access to a particular `this`.
	 * @param context The context.
	 */
	context (context: any): MicroTestRunner<Async, Args, Return> {
		this.candidateContext = context;
		return this;
	}

	/**
	 * Run each test multiple times.
	 * @param number The number of times to run each test.
	 */
	times (number: number): MicroTestRunner<Async, Args, Return> {
		this.runs = Math.max(Math.ceil(number), 1);
		return this;
	}

	/**
	 * Provide arguments to the candidate.
	 * @param args The arguments.
	 */
	with (...args: Args): MicroTestRunner<Async, Args, Return> {
		this.args.push(args);
		return this;
	}

	/**
	 * The results to expect from each test.
	 * @param conditions The expected results.
	 * @returns `true` if all test runs passed, `false` if any run failed.
	 */
	expect (...conditions: Validator<Awaited<Return>>[]): Async extends 'async' ? Promise<boolean> : boolean {
		this.conditions = conditions;

		if (!this.args.length) {
			this.args.push([] as unknown as Args);
		}

		// Asynchronous:
		if (this.asynchronous === 'async') {
			const promise = new Promise<boolean>(async (resolve) => {
				let halt = false;
				for (const [index, argumentGroup] of this.args.entries()) {
					this.currentRun = 0;
					this.performance.measurements.push([]);
					while (this.currentRun < this.runs) {
						try {
							let runDuration: number | undefined = undefined;
							if (this.performance.enabled) {
								this.performance.measurements[index].push({ start: performance.now(), end: 0 });
							}
							const runResult = await Promise.resolve(this.candidate.apply(this.candidateContext, argumentGroup));
							if (this.performance.enabled) {
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
				resolve(this.result.passed);
			});

			if (this.log.name) {
				promise.then(() => this.logResult());
			}

			// Return a reference to the promise.
			return promise as Async extends 'async' ? Promise<boolean> : boolean;
		}

		// Synchronous:
		let halt = false;
		for (const [index, argumentGroup] of this.args.entries()) {
			this.currentRun = 0;
			this.performance.measurements.push([]);
			while (this.currentRun < this.runs) {
				try {
					let runDuration: number | undefined = undefined;
					if (this.performance.enabled) {
						this.performance.measurements[index].push({ start: performance.now(), end: 0 });
					}
					const runResult = this.candidate.apply(this.candidateContext, argumentGroup);
					if (this.performance.enabled) {
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

		return this.result.passed as Async extends 'async' ? Promise<boolean> : boolean;
	}
}

export default MicroTestRunner.test;
