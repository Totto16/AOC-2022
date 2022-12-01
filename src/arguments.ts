import { terminal as term } from 'terminal-kit';

export function parseArgs(): ExtendedProgramOptions {
    const options: ExtendedProgramOptions = {
        index: 'select',
        skipSlow: false,
        noTests: false,
        mute: false,
        debug: false,
    };
    for (const string of process.argv) {
        if (string.startsWith('-')) {
            const arg = string.replace('-', '');
            const arg2 = string.replace('--', '');
            const isNumber = !isNaN(parseInt(arg2)) ? parseInt(arg2) : false;
            switch (arg) {
                case '-all':
                    options.index = 0;
                    break;
                case '-help':
                    printHelp();
                    break;
                case 'h':
                    printHelp();
                    break;
                case '?':
                    printHelp();
                    break;
                case '-no-tests':
                    options.noTests = true;
                    break;
                case 't':
                    options.noTests = true;
                    break;
                case '-autoskipslow':
                    options.skipSlow = true;
                    break;
                case 's':
                    options.skipSlow = true;
                    break;
                case 'm':
                    options.mute = true;
                    break;
                case '-mute':
                    options.mute = true;
                    break;
                case 'd':
                    options.debug = true;
                    break;
                case '-debug':
                    options.debug = true;
                    break;
                case 'v':
                    options.debug = true;
                    break;
                case '-verbose':
                    options.debug = true;
                    break;
                case 'f':
                    printOutChristmasTree();
                    break;
                case '-format':
                    printOutChristmasTree();
                    break;
                case '-tree':
                    printOutChristmasTree();
                    break;
                default:
                    if (isNumber !== false) {
                        options.index = isNumber;
                    }
                    break;
            }
        } else if (string.trim() === '?') {
            printHelp();
        }
    }

    return options;
}

export type ProgramOptions = {
    skipSlow: boolean;
    noTests: boolean;
    mute: boolean;
    debug: boolean;
};

export type ExtendedProgramOptions = {
    index: number | 'select';
} & ProgramOptions;

export function printHelp(): never {
    const AvailableArgs = getAvailableArgs();

    term.blue('HELP Page:\n\n');
    term.cyan('node . [options]\n\nOptions:\n');

    for (const arg of AvailableArgs) {
        const { args, description } = arg;
        const text = `${args.join(', ')}${
            arg.type === 'which' ? ` -> ${(arg as AvailableProgramOptions<'which'>).params.join(', ')}` : ''
        } : ${description}`;
        term.green(`${text}\n`);
    }
    term.red(
        '\n\n',
        "Note: The selection mode has some serious bugs, like Aborting with Ctrl+C doesn't work and some minor ones, so if you need to run one please consider using --{number} instead!\n"
    );
    process.exit(0);
}

export function printOutChristmasTree(): void {
    /*   function* gen(): Generator<string, string> {
        const available = 'bcmyrgw'.split('');
        do {
            const i = Math.floor(Math.random() * available.length);
            yield `^${available.atSafe(i)}`;
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        } while (true);
    }
    const color = gen();
    term.cyan(`~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~\n`);
    term.cyan(` .       .  .      .  . '  ...   ^w.   ^c.  ${color.next().value}.  ^y..''''\n`);
    term.cyan(`    .  .           . . .        ^w. ^c.  ${color.next().value}.^c.${color.next().value}.  ^y:      \n`);
    term.cyan(` ~     . .      '     .    .' ${color.next().value}. ^w.' ${color.next().value}.  ^y....'      \n`);
    term.cyan(`~     . '...    ' .         ${color.next().value}. ^y.^r.^w|\\^r.^y.''           \n`);
    term.cyan(`   ..                      ${color.next().value}. ^y:                   \n`);
    term.cyan(`     .'         . '.     ${color.next().value}.^y:'                     \n`);
    term.cyan(`.    ~    '    ^b.^c'..        ${color.next().value}.^y'''''.....  ...^r.     \n`);
    term.cyan(
        `^b.^c~ .          .  .        ^y:'..${color.next().value}. ^y..${color.next().value}.  ${
            color.next().value
        }.^y''${color.next().value}.   ^r':   \n`
    );
    term.cyan(
        `   ^b'^c .           .   . .  ^y:   ''  ''''..  ${color.next().value}. ${color.next().value}.^r'^y.  \n`
    );
    term.blue(`.            .^c.      ^b.    ^y:             '..'.${color.next().value}.^y:  \n`);
    term.blue(`          .         .    ^y:       :'''..   ..'${color.next().value}.^y:  \n`);
    term.blue(
        `    .   . '          ^c. ^y.'    ..''${color.next().value}.   ${color.next().value}. ^y'''${
            color.next().value
        }.^y...:  \n`
    );
    term.blue(` .     . '.         ^c. ^y: ...''${color.next().value}. ^y..':   ^r..^y..'      \n`);
    term.blue(
        `. .    . .   .   ${color.next().value}.  ${color.next().value}. ^y:'${
            color.next().value
        }.^y...'''    ^y'^r''           \n`
    );
    term.yellow(`'.'.  ^b.    ^c'   ${color.next().value}.^y:'. ....'                        \n`);
    term.yellow(`   :         ${color.next().value}.^b' ^y:  '                             \n`);
    term.yellow(`   :        ${color.next().value}. ^y..'                                \n`);
    term.yellow(`   '. ^b.    ${color.next().value}.^b. ^y:                                  \n`);
    term.yellow(`    '.     ^b.${color.next().value}. ^y:                                   \n`);
    term.yellow(`     :  ^c.^b.${color.next().value}. ^y:                                     \n`);
    term.yellow(`     '. ^b.${color.next().value}.  ^y:             ^wA^yO^gC ^c2^b0^m2^r1              \n`);
    term.yellow(`      : ^b~.${color.next().value}.^y.'                ^gb^cy                 \n`);
    term.yellow(`      : ${color.next().value}. ^y.'                ^yT^go^ct^bt^mo               \n`);
    term.yellow(`      :..:                                      \n`); */
    process.exit(0);
}

