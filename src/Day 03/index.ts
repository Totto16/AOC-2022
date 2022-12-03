import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type Rucksack = [left: string, right: string];

type ParseType = Rucksack[];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: 157,
        },
        second: {
            result: 70,
        },
    };

    parse(input: string[]): ParseType {
        return input.map((a) => {
            const middle = a.length / 2;
            return [a.substring(0, middle), a.substring(middle)];
        });
    }

    getPriority(input: string): number {
        if (/^[a-z]$/.test(input)) {
            return input.toCharCode() - 'a'.toCharCode() + 1;
        } else if (/^[A-Z]$/.test(input)) {
            return input.toCharCode() - 'A'.toCharCode() + 27;
        } else {
            throw new Error(`No known priority for string: '${input}'`);
        }
    }

    solve(input: ParseType): number {
        let sum = 0;
        for (const [first, second] of input) {
            const sameChars: string[] = [];
            for (const fs of first.split('')) {
                if (second.includes(fs)) {
                    if (!sameChars.includes(fs)) {
                        sameChars.push(fs);
                    }
                }
            }

            if (sameChars.length !== 1) {
                console.error(sameChars);
                throw new Error(`There must be exactly one, that is in both rucksacks!`);
            }
            sum += this.getPriority(sameChars.atSafe(0));
        }

        return sum;
    }

    solve2(input: ParseType): number {
        let sum = 0;
        for (let i = 0; i < input.length; i += 3) {
            const group = input.slice(i, i + 3).map(([a, b]) => a + b);
            const [first, second, third] = group;
            const sameChars: string[] = [];
            for (const fs of first.split('')) {
                if (second.includes(fs) && third.includes(fs)) {
                    if (!sameChars.includes(fs)) {
                        sameChars.push(fs);
                    }
                }
            }

            if (sameChars.length !== 1) {
                console.error(sameChars);
                throw new Error(`There must be exactly one, that is in the rucksacks of all three!`);
            }
            sum += this.getPriority(sameChars.atSafe(0));
        }

        return sum;
    }
}

//npm run compile && node . --3 -d
