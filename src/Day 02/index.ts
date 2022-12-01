import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type Elves = number[][];

type ParseType = Elves;
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: false, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: 24000,
        },
        second: {
            result: 45000,
        },
    };

    parse(input: string[]): ParseType {
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

    solve(input: ParseType): number {
        const elves = input.map((a) => a.reduce((acc, b) => acc + b, 0));
        elves.sort((a, b) => b - a);
        return elves[0];
    }

    solve2(input: ParseType): number {
        const elves = input.map((a) => a.reduce((acc, b) => acc + b, 0));
        elves.sort((a, b) => b - a);
        return elves.slice(0, 3).reduce((acc, b) => acc + b, 0);
    }
}

//npm run compile && node . --2 -d
