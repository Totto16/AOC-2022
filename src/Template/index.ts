import { start, getFile } from '../utils';

function solve(input: string[]): number {
    return -1;
}

function solve2(input: string[]) {
    return -1;
}

function TestBoth() {
    const testInput = getFile('./sample.txt', __filename);

    const testResult = 0;
    const testResult2 = 0;

    const test = solve(testInput);
    if (test !== testResult) {
        console.error(`Wrong Solving Mechanism on Test 1: Got '${test}' but expected '${testResult}'`);
        process.exit(69);
    }

    const test2 = solve2(testInput);
    if (test2 !== testResult2) {
        console.error(`Wrong Solving Mechanism on Test 2: Got '${test2}' but expected '${testResult2}'`);
        process.exit(69);
    }
}

start(__filename, { tests: TestBoth, solve, solve2 }, { needsPrototypes: true });
