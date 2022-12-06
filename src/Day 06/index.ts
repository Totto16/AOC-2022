import { assert } from 'console';
import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type ParseType = string;
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: 7,
        },
        second: {
            result: 19,
        },
    };

    parse(input: string[]): ParseType {
        assert(input.length === 0, 'invalid input');
        return input[0];
    }

    solve(input: ParseType): number {
        outer: for (let i = 4; i < input.length; ++i) {
            const str = input.substring(i - 4, i).split('');
            const set = new Set();
            for (const char of str) {
                if (set.has(char)) {
                    continue outer;
                }
                set.add(char);
            }
            return i;
        }
        return -1;
    }

    solve2(input: ParseType): number {
        outer: for (let i = 14; i < input.length; ++i) {
            const str = input.substring(i - 14, i).split('');
            const set = new Set();
            for (const char of str) {
                if (set.has(char)) {
                    continue outer;
                }
                set.add(char);
            }
            return i;
        }
        return -1;
    }
}

//npm run compile && node . --6 -d
