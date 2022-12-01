import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type ParseType = string[];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: -1,
        },
        second: {
            result: -1,
        },
    };

    parse(input: string[]): ParseType {
        return input;
    }

    solve(input: ParseType): number {
        return -1;
    }

    solve2(input: ParseType): number {
        return -1;
    }
}
