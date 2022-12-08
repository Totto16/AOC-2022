import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type ParseType = string[][];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: 21,
        },
        second: {
            result: 8,
        },
    };

    parse(input: string[]): ParseType {
        return input.map((a) => a.split(''));
    }

    solve(input: ParseType): number {
        let sum = 0;
        const width = input[0].length;
        const height = input.length;
        for (let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                if (j === 0 || i === 0 || i === width - 1 || j === height - 1) {
                    ++sum;
                    continue;
                }
                const num = input[j][i];
                const isVisible = [true, true, true, true];

                input[j].forEach((elem, index) => {
                    if (index === i) {
                        return;
                    }

                    if (elem >= num) {
                        isVisible[i > index ? 1 : 0] = false;
                    }
                });

                input.forEach((elem, index) => {
                    if (index === j) {
                        return;
                    }

                    if (elem[i] >= num) {
                        isVisible[j > index ? 2 : 3] = false;
                    }
                });

                if (isVisible.reduce((acc, elem) => acc || elem, false)) {
                    ++sum;
                }
            }
        }

        return sum;
    }

    solve2(input: ParseType): number {
        let maxScore = 0;
        const width = input[0].length;
        const height = input.length;
        for (let i = 0; i < width; ++i) {
            for (let j = 0; j < height; ++j) {
                if (j === 0 || i === 0 || i === width - 1 || j === height - 1) {
                    // since multiplying by 0 gives always 0, skip these trees
                    continue;
                }
                const num = input[j][i];
                const visibleTrees = [0, 0, 0, 0];

                for (let a = i - 1; a >= 0; --a) {
                    const tree = input[j][a];
                    if (tree >= num) {
                        visibleTrees[0]++;
                        break;
                    }
                    visibleTrees[0]++;
                }

                for (let a = i + 1; a < width; ++a) {
                    const tree = input[j][a];
                    if (tree >= num) {
                        visibleTrees[1]++;
                        break;
                    }
                    visibleTrees[1]++;
                }

                for (let a = j - 1; a >= 0; --a) {
                    const tree = input[a][i];
                    if (tree >= num) {
                        visibleTrees[2]++;
                        break;
                    }
                    visibleTrees[2]++;
                }

                for (let a = j + 1; a < height; ++a) {
                    const tree = input[a][i];
                    if (tree >= num) {
                        visibleTrees[3]++;
                        break;
                    }
                    visibleTrees[3]++;
                }

                const score = visibleTrees.reduce((acc, elem) => acc * elem, 1);
                maxScore = Math.max(score, maxScore);
            }
        }

        return maxScore;
    }
}

//npm run compile && node . --8 -d
