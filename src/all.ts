import fs from 'fs';
import path from 'path';
import { terminal as term } from 'terminal-kit';
import { spawn } from 'child_process';
import { performance } from 'perf_hooks';
import { initPrototypes } from './prototypes';
import {
    ArgumentProgramOptions,
    ProgramOptions,
    ExtendedProgramOptions,
    parseArgs,
    AvailableProgramOptions,
    ParsableProgramOptions,
    printOutChristmasTree,
    getAvailableArgs,
    printHelp,
} from './arguments';
import {
    Constructable,
    fromWarningType,
    IPCTypes,
    IPCTypesMap,
    ResultArray,
    SolutionTemplate,
    TimingObject,
    WarningType,
} from './utils';

function* walkSync(
    dir: string,
    relative: boolean,
    FolderMatch: RegExp | undefined,
    fileMatch: RegExp | undefined
): Generator<string> {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const files = fs.readdirSync(dir, { withFileTypes: true });
    for (const file of files) {
        if (file.isDirectory()) {
            if (!FolderMatch || FolderMatch.test(file.name)) {
                yield* walkSync(path.join(dir, file.name), relative, FolderMatch, fileMatch);
            }
        } else {
            if (!fileMatch || fileMatch.test(file.name)) {
                yield path.join(dir, file.name);
            }
        }
    }
}

export type ProgramOptionsMapType = {
    [key in ArgumentProgramOptions]: keyof ProgramOptions;
};

export type ObjectEntries<T> = [keyof T, T[keyof T]][];

export const ProgramOptionsMap: ProgramOptionsMapType = {
    autoskipslow: 'skipSlow',
    'no-tests': 'noTests',
    mute: 'mute',
    debug: 'debug',
    verbose: 'debug',
};

export interface DaysObject {
    number: number;
    filePath: string;
}

async function main() {
    UserCancel();
    const options: ExtendedProgramOptions = parseArgs();
    if (options.debug) {
        !options.mute && term.white('[DEBUG] argv: ', JSON.stringify(options), '\n');
    }
    term.magenta('Loading Available Solutions...\n');
    const AllNumbers: DaysObject[] = [];
    for (const filePath of walkSync(__dirname, true, /day \d{2}/i, /index\.js$/i)) {
        const Group = /day (\d{2})/i.exec(filePath);
        if (!Group) {
            continue;
        }
        const number = parseInt(Group[1]);
        AllNumbers.push({ number, filePath });
    }
    if (options.index === 'select') {
        term.green('Select an Option:\n');
        const items = ['help: get Help menu', 'all: Run all Available Solutions'].concat(
            AllNumbers.map((a) => `${a.number}: Run the Solution of Day ${a.number.toString().padStart(2, '0')}`)
        );
        await new Promise<void>((resolve) => {
            term.singleColumnMenu(items, {}, function (error, response) {
                term.previousLine(items.length);
                term.eraseDisplayBelow();
                const { selectedIndex } = response;
                if (selectedIndex === 0) {
                    printHelp();
                }
                runThat(
                    { ...options, index: response.selectedIndex - (items.length - AllNumbers.length) + 1 },
                    AllNumbers
                )
                    // eslint-disable-next-line github/no-then
                    .then(() => {
                        resolve();
                    })
                    // eslint-disable-next-line github/no-then
                    .catch((...data) => {
                        console.error(...data);
                        resolve();
                    });
            });
        });
    } else {
        await runThat(options, AllNumbers);
    }
    process.exit(0);
}

async function runThat(options: ExtendedProgramOptions, AllNumbers: DaysObject[]) {
    if (options.index === 0) {
        term.blue(`Now running ALL Available Solutions:\n`);
        for (let i = 0; i < AllNumbers.length; i++) {
            const selected: DaysObject = AllNumbers.atSafe(i);
            await runSolution(selected, options);
        }
        printOutChristmasTree();
    } else {
        if (options.index === 'select') {
            console.error('UNREACHABLE');
            process.exit(1);
        }
        if (AllNumbers.length + 1 < options.index || options.index <= 0) {
            term.red(`This number is not supported: ${options.index}\n`);
            process.exit(1);
        }
        const selected = AllNumbers.atSafe(options.index - 1);
        await runSolution(selected, options);
    }
}

function formatTime(input: number): string {
    if (1 > input) {
        const ns = Math.round(input * 1000);
        return `^g0.${ns} ms`;
    } else if (1000 > input) {
        const ms = Math.round(input);
        return `^g${ms} ms`;
    } else if (60 * 1000 > input) {
        const s = Math.floor(input / 1000);
        const ms = Math.round(input % 1000);
        return `^r${s}.${ms} s`;
    } else {
        return `^r${new Intl.DateTimeFormat('de-DE', { timeStyle: 'medium' }).format(input)}`;
    }
}

export async function sleep(time: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, time));
}

export type ProgramStringOptions = (keyof ProgramOptions)[];

