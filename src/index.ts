export enum FailureLogSeverity {
	LOG,
	WARN,
	ERROR
}

type PerformanceLogFormat = 'average' | 'table';

class MicroTestRunner <Async extends 'sync' | 'async'> {
	private candidate: Function;
	private log = {
		name: undefined as string | undefined,
		icons: ['✓', '✕'],
		severity: FailureLogSeverity.LOG
	};
	private asynchronous = 'sync' as Async;
	private candidateContext: any;
	private args = [] as unknown[][];
	private conditions = [] as unknown[];
	private runs = 1;
	private currentRun = 0;
	private performance = {
		enabled: false,
		logFormat: 'average' as PerformanceLogFormat,
		measurements: [] as { start: number, end: number }[][]
	};
	private passing = [] as boolean[];
	private result = false;

	constructor (candidate: Function) {
		this.candidate = candidate;
	}

	private get logMessage (): string {
		let performanceMessage = '';
		let performanceTable = '';
		if (this.result && this.performance.enabled && this.performance.measurements.length > 0) {
			if (this.performance.logFormat === 'table') {
				performanceTable = '\n  ╭──────┬───────┬───────────────╮\n  │ Test │  Run  │ Duration (ms) │';
			}
			const startTimestamp = this.performance.measurements[0][0].start;
			const endTimestamp = this.performance.measurements[this.performance.measurements.length - 1][this.performance.measurements[this.performance.measurements.length - 1].length - 1].end;
			const testDuration = Number(endTimestamp - startTimestamp);
			let averageRunDuration = 0;
			let totalRuns = 0;
			this.performance.measurements.forEach((test, testIndex) => {
				if (this.performance.logFormat === 'table') {
					performanceTable += '\n  ├──────┼───────┼───────────────┤';
				}
				test.forEach((run, runIndex) => {
					const runDuration = run.end - run.start;
					averageRunDuration += runDuration;
					if (this.performance.logFormat === 'table') {
						performanceTable += `\n  │ ${runIndex === 0 ? (testIndex + 1).toString().padEnd(4, ' ') : '    '} │ ${(runIndex + 1).toString().padEnd(5, ' ')} │ ${runDuration.toFixed(3).padStart(13, ' ')} │`;
					}
					totalRuns++;
				});
			});
			if (this.performance.logFormat === 'table') {
				performanceTable += '\n  ╰──────┴───────┴───────────────╯';
			}
			averageRunDuration = Number(averageRunDuration / totalRuns);
			performanceMessage = ` in ${testDuration.toFixed(3)}ms${ totalRuns > 1 ? ` (x̄ ${averageRunDuration.toFixed(3)}ms per run, over ${totalRuns} runs)` : ''}`;
		}
		return `${this.result ? this.log.icons[0] : this.log.icons[1]} ${this.log.name} test ${this.result ? 'passed' : 'failed'}${performanceMessage}${this.performance.logFormat === 'table' ? ':' : '.'}${performanceTable}`;
	}

	private logResult (): void {
		if (!this.result) {
			if (this.log.severity === FailureLogSeverity.ERROR) {
				throw new Error(this.logMessage);
			} else if (this.log.severity === FailureLogSeverity.WARN) {
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
	static test (candidate: Function): MicroTestRunner<'sync'> {
		return new MicroTestRunner<'sync'>(candidate);
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
	 * @param icons `(Optional)` Icons to use to indicate the outcome of the test.
	 * Default: `['✓', '✕']`.
	 * @param performance `(Optional)` Log the performance of each test run in the desired format:
	 * 
	 * • `true` - Average of all runs.
	 * 
	 * • `'average'` - Average of all runs.
	 * 
	 * • `'table'` - A table showing the performance of each run.
	 * @returns 
	 */
	logging (name: string, severity = FailureLogSeverity.LOG, icons?: [string, string], performance: boolean | PerformanceLogFormat = false): MicroTestRunner<Async> {
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
	async (): MicroTestRunner<'async'> {
		this.asynchronous = 'async' as Async;
		return this as MicroTestRunner<'async'>;
	}

	/**
	 * Run the candidate function within a given context. Useful if the candidate needs access to a particular `this`.
	 * @param context The context.
	 */
	context (context: any): MicroTestRunner<Async> {
		this.candidateContext = context;
		return this;
	}

	/**
	 * Run each test multiple times.
	 * @param number The number of times to run each test.
	 */
	times (number: number): MicroTestRunner<Async> {
		this.runs = Math.max(Math.ceil(number), 1);
		return this;
	}

	/**
	 * Provide arguments to the candidate.
	 * @param args 
	 */
	with (args: Array<unknown>): MicroTestRunner<Async> {
		this.args.push(args);
		return this;
	}

	/**
	 * The results to expect from each test.
	 * @param conditions An array of expected results.
	 * @returns `true` if all test runs passed, `false` if any run failed.
	 */
	expect (conditions: Array<unknown>): Async extends 'async' ? Promise<boolean> : boolean {
		if (Array.isArray(conditions)) {
			this.conditions = conditions;
		} else {
			this.conditions.push(conditions);
		}
		if (this.args.length <= 0) {
			this.args.push([]);
		}

		// Asynchronous:
		if (this.asynchronous === 'async') {
			const promise = new Promise<boolean>( async (resolve) => {
				for (const [index, argumentGroup] of this.args.entries()) {
					this.currentRun = 0;
					this.performance.measurements.push([]);
					while (this.currentRun < this.runs) {
						try {
							if (this.performance.enabled) {
								this.performance.measurements[index].push({ start: performance.now(), end: 0 });
							}
							const runResult = await Promise.resolve(this.candidate.apply(this.candidateContext, argumentGroup));
							if (this.performance.enabled) {
								this.performance.measurements[index][this.currentRun].end = performance.now();
							}
							this.passing.push(typeof condition === 'function' ? condition(runResult) : runResult === condition);
							const condition = this.conditions[Math.min(index, this.conditions.length - 1)];
						} catch (error) {
							console.warn('MicroTestRunner: Run failed.', error);
						}
						this.currentRun++;
					}
				}

				// Return false if any one of the tests failed.
				this.result = !this.passing.includes(false);
				resolve(this.result);
			});

			if (this.log.name) {
				promise.then(() => this.logResult());
			}

			// Return a reference to the promise.
			return promise as Async extends 'async' ? Promise<boolean> : boolean;
		}

		// Synchronous:
		for (const [index, argumentGroup] of this.args.entries()) {
			this.currentRun = 0;
			this.performance.measurements.push([]);
			while (this.currentRun < this.runs) {
				try {
					if (this.performance.enabled) {
						this.performance.measurements[index].push({ start: performance.now(), end: 0 });
					}
					const runResult = this.candidate.apply(this.candidateContext, argumentGroup);
					if (this.performance.enabled) {
						this.performance.measurements[index][this.currentRun].end = performance.now();
					}
					this.passing.push(typeof condition === 'function' ? condition(runResult) : runResult === condition);
					const condition = this.conditions[Math.min(index, this.conditions.length - 1)];
				} catch (error) {
					console.warn('MicroTestRunner: Run failed.', error);
				}
				this.currentRun++;
			}
		}

		// Return false if any one of the tests failed.
		this.result = !this.passing.includes(false);

		if (this.log.name) {
			this.logResult();
		}

		return this.result as Async extends 'async' ? Promise<boolean> : boolean;
	}
}

export default MicroTestRunner.test;
