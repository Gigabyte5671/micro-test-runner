export enum FailureLogSeverity {
	LOG,
	WARN,
	ERROR
}

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
	private passing = [] as boolean[];
	private result = false;

	constructor (candidate: Function) {
		this.candidate = candidate;
	}

	private get logMessage (): string {
		return `${this.result ? this.log.icons[0] : this.log.icons[1]} ${this.log.name} test ${this.result ? 'passed' : 'failed'}.`;
	}

	private logResult (): void {
		if (!this.result) {
			if (this.log.severity === FailureLogSeverity.ERROR) {
				throw new Error(this.logMessage);
			} else if (this.log.severity === FailureLogSeverity.WARN) {
				console.warn(this.logMessage);
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
	 * @returns 
	 */
	logging (name: string, severity = FailureLogSeverity.LOG, icons?: [string, string]): MicroTestRunner<Async> {
		this.log.name = name;
		this.log.severity = severity;
		if (Array.isArray(icons) && icons.length === 2) {
			this.log.icons = icons;
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
		// Asynchronous:
		if (this.asynchronous === 'async') {
			const promise = new Promise<boolean>( async (resolve) => {
				if (Array.isArray(conditions)) {
					this.conditions = conditions;
				} else {
					this.conditions.push(conditions);
				}
				if (this.args.length <= 0) {
					this.args.push([]);
				}
				for (const [index, argumentGroup] of this.args.entries()) {
					this.currentRun = 0;
					while (this.currentRun < this.runs) {
						let result = false;
						try {
							result = this.candidate.apply(this.candidateContext, argumentGroup);
							if (this.asynchronous) {
								result = await Promise.resolve(result);
							}
						} catch (error) {
							console.warn('MicroTestRunner: Run failed.', error);
						}
						const condition = this.conditions[index];
						if (typeof condition === 'function') {
							this.passing.push(condition(result));
						} else {
							this.passing.push(result === this.conditions[index]);
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
		if (Array.isArray(conditions)) {
			this.conditions = conditions;
		} else {
			this.conditions.push(conditions);
		}
		if (this.args.length <= 0) {
			this.args.push([]);
		}
		for (const [index, argumentGroup] of this.args.entries()) {
			this.currentRun = 0;
			while (this.currentRun < this.runs) {
				let result = false;
				try {
					result = this.candidate.apply(this.candidateContext, argumentGroup);
				} catch (error) {
					console.warn('MicroTestRunner: Run failed.', error);
				}
				const condition = this.conditions[index];
				if (typeof condition === 'function') {
					this.passing.push(condition(result));
				} else {
					this.passing.push(result === this.conditions[index]);
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