function toArgs(options: ProgramOptions): ProgramStringOptions {
    const AvailableOptions: AvailableProgramOptions[] = getAvailableArgs().filter((arg) => arg.type === 'internal');
    const result: ProgramStringOptions = [];
    for (let i = 0; i < AvailableOptions.length; i++) {
        const currentOption = AvailableOptions.atSafe(i);
        const rep: keyof ProgramOptions | undefined = (
            currentOption as ParsableProgramOptions | { representation: undefined }
        ).representation;
        // eslint-disable-next-line security/detect-object-injection
        if (rep !== undefined && options[rep]) {
            result.push(currentOption.args[0] as keyof ProgramOptions);
        }
    }
    return result;
}

export interface ProgramResult<R extends number | string = number | string> {
    timing: TimingObject;
    code: number;
    output: OutputArray;
    results: ResultArray<R>;
}

export type IPCMessage<T extends IPCTypes = IPCTypes> = {
    type: T;
    message: string;
} & IPCTypesMap[T];

export type OutputArray = [stdout: string[], stderr: string[]];

async function runProcess(
    filePath: string,
    options: ExtendedProgramOptions,
    tryDynamicImport?: boolean
): Promise<ProgramResult> {
    const start = performance.now();
    const timing: TimingObject = { start, end: -1 };
    const results: Array<number | string> = [];

    if (tryDynamicImport === true) {
        let exp = null;
        try {
            exp = (await import(filePath)) as { default: SolutionTemplate | undefined };
            if (exp.default === undefined) {
                exp = null;
                throw new Error('Normal file');
            }
            const expClass: SolutionTemplate = exp.default;
            const isSolutionTemplate = Object.is(Object.getPrototypeOf(expClass), SolutionTemplate);
            if (!isSolutionTemplate) {
                throw new Error(`exported default doesn't extend the class SolutionTemplate`);
            }
            return new Promise((resolve) => {
                const output: OutputArray = [[], []]; // stdout, stderr + error

                const savedLog = console.log;
                console.log = (...data: string[]) => {
                    output[0].push(...data);
                    if (options.debug) {
                        savedLog(...data);
                    }
                };

                const savedError = console.error;
                console.error = (...data: string[]) => {
                    output[1].push(...data);
                    if (options.debug) {
                        savedError(...data, '\n');
                    }
                };

                let code = 0;

                // eslint-disable-next-line @typescript-eslint/unbound-method
                const savedExit = process.exit;
                process.exit = (codeArg?: number | undefined): never => {
                    const codeL = codeArg ?? code;
                    resolve({ code: codeL, output, timing, results: results as ResultArray });
                    throw new Error(
                        'Error: after resolve, to assure the process.exit never returns, but resolve continued!'
                    );
                };

                let timeout: NodeJS.Timeout | null = null;

                try {
                    const obj: SolutionTemplate = new (expClass as unknown as Constructable<SolutionTemplate>)();

                    if (obj.options.slowness === undefined) {
                        timeout = setTimeout(() => {
                            savedLog("TIMEOUT")
                            term.red(
                                `The slowness wasn't set, but the program was slow, as a safety measure you now are able to press 'c', to interrupt the program\n`
                            );
                            term.yellow('To interrupt this press c!\n');
                            process.stdin.resume();
                            process.stdin.setEncoding('utf8');
                            process.stdin.on('data', function (data: Buffer | string) {
                                if (data.toString().startsWith('c')) {
                                    process.stdin.pause();
                                    output[1].push('Cancelled by User\n');
                                    process.stdin.removeAllListeners();

                                    timing.end = performance.now();
                                    resolve({ code: 7, output, timing, results: results as ResultArray });
                                }
                            });
                            return true;
                        }, 3* 1000);
                    }

                    const result = obj.start((type: WarningType) => {
                        const [message] = fromWarningType(type);
                        term.red(`${message}\n`);
                        term.yellow('To interrupt this press c!\n');
                        process.stdin.resume();
                        process.stdin.setEncoding('utf8');
                        process.stdin.on('data', function (data: Buffer | string) {
                            if (data.toString().startsWith('c')) {
                                process.stdin.pause();
                                output[1].push('Cancelled by User\n');
                                process.stdin.removeAllListeners();

                                timing.end = performance.now();
                                resolve({ code: 7, output, timing, results: results as ResultArray });
                            }
                        });
                        return true;
                    });

                    for (const [key, value] of Object.entries(result.timing)) {
                        timing[key as keyof TimingObject] = value;
                    }
                    code = result.code;
                    results.push(...result.results);
                    timing.end = performance.now();
                } catch (error) {
                    output[1].push((error as Error).message.toString());
                    if (options.debug) {
                        console.error(error, '\n');
                    }
                    timing.end = performance.now();
                    code = 68;
                } finally {
                    console.log = savedLog;
                    console.error = savedError;
                    process.exit = savedExit;

                    if (timeout !== null) {
                        clearTimeout(timeout);
                        timeout = null;
                    }

                    process.stdin.pause();
                    process.stdin.removeAllListeners();

                    resolve({ code, output, timing, results: results as ResultArray });
                }
            });
        } catch (e) {
            if (exp !== null) {
                console.error(e);
                console.error(`Error in dynamic import of Solution file: ${filePath}`);
                process.exit(6);
            }
        }
    }

    return await new Promise((resolve) => {
        const output: OutputArray = [[], []]; // stdout, stderr + error
        const program = spawn('node', [filePath, ...toArgs({ ...options, index: undefined } as ProgramOptions)], {
            cwd: path.dirname(filePath),
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
        });

        program.on('error', function (error: Error) {
            output[1].push(error.message.toString());
            if (program.connected) {
                program.disconnect();
            }
            timing.end = performance.now();
            resolve({ code: 68, output, timing, results: results as ResultArray });
        });

        program.stdout?.on('data', function (data: string | Buffer) {
            output[0].push(data.toString());
            if (options.debug) {
                console.log(data.toString());
            }
        });

        program.stderr?.on('data', function (data: string | Buffer) {
            output[1].push(data.toString());
        });

        program.on('message', function (msg) {
            let res: IPCMessage;
            try {
                res = JSON.parse(msg.toString()) as IPCMessage;
            } catch (err) {
                term.red("Couldn't parse IPC message!\n");
                return;
            }
            switch (res.type) {
                case 'slow': {
                    const { message } = res as IPCMessage<'slow'>;
                    term.red(`${message}\n`);
                    term.yellow('To interrupt this press c!\n');
                    process.stdin.resume();
                    process.stdin.setEncoding('utf8');
                    process.stdin.on('data', function (data: Buffer | string) {
                        if (data.toString().startsWith('c')) {
                            program.kill('SIGINT'); // used signal(but not manually by Ctrl+C), to indicate the right thing!
                            process.stdin.pause();
                            output[1].push('Cancelled by User\n');
                            if (program.connected) {
                                program.disconnect();
                            }
                            timing.end = performance.now();
                            resolve({ code: 7, output, timing, results: results as ResultArray });
                        }
                    });
                    break;
                }
                case 'time': {
                    const { what } = res as IPCMessage<'time'>;
                    timing[what as keyof TimingObject] = performance.now();
                    break;
                }
                case 'result': {
                    const { value } = res as IPCMessage<'result'>;
                    results.push(value);
                    break;
                }
                case 'message': {
                    const { message } = res as IPCMessage<'message'>;
                    output[0].push(message);
                    break;
                }
                default:
                    term.red(`Not recognized IPC message of type: ${res.type as string}`);
                    break;
            }
        });
        program.on('close', function (code) {
            if (program.connected) {
                program.disconnect();
            }
            timing.end = performance.now();
            resolve({ code: code ?? 1, output, timing, results: results as ResultArray });
        });
    });
}

