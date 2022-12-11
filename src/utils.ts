import path from 'path';
import fs from 'fs';
import { parseArgs, ProgramOptions } from './arguments';
import { initPrototypes } from './prototypes';
const debug = ['1', 'true', 'on', 'enabled', 'enable'].includes(process.env['DEBUG'] ?? '0');

export function logDebug(...args: unknown[]): boolean {
    if (debug) {
        console.log(`[DEBUG] `, ...args);
        return true;
    }
    return false;
}

export function getFile(
    filePath: string,
    filename: string | undefined,
    separator = '\n',
    filterOutEmptyLines = true
): string[] {
    const dirname = path.dirname(filename ?? __filename);
    let file: string = path.join(dirname, filePath);
    if (__dirname.endsWith('/build')) {
        file = file.replace('/build/', '/src/');
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!fs.existsSync(file)) {
        throw new Error(`No such file: '${file}'`);
    }
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    let result = fs
        .readFileSync(file)
        .toString()
        .split(separator)
        .filter((a: string) => !filterOutEmptyLines || a !== '');
    if (result.some((a: string) => a.split('').includes('\r'))) {
        result = result.map((a: string) => a.replaceAll(/\r/g, ''));
    }
    return result;
}

export type WarningType = 0 | 1 | 'moderately' | 'SLOW';

export function fromWarningType(type: WarningType): [message: string, level: IPCLevel] {
    const message = type === 0 || type === 'moderately' ? 'Attention: Moderately Slow' : 'ATTENTION: SLOW';
    const level = type === 0 || type === 'moderately' ? 'moderate' : 'severe';
    return [message, level];
}

function slowWarning(type: WarningType) {
    process.on('SIGINT', () => {
        if (process.connected) {
            process.disconnect();
        }
        process.exit(0);
    });
    const [message, level] = fromWarningType(type);
    return sendIpc({ type: 'slow', message, level });
}

export type IPCTypes = keyof IPCTypesMap;

export interface IPCTypesMap {
    slow: {
        message: string;
        level: IPCLevel;
    };
    result: {
        value: PossibleSolutionTypes;
    };
    message: { message: string };
    time: {
        what: AllPossibleTimingTypes;
    };
}

export type IPCLevel = 'moderate' | 'severe' | 'unknown';
export type IPCOptions<T extends IPCTypes = IPCTypes> = {
    type: T;
} & IPCTypesMap[T];

function sendIpc<T extends IPCTypes>(options: IPCOptions<T> | string) {
    if (process.send) {
        if (typeof options !== 'string') {
            options = JSON.stringify(options);
        }
        process.send(options);
        return true;
    }
    logDebug(options);
    return false;
}

export interface StartOptions {
    needsPrototypes?: boolean;
    slowness?: WarningType;
    mute?: boolean;
    inputOptions?: {
        separator: string;
        filterOutEmptyLines: boolean;
    };
}

export interface StartMethods {
    tests?: (mute: boolean) => void;
    solve?: (input: string[], mute?: boolean) => PossibleSolutionTypes;
    solve2?: (input: string[], mute?: boolean) => PossibleSolutionTypes;
    solveMessage?: string;
    solve2Message?: string;
}

export function isEntryPoint(): boolean {
    const main = require.main;
    if (main === undefined) {
        return true;
    }
    for (const child of main.children) {
        if (/Day \d{2}\/index\.js/.test(child.id)) {
            return false;
        }
    }
    return true;
}

