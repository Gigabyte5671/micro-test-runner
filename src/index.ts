class MicroTestRunner {
	private candidate: Function;
	private args = [] as any[][];
	private conditions = [] as any[];
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
	static test (candidate: Function): MicroTestRunner {
		const newTestRunner = new MicroTestRunner(candidate);
		return newTestRunner;
	}

	/**
	 * Run each test multiple times.
	 * @param number The number of times to run each test.
	 * @returns 
	 */
	times (number: number): MicroTestRunner {
		this.runs = number > 0 ? Math.ceil(number) : 1;
		return this;
	}

	/**
	 * Provide arguments to the candidate.
	 * @param args 
	 */
	with (args: Array<any>): MicroTestRunner {
		this.args.push(args);
		return this;
	}

	/**
	 * The results to expect from each test.
	 * @param conditions An array of expected results.
	 * @returns 
	 */
	expect (conditions: Array<any>): boolean {
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
				} catch (error) {
					console.warn('MicroTestRunner: Test failed.', error);
				}
				this.passing.push(result === this.conditions[index]);
				this.currentRun++;
			}
		}

		return this.passing.reduce((previousValue, currentValue) => previousValue && currentValue);
	}
}

export default MicroTestRunner.test;
