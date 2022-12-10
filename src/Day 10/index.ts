import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type InstructionCode = 'noop' | 'addx';

type InstructionMap = {
    noop: {
        //
    };
    addx: {
        number: number;
    };
};

type Instruction<T extends InstructionCode = InstructionCode> = {
    type: T;
} & InstructionMap[T];

type ParseType = Instruction[];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: 13140,
        },
        second: {
            result: -1,
        },
    };

    parse(input: string[]): ParseType {
        return input.map((inp) => {
            const parser: [InstructionCode, RegExp, (res: RegExpExecArray) => InstructionMap[InstructionCode]][] = [
                [
                    'noop',
                    /noop/i,
                    ([]): InstructionMap['noop'] => {
                        return {};
                    },
                ],
                [
                    'addx',
                    /addx (-?\d*)/i,
                    ([, number]): InstructionMap['addx'] => {
                        return { number: parseInt(number) };
                    },
                ],
            ];

            const instruction: Instruction | null = parser.reduce((acc: null | Instruction, [type, regex, mapFn]) => {
                if (acc !== null) {
                    return acc;
                }
                const result = regex.exec(inp);
                if (result === null) {
                    return null;
                }
                const partial = mapFn(result);
                return {
                    type,
                    ...partial,
                } as Instruction;
            }, null);

            if (instruction === null) {
                throw new Error(`Couldn't parse instruction: '${inp}'`);
            }

            return instruction;
        });
    }

    solve(input: ParseType): number {
        const cycles: number[] = [1];
        for (const instruction of input) {
            if (instruction.type === 'noop') {
                cycles.push(cycles.atSafe(-1));
            } else {
                const last = cycles.atSafe(-1);
                cycles.push(last);
                cycles.push(last + (instruction as Instruction<'addx'>).number);
            }
        }

        const [start, steps] = [20, 40];

        const atCycles = [start];
        while (cycles.length - steps > atCycles.atSafe(-1)) {
            atCycles.push(atCycles.atSafe(-1) + steps);
        }
        let sum = 0;
        for (const idx of atCycles) {
            sum += idx * cycles[idx - 1];
        }

        return sum;
    }

    solve2(input: ParseType, mute = false, isTest = false): number {
        const [height, width] = [6, 40];

        const arr = Array.nested<boolean>(width, height, () => false);
        const cycles: number[] = [1];
        for (const instruction of input) {
            if (instruction.type === 'noop') {
                cycles.push(cycles.atSafe(-1));
            } else {
                const last = cycles.atSafe(-1);
                cycles.push(last);
                cycles.push(last + (instruction as Instruction<'addx'>).number);
            }
        }

        for (let y = 0; y < height; ++y) {
            for (let x = 0; x < width; ++x) {
                const num = cycles[y * width + x];
                if (Math.abs(x - num) <= 1) {
                    arr[y][x] = true;
                }
            }
        }
        if (!mute && !isTest) {
            arr.printNested<boolean>((a) => (a ? '#' : ' '), '');
            console.log('\n');
        }

        if (isTest) {
            //TODO better testcase coverability for such puzzles, parse this text automatically!
            const expectet = `##..##..##..##..##..##..##..##..##..##..
            ###...###...###...###...###...###...###.
            ####....####....####....####....####....
            #####.....#####.....#####.....#####.....
            ######......######......######......####
            #######.......#######.......#######.....`;
        }
        return -1;
    }
}

//npm run compile && node . --10 -d
