import { PossibleFillTypes } from '../prototypes';
import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type ParseType = [number[], number[]][];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: 2,
        },
        second: {
            result: 4,
        },
    };

    parse(input: string[]): ParseType {
        return input.map((a) => {
            const pairs = a.split(',');
            return pairs.map((b) => {
                const [begin, end] = b.split('-');
                return ([parseInt(begin), '..', parseInt(end)] as PossibleFillTypes).fillElements();
            });
        }) as ParseType;
    }

    solve(input: ParseType): number {
        let amount = 0;
        for (const [first, second] of input) {
            if (first.includesAll(second) || second.includesAll(first)) {
                ++amount;
            }
        }

        return amount;
    }

    overlapCount(first: number[], second: number[]): number {
        let sum = 0;
        for (const elem of first) {
            if (second.includes(elem)) {
                ++sum;
            }
        }
        return sum;
    }

    solve2(input: ParseType): number {
        let sum = 0;
        for (const [first, second] of input) {
            sum += this.overlapCount(first, second) > 0 ? 1 : 0;
        }

        return sum;
    }
}

//npm run compile && node . --4 -d