export function start(filename: string | undefined, methods: StartMethods, options?: StartOptions): never {
    // if trying to dynamically import a file, where start is called, we just return, this is like a "header guard"
    if (!isEntryPoint()) {
        throw new Error('reached never, this is as expected');
    }

    process.on('SIGINT', () => {
        throw new Error('test sigint');
    });

    options = options || {};
    sendIpc({ type: 'time', what: 'start' });
    const args: ProgramOptions = parseArgs();
    logDebug(`parsed argv: `, args, 'real argv:', process.argv);
    if (options.needsPrototypes === true) {
        initPrototypes();
    }

    if (methods.tests && !args.noTests) {
        methods.tests(args.mute);
        sendIpc({ type: 'time', what: 'tests' });
    }
    if (options.slowness !== undefined && args.skipSlow) {
        sendIpc({ type: 'message', message: 'Auto Skipped Moderately Slow\n' });
        process.exit(43);
    }
    if (options.slowness !== undefined) {
        slowWarning(options.slowness);
    }
    filename = filename ?? __filename;
    const { separator, filterOutEmptyLines } = options.inputOptions || { separator: '\n', filterOutEmptyLines: true };
    if (methods.solve !== undefined) {
        const realInput = getFile('./input.txt', filename, separator, filterOutEmptyLines);
        const Answer = methods.solve(realInput);
        sendIpc({ type: 'result', value: Answer });
        sendIpc({ type: 'time', what: 'part1' });
    } else if (methods.solveMessage !== undefined) {
        sendIpc({ type: 'result', value: methods.solveMessage });
        sendIpc({ type: 'time', what: 'part1' });
    }

    if (methods.solve2 !== undefined) {
        const realInput2 = getFile('./input.txt', filename, separator, filterOutEmptyLines);
        const Answer2 = methods.solve2(realInput2);
        sendIpc({ type: 'result', value: Answer2 });
        sendIpc({ type: 'time', what: 'part2' });
    } else if (methods.solve2Message !== undefined) {
        sendIpc({ type: 'result', value: methods.solve2Message });
        sendIpc({ type: 'time', what: 'part2' });
    }

    process.exit(0);
}

export type AdvancedStartOptions = StartOptions & { filename: string };

export type TestOptions<R extends PossibleSolutionTypes = number, R2 extends PossibleSolutionTypes = R> =
    | TestOptionV1<R, R2>
    | TestOptionV2<R, R2>;

export interface TestOptionV1<R extends PossibleSolutionTypes, R2 extends PossibleSolutionTypes = R> {
    first: {
        result: R;
    };
    second: {
        result: R2;
    };
    separateTests?: boolean;
}

export interface TestOptionSingleV2<R extends PossibleSolutionTypes> {
    result: R | R[];
    tests?: string[] | number;
}
export interface TestOptionV2<R extends PossibleSolutionTypes, R2 extends PossibleSolutionTypes = R> {
    first: TestOptionSingleV2<R>;
    second: TestOptionSingleV2<R2>;
}

export type PossibleSolutionTypes = number | string | string[];

export abstract class SolutionTemplate<
    T = string[],
    R extends PossibleSolutionTypes = number,
    R2 extends PossibleSolutionTypes = R
