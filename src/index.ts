class MicroTestRunner <Async extends boolean> {
	private candidate: Function;
	private asynchronous = false as Async;
	private args = [] as unknown[][];
	private conditions = [] as unknown[];
	private runs = 1;
	private currentRun = 0;
	private passing = [] as boolean[];

	constructor (candidate: Function) {
		this.candidate = candidate;
	}

	/**
	 * Test an expression or function.
	 * @param candidate The expression/function to test.
	 * @returns The test-runner.
	 */
	static test (candidate: Function): MicroTestRunner<false> {
		return new MicroTestRunner<false>(candidate);
	}

	/**
	 * Run each test asynchronously.
	 */
	async (): MicroTestRunner<true> {
		this.asynchronous = true as Async;
		return this as MicroTestRunner<true>;
	}

	/**
	 * Run each test multiple times.
	 * @param number The number of times to run each test.
	 */
	times (number: number): MicroTestRunner<Async> {
		this.runs = number > 0 ? Math.ceil(number) : 1;
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
	expect (conditions: Array<unknown>): Async extends true ? Promise<boolean> : boolean {
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
					let result = undefined;
					try {
						result = this.candidate.apply(undefined, argumentGroup);
						if (this.asynchronous) {
							result = await Promise.resolve(result);
						}
					} catch (error) {
						console.warn('MicroTestRunner: Test failed.', error);
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
			resolve(!this.passing.includes(false));
		});

		// Return false if any one of the tests failed.
		return (this.asynchronous ? promise : !this.passing.includes(false)) as Async extends true ? Promise<boolean> : boolean;
	}
}

export default MicroTestRunner.test;