export type ProgramTypes = 'normal' | 'internal' | 'which';

export type ProgramTypesParams = {
    // eslint-disable-next-line @typescript-eslint/ban-types
    normal: {};
    // eslint-disable-next-line @typescript-eslint/ban-types
    internal: {};
    which: {
        params: string[];
    };
};

export type AvailableProgramOptions<T extends ProgramTypes = ProgramTypes> =
    | NormalProgramOptions<T>
    | ParsableProgramOptions<T>;

export type NormalProgramOptions<T extends ProgramTypes = ProgramTypes> = {
    type: T;
    args: [`--${string}`, ...string[]];
    description: string;
} & ProgramTypesParams[T];

export type ParsableProgramOptions<T extends ProgramTypes = ProgramTypes> = {
    type: T;
    args: [
        `--${ArgumentProgramOptions}`,
        `-${ArgumentProgramOptions[0]}`,
        ...(unknown[] | [`--${ArgumentProgramOptions}` | `-${ArgumentProgramOptions[0]}`])
    ];
    description: string;
    representation: keyof ProgramOptions;
} & ProgramTypesParams[T];

export function getAvailableArgs(): AvailableProgramOptions[] {
    const NormalOpts: NormalProgramOptions[] = [
        {
            type: 'normal',
            args: ['--all'],
            description: 'Runs all available Solutions',
        },
        {
            type: 'normal',
            args: ['--format', '-f', '--tree'],
            description: 'Prints the picture of the calender on the website!',
        },
        {
            type: 'normal',
            args: ['--help', '-h', '-?'],
            description: 'Shows this help page',
        },
        {
            type: 'which',
            args: ['--{number}'],
            params: ['{number} is a valid Number from Day 1 - actual Day, maximum 25'],
            description: 'Runs the Solution for that day',
        },
    ];

    const ParsableOpts: ParsableProgramOptions[] = [
        {
            type: 'internal',
            args: ['--no-tests', '-t'],
            representation: 'noTests',
            description: 'Skips the tests, the performance is slightly better',
        },
        {
            type: 'internal',
            args: ['--autoskipslow', '-s'],
            representation: 'skipSlow',
            description: 'Auto skips solutions marked as slow',
        },
        {
            type: 'internal',
            args: ['--mute', '-m'],
            representation: 'mute',
            description: 'Completely mutes everything (Status code will indicate only the status))',
        },
        {
            type: 'internal',
            args: ['--debug', '-d', '--verbose', '-v'],
            representation: 'debug',
            description:
                "Print additional Information, at the moment only additional timing and argv logging is available. for additional debugging set the 'DEBUG' env variable to true/1",
        },
    ];

    const AvailableArgs: AvailableProgramOptions[] = [...NormalOpts, ...ParsableOpts];

    return AvailableArgs;
}

export type ArgumentProgramOptions = 'autoskipslow' | 'no-tests' | 'mute' | 'debug' | 'verbose';
