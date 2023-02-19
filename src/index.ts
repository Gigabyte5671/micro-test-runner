class MicroTestRunner {
	static candidate: Function;
	static args = [] as any[][];
	static conditions = [] as any[];
	static runs = 1;
	static currentRun = 0;
	static passing = [] as boolean[];

	/**
	 * Test an expression or function.
	 * @param candidate The expression/function to test.
	 * @returns The test-runner.
	 */
	static test (candidate: Function): typeof MicroTestRunner {
		MicroTestRunner.candidate = candidate;
		return MicroTestRunner;
	}

	/**
	 * Run each test multiple times.
	 * @param number The number of times to run each test.
	 * @returns 
	 */
	static times (number: number): typeof MicroTestRunner {
		MicroTestRunner.runs = number > 0 ? Math.ceil(number) : 1;
		return MicroTestRunner;
	}

	/**
	 * Provide arguments to the candidate.
	 * @param args 
	 */
	static with (args: Array<any>): typeof MicroTestRunner {
		MicroTestRunner.args.push(args);
		return MicroTestRunner;
	}

	/**
	 * The result to expect from the test.
	 * @param condition The expected result.
	 */
	static expect (condition: any): boolean
	/**
	 * The results to expect from each test.
	 * @param conditions An array of expected results.
	 * @returns 
	 */
	static expect (conditions: Array<any>): boolean {
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
				const result = this.candidate.apply(undefined, argumentGroup);
				this.passing.push(result === this.conditions[index]);
				this.currentRun++;
			}
		}

		return this.passing.reduce((previousValue, currentValue) => previousValue && currentValue);
	}
}

export default MicroTestRunner.test;
