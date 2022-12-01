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

export type WarningType = 0 | 1 | 2;

export function fromWarningType(type: WarningType): [message: string, level: IPCLevel] {
    const message = type === 0 ? 'Attention: Moderately Slow' : type === 1 ? 'ATTENTION: SLOW' : 'Unknown Slow Type';
    const level = type === 0 ? 'moderate' : type === 1 ? 'severe' : 'unknown';
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
        value: number | string;
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

export type SolveReturnType = number | string;

export interface StartMethods {
    tests?: (mute: boolean) => void;
    solve?: (input: string[], mute?: boolean) => SolveReturnType;
    solve2?: (input: string[], mute?: boolean) => SolveReturnType;
    solveMessage?: string;
    solve2Message?: string;
}

export function start(filename: string | undefined, methods: StartMethods, options?: StartOptions): never {
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

export interface TestOptions<R extends number | string = number> {
    first: {
        result: R;
    };
    second: {
        result: R;
    };
    separateTests?: boolean;
}

export abstract class SolutionTemplate<T = string[], R extends number | string = number> {
    abstract solve(input: T, mute?: boolean, isTest?: boolean): R;
    abstract solve2(input: T, mute?: boolean, isTest?: boolean): R;

    abstract parse?(input: string[]): T;

    abstract tests: TestOptions<R>;

    abstract options: AdvancedStartOptions;

    parseInput(input: string[]): T {
        // eslint-disable-next-line this/no-this
        return this.parse?.(input) ?? (input as unknown as T);
    }

    testBoth(options: AdvancedStartOptions, testOptions: TestOptions<R>, mute: boolean): void {
        const testInput = getFile(
            './sample.txt',
            options.filename,
            options.inputOptions?.separator,
            options.inputOptions?.filterOutEmptyLines
        );
        const testInput2 =
            testOptions.separateTests ?? false
                ? getFile(
                      './sample2.txt',
                      options.filename,
                      options.inputOptions?.separator,
                      options.inputOptions?.filterOutEmptyLines
                  )
                : testInput;

        const testResult = testOptions.first.result;
        const testResult2 = testOptions.second.result;

        // eslint-disable-next-line this/no-this
        const test = this.solve(this.parseInput(testInput), mute, true);
        if (test !== testResult) {
            console.error(`Wrong Solving Mechanism on Test 1: Got '${test}' but expected '${testResult}'`);
            process.exit(69);
        }
        // eslint-disable-next-line this/no-this
        const test2 = this.solve2(this.parseInput(testInput2), mute, true);
        if (test2 !== testResult2) {
            console.error(`Wrong Solving Mechanism on Test 2: Got '${test2}' but expected '${testResult2}'`);
            process.exit(69);
        }
    }

    start(slowWarningHandler: typeof slowWarning): ExecuteResult<R> {
        const timing: TimingObject = { start: performance.now(), end: -1 };
        // eslint-disable-next-line this/no-this
        const options: AdvancedStartOptions = this.options;
        // eslint-disable-next-line this/no-this
        const testOptions: TestOptions<R> = this.tests;

        const args: ProgramOptions = parseArgs();
        logDebug(`parsed argv: `, args, 'real argv:', process.argv);
        if (options.needsPrototypes === true) {
            initPrototypes();
        }

        if (!args.noTests) {
            // eslint-disable-next-line this/no-this
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
        // eslint-disable-next-line this/no-this
        const parsed = this.parseInput(realInput);

        // eslint-disable-next-line this/no-this
        const Answer = this.solve(parsed);
        timing.tests = performance.now();
        timing.part1 = performance.now();

        // eslint-disable-next-line this/no-this
        const Answer2 = this.solve2(parsed);
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

export interface ExecuteResult<R extends number | string> {
    timing: TimingObject;
    code: number;
    results: ResultArray<R>;
}

export type ResultArray<R extends number | string = number | string> = [answer1: R, answer2: R];
