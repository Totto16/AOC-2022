import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type Instruction = {
    amount: number;
    source: number;
    dest: number;
};

type ParseType = [stack: string[][], instructions: Instruction[]];
export default class Solution extends SolutionTemplate<ParseType, string> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: false, separator: '\n' },
    };

    tests: TestOptions<string> = {
        first: {
            result: 'CMZ',
        },
        second: {
            result: 'MCD',
        },
    };

    parse(input: string[]): ParseType {
        const stackCount = input.indexOf('');
        const stackAmount = parseInt(input[stackCount - 1].trim().split('').atSafe(-1));
        const stacks: string[][] = Array(stackAmount)
            .fill(undefined)
            .map(() => []) as string[][];
        for (let i = 0; i < stackCount - 1; ++i) {
            for (let j = 0; j < stackAmount; ++j) {
                const elem = input[i].substring(j * 3 + (j > 0 ? j : 0), j * 3 + 3 + (j > 0 ? j : 0)).trim();

                if (elem !== '') {
                    stacks[j].push(elem.substring(1, 2));
                }
            }
        }

        const instructions: Instruction[] = [];
        for (let i = stackCount + 1; i < input.length; ++i) {
            const matched = /move (\d*) from (\d*) to (\d*)/i.exec(input[i]);
            if (matched === null) {
                throw new Error(`Unexpected parser Error on string: '${input[i]}'`);
            }
            const [, amount, source, dest] = matched;
            instructions.push({
                amount: parseInt(amount),
                source: parseInt(source) - 1,
                dest: parseInt(dest) - 1,
            });
        }
        return [stacks.map((a) => a.reverse()), instructions];
    }

    solve(input: ParseType): string {
        const [stack, instructions] = input;
        for (const { amount, source, dest } of instructions) {
            const elements = stack[source].splice(-amount);
            stack[dest].push(...elements.reverse());
        }
        return stack.map((a) => a.atSafe(-1)).join('');
    }

    solve2(input: ParseType): string {
        const [stack, instructions] = input;
        for (const { amount, source, dest } of instructions) {
            const elements = stack[source].splice(-amount);
            if (elements.length > 0) {
                stack[dest].push(...elements);
            }
        }
        console.log(stack);
        return stack.map((a) => a.atSafe(-1)).join('');
    }
}

//npm run compile && node . --5 -d