> {
    abstract solve(input: T, mute?: boolean, isTest?: boolean): R;
    abstract solve2(input: T, mute?: boolean, isTest?: boolean): R2;

    abstract parse?(input: string[]): T;

    abstract tests: TestOptions<R, R2>;

    abstract options: AdvancedStartOptions;

    parseInput(input: string[]): T {
        return this.parse?.(input) ?? (input as unknown as T);
    }

    testBoth(options: AdvancedStartOptions, testOptions: TestOptions<R, R2>, mute: boolean): void {
        if (
            (testOptions as TestOptionV2<R, R2>).first.tests !== undefined ||
            (testOptions as TestOptionV2<R, R2>).second.tests !== undefined ||
            Array.isArray(testOptions.first.result) ||
            Array.isArray(testOptions.second.result)
        ) {
            const { first, second } = testOptions as TestOptionV2<R, R2>;

            // Mode v2
            if ((testOptions as TestOptionV1<R, R2>).separateTests === true) {
                throw new Error("When using testmode v2, you can't pass separateTests");
            }

            const localTest = <E extends 1 | 2>(num: E, single: TestOptionSingleV2<E extends 1 ? R : R2>) => {
                const allTests: string[] =
                    single.tests === undefined
                        ? ['']
                        : typeof single.tests === 'number'
                        ? [
                              '',
                              ...Array(single.tests - 1)
                                  .fill(undefined)
                                  .map((_, ind) => (ind + 2).toString()),
                          ]
                        : single.tests;

                const resArrayAll = Array.isArray(single.result) ? single.result : [single.result];

                if (allTests.length !== resArrayAll.length) {
                    throw new Error(
                        `In test declaration ${num}: The length of the results isn't equal to the given test files: '${allTests.length}' != '${resArrayAll.length}'`
                    );
                }

                for (let i = 0; i < allTests.length; ++i) {
                    const res = resArrayAll.atSafe(i);
                    const testFile = `./sample${allTests.atSafe(i)}.txt`;

                    const testInput = getFile(
                        testFile,
                        options.filename,
                        options.inputOptions?.separator,
                        options.inputOptions?.filterOutEmptyLines
                    );

                    const testRes = this[`solve${num === 1 ? '' : (num as 2)}`](this.parseInput(testInput), mute, true);
                    if (!testEq(testRes, res)) {
                        console.error(
                            `Wrong Solving Mechanism on Test ${num}.${i + 1}: Got '${testRes}' but expected '${res}'`
                        );
                        process.exit(69);
                    }
                }
            };

            localTest(1, first);

            localTest(2, second);
        } else {
            const { first, second, separateTests } = testOptions as TestOptionV1<R, R2>;

            const testInput = getFile(
                './sample.txt',
                options.filename,
                options.inputOptions?.separator,
                options.inputOptions?.filterOutEmptyLines
            );
            const testInput2 =
                separateTests ?? false
                    ? getFile(
                          './sample2.txt',
                          options.filename,
                          options.inputOptions?.separator,
                          options.inputOptions?.filterOutEmptyLines
                      )
                    : testInput;

            const testResult = first.result;
            const testResult2 = second.result;

            const test = this.solve(this.parseInput(testInput), mute, true);
            if (!testEq(test, testResult)) {
                console.error(`Wrong Solving Mechanism on Test 1: Got '${test}' but expected '${testResult}'`);
                process.exit(69);
            }

            const test2 = this.solve2(this.parseInput(testInput2), mute, true);
            if (!testEq(test2, testResult2)) {
                console.error(`Wrong Solving Mechanism on Test 2: Got '${test2}' but expected '${testResult2}'`);
                process.exit(69);
            }
        }
    }

    start(slowWarningHandler: typeof slowWarning): ExecuteResult<R, R2> {
        const timing: TimingObject = { start: performance.now(), end: -1 };

        const options: AdvancedStartOptions = this.options;

        const testOptions: TestOptions<R, R2> = this.tests;

        const args: ProgramOptions = parseArgs();
        logDebug(`parsed argv: `, args, 'real argv:', process.argv);
        if (options.needsPrototypes === true) {
            initPrototypes();
        }

        if (!args.noTests) {
            this.testBoth(options, testOptions, args.mute);
            timing.tests = performance.now();
        }
        if (options.slowness !== undefined && args.skipSlow) {
            console.log('Auto Skipped Moderately Slow\n');
            process.exit(43);
        }
        if (options.slowness !== undefined) {
            slowWarningHandler(options.slowness);
        }

        const { separator, filterOutEmptyLines } = options.inputOptions || {
            separator: '\n',
            filterOutEmptyLines: true,
        };

        const realInput = getFile('./input.txt', options.filename, separator, filterOutEmptyLines);

        const parsed = this.parseInput(realInput);

        const Answer = this.solve(parsed);
        timing.tests = performance.now();
        timing.part1 = performance.now();

        const parsed2 = this.parseInput(realInput);
        const Answer2 = this.solve2(parsed2);
        timing.part2 = performance.now();

        return { code: 0, timing, results: [Answer, Answer2] };
    }
}

export interface Constructable<T = unknown> {
    new (): T;
}

export type AllPossibleTimingTypes = PossibleTimingTypes | OptionalTimingTypes;

export type PossibleTimingTypes = 'start' | 'end';

export type OptionalTimingTypes = 'tests' | 'part1' | 'part2';

export type TimingObject = {
    [key in PossibleTimingTypes]: number;
} & {
    [key in OptionalTimingTypes]?: number;
};

export interface ExecuteResult<R extends PossibleSolutionTypes, R2 extends PossibleSolutionTypes = R> {
    timing: TimingObject;
    code: number;
    results: ResultArray<R, R2>;
}

export type ResultArray<
    R extends PossibleSolutionTypes = PossibleSolutionTypes,
    R2 extends PossibleSolutionTypes = R
> = [answer1: R, answer2: R2];

export function testEq<R extends PossibleSolutionTypes = PossibleSolutionTypes>(test: R, result: R): boolean {
    if (Array.isArray(test)) {
        if (typeof test[0] !== typeof (result as Array<unknown>)[0]) {
            return false;
        }
        return test.equals(result as Array<string>);
    } else if (typeof test === 'number' || typeof test === 'string') {
        return test === result;
    } else {
        throw new Error(`FATAL, unreachable: in testEq of testResults`);
    }
}
