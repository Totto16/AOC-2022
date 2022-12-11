import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type Monkey = {
    index: number;
    items: number[];
    operation: string;
    test: number;
    trueCond: number;
    falseCond: number;
};

type ParseType = Monkey[];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: false, separator: '\n' },
        slowness: 'moderately',
    };

    tests: TestOptions = {
        first: {
            result: 10605,
        },
        second: {
            result: 2713310158,
        },
    };

    isPrime(num: number): boolean {
        if (num <= 1) {
            return false;
        }
        if (num % 2 === 0 && num > 2) {
            return false;
        }
        const maxSquare = Math.sqrt(num); // store the square to loop faster
        for (let i = 3; i <= maxSquare; i += 2) {
            if (num % i === 0) {
                return false;
            }
        }
        return true;
    }

    parse(input: string[]): ParseType {
        const monkeys: Monkey[] = [];

        if ((input.length + 1) % 7 !== 0) {
            throw new Error(`Invalid input length: ${input.length}`);
        }

        function getMatches<T extends string | number = string>(
            reg: RegExp,
            index: number,
            retNum: T extends number ? true : false
        ): T[] {
            const str = input[index];
            const result = reg.exec(str);

            if (result === null || result.length < 2) {
                throw new Error('Invalid local regex!');
            }
            const [, ...results] = result;
            return results.map((res) => {
                const num = parseInt(res.trim());
                if (!retNum || isNaN(num)) {
                    return res as T;
                }

                return num as T;
            });
        }

        for (let i = 0; i < input.length; i += 7) {
            const [index] = getMatches<number>(/Monkey (\d+):/, i, true);
            const [allItems] = getMatches(/Starting items: ([\d ,]+)/, i + 1, false);
            const items: number[] = allItems.split(',').map((a) => parseInt(a.trim()));
            const [operation] = getMatches(/Operation: (.+)/, i + 2, false);
            const [test] = getMatches<number>(/Test: divisible by (\d+)/, i + 3, true);
            const [trueCond] = getMatches<number>(/throw to monkey (\d+)/, i + 4, true);
            const [falseCond] = getMatches<number>(/throw to monkey (\d+)/, i + 5, true);

            if (!this.isPrime(test)) {
                throw new Error(`Invalid input, divisor test isn't a prime: ${test}`);
            }

            monkeys.push({
                index,
                items,
                operation: operation.replaceAll('new', 'newVar'),
                test,
                trueCond,
                falseCond,
            });
        }
        return monkeys;
    }

    solve(input: ParseType): number {
        const maxRound = 20;
        const inspectedCount: number[] = Array(input.length)
            .fill(undefined)
            .map(() => 0);
        for (let round = 0; round < maxRound; ++round) {
            for (let i = 0; i < input.length; ++i) {
                while (input[i].items.length !== 0) {
                    const [toInspect] = input[i].items.splice(0, 1);
                    inspectedCount[i]++;
                    let worryLevel = toInspect;
                    // eval trick, newVar instead of new, since thats a keyword :(
                    {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                        const old = worryLevel;
                        // eslint-disable-next-line prefer-const
                        let newVar = 0;
                        eval(input[i].operation);
                        worryLevel = newVar;
                    }
                    worryLevel = Math.floor(worryLevel / 3);

                    const isDiv = worryLevel % input[i].test === 0;

                    if (isDiv) {
                        input[input[i].trueCond].items.push(worryLevel);
                    } else {
                        input[input[i].falseCond].items.push(worryLevel);
                    }
                }
            }
        }
        const res = inspectedCount.sort((a, b) => b - a);
        return res[0] * res[1];
    }

    solve2(input: ParseType): number {
        const maxRound = 10000;

        const maxPrime = input.reduce((acc, { test }) => Math.max(test, acc), 0);

        const primeProduct = BigInt(
            Array(maxPrime)
                .fill(undefined)
                .map((_, i) => i + 1)
                .filter((a) => this.isPrime(a))
                .reduce((acc, num) => acc * num, 1)
        );

        const inspectedCount: number[] = Array(input.length)
            .fill(undefined)
            .map(() => 0);
        for (let round = 0; round < maxRound; ++round) {
            for (let i = 0; i < input.length; ++i) {
                while (input[i].items.length !== 0) {
                    const [toInspect] = input[i].items.splice(0, 1);
                    inspectedCount[i]++;
                    // also reduce before the operation, not risking an overflow
                    // it seems that the numbers are bigger nonetheless, so BigInt has to be used
                    let worryLevel = BigInt(toInspect) % primeProduct;
                    // eval trick, newVar instead of new, since thats a keyword :(
                    {
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
                        const old = BigInt(worryLevel);
                        // eslint-disable-next-line prefer-const
                        let newVar = BigInt(0);
                        eval(
                            input[i].operation.replaceAll(/(\d{1,2})/g, ([...val]) => {
                                return `BigInt(${val.join('')})`;
                            })
                        );
                        worryLevel = newVar;
                    }

                    // to not result in an overflow error, I should apply some math beforehand, since I only care about the mod, it is possible, since every divisor is a prime number :)
                    // to accomplish this, i take the mod of the product of all the possible divisors primes :)
                    worryLevel = worryLevel % primeProduct; //this.reducePrime(worryLevel, maxPrime);
                    if (worryLevel > Number.MAX_SAFE_INTEGER) {
                        throw new Error(`TOO BIG NUMBER: ${worryLevel} in round ${round}`);
                    }
                    const newWorryLevel = Number(worryLevel);

                    const isDiv = newWorryLevel % input[i].test === 0;

                    if (isDiv) {
                        input[input[i].trueCond].items.push(newWorryLevel);
                    } else {
                        input[input[i].falseCond].items.push(newWorryLevel);
                    }
                }
            }
        }
        const res = inspectedCount.sort((a, b) => b - a);
        return res[0] * res[1];
    }
}

//npm run compile && node . --11 -d
