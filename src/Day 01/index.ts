import { start, getFile } from '../utils';

function parseElves(input: string[]): number[][] {
    const elves: number[][] = [[]];
    let i = 0;
    for (const inp of input) {
        if (inp === '') {
            ++i;
            elves[i] = [];
            continue;
        }

        elves[i].push(parseInt(inp.trim()));
    }

    return elves;
}

function solve(input: string[]): number {
    const elves = parseElves(input).map((a) => a.reduce((acc, b) => acc + b, 0));
    elves.sort((a, b) => b - a);
    return elves[0];
}

function solve2(input: string[]) {
    const elves = parseElves(input).map((a) => a.reduce((acc, b) => acc + b, 0));
    elves.sort((a, b) => b - a);
    return elves.slice(0, 3).reduce((acc, b) => acc + b, 0);
}

function TestBoth() {
    const testInput = getFile('./sample.txt', __filename, '\n', false);

    const testResult = 24000;
    const testResult2 = 45000;

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

start(
    __filename,
    { tests: TestBoth, solve, solve2 },
    { needsPrototypes: true, inputOptions: { filterOutEmptyLines: false, separator: '\n' } }
);