function UserCancel() {
    process.on('SIGINT', () => {
        term.red(`\nEverything was cancelled by User\n`);
        process.exit(0);
    });
}

async function runSolution(selected: DaysObject, options: ExtendedProgramOptions) {
    if (!options.mute) {
        term.green(`Now running Solution for Day ${selected.number.toString().padStart(2, '0')}:\n`);
    }
    const { code, output, timing, results } = await runProcess(selected.filePath, options, true);

    let timeString: string;
    if (timing.end < 0 || timing.start < 0) {
        timeString = '^rTiming error';
    } else if (options.debug) {
        timeString = 'Timings:\n';
        const sortedTimings: ObjectEntries<TimingObject> = Object.entries(timing).sort(
            (a, b) => a[1] - b[1]
        ) as ObjectEntries<TimingObject>;

        for (let index = 0; index < sortedTimings.length; ++index) {
            const [name, time] = sortedTimings.atSafe(index);
            if (name !== 'start' && time !== undefined) {
                timeString += `^g${name}: ${formatTime(time - (sortedTimings[index - 1]?.[1] ?? 0))}${
                    index < sortedTimings.length - 1 ? '\n' : '\n'
                }`;
            }
        }
        timeString += `^gall: ${formatTime(timing.end - timing.start)}`;
    } else {
        timeString = `It took ${formatTime(timing.end - timing.start)}`;
    }
    if (code === 0 && output[1].length === 0) {
        if ((results as number[]).length !== 2) {
            throw new Error(`Not enough results received, only got ${results.length}!`);
        }
        if (!options.mute) {
            term.cyan(`Got Results:\nPart 1: '${results[0]}'\nPart 2: '${results[1]}'\n\n^y${timeString}\n\n`);
        }
    } else {
        switch (code) {
            case 43:
                if (!options.mute) {
                    term.yellow(`${output[0].join('\n')}`);
                    term.yellow(`${timeString}\n\n`);
                }
                break;
            case 7:
                if (!options.mute) {
                    term.yellow(`${output[1].join('\n')}\n^y${timeString}\n\n`);
                }
                break;
            case 69:
                term.red(`Test failed with: ${code}:\n${output[1].join('\n')}`);
                term.yellow(`\n^y${timeString}\n\n`);
                break;
            default:
                term.red(`Got Error with code ${code}:\n${output[1].join('\n')}`);
                term.yellow(`\n^y${timeString}\n\n`);
        }
    }
}

void (async (): Promise<never> => {
    initPrototypes();
    await main();
    process.exit(0);
})();
