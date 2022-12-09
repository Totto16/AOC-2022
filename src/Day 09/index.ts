import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type Direction = 'R' | 'L' | 'D' | 'U';

type ParseType = [Direction, number][];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: 13,
        },
        second: {
            result: [-1, 36],
            tests: 2,
        },
    };

    parse(input: string[]): ParseType {
        return input.map((a) => {
            const [dir, amount] = a.split(' ');
            return [dir as Direction, parseInt(amount)];
        });
    }

    solve(input: ParseType): number {
        const tailVisited: number[][] = [[0, 0]];
        const tailPos = [0, 0];
        const headPos = [0, 0];

        function near() {
            if (headPos.equals(tailPos)) {
                return true;
            }

            const [a, b] = headPos;
            const [c, d] = tailPos;

            const xDist = Math.abs(a - c);
            const yDist = Math.abs(b - d);

            if (xDist <= 1 && yDist <= 1) {
                return true;
            }

            return false;
        }

        function moveNear() {
            if (near()) {
                throw new Error(`Unexpected state`);
            }

            const [a, b] = headPos;
            const [c, d] = tailPos;

            const xDist = Math.abs(a - c);
            const yDist = Math.abs(b - d);
            if (yDist === 100) {
                process.exit(1);
            }

            if (xDist <= 0) {
                if (b > d) {
                    tailPos[1] += 1;
                } else {
                    tailPos[1] -= 1;
                }
            } else if (yDist <= 0) {
                if (a > c) {
                    tailPos[0] += 1;
                } else {
                    tailPos[0] -= 1;
                }
            } else {
                const dirX = a > c ? 1 : -1;
                const dirY = b > d ? 1 : -1;

                tailPos[0] += dirX;
                tailPos[1] += dirY;
            }

            if (!tailVisited.includesArray(tailPos)) {
                tailVisited.push([...tailPos]);
            }
        }

        for (const [dir, amount] of input) {
            switch (dir) {
                case 'R':
                    headPos[0] += amount;
                    break;
                case 'L':
                    headPos[0] -= amount;
                    break;
                case 'U':
                    headPos[1] -= amount;
                    break;
                case 'D':
                    headPos[1] += amount;
                    break;
                default:
                    throw new Error(`unknown direction '${dir as string}'!`);
            }

            while (!near()) {
                moveNear();
            }
        }

        return tailVisited.length;
    }

    solve2(input: ParseType): number {
        type Tail = [number, number];

        const tail9Visited: number[][] = [[0, 0]];
        const tailPos: Tail[] = new Array(10).fill(undefined).map(() => [0, 0]);
        const headPos = [0, 0];

        function near(index = 0) {
            const [a, b] = index === 0 ? headPos : tailPos[index - 1];
            const [c, d] = tailPos[index];

            if ([a, b].equals([c, d])) {
                return true;
            }

            const xDist = Math.abs(a - c);
            const yDist = Math.abs(b - d);

            if (xDist <= 1 && yDist <= 1) {
                return true;
            }

            return false;
        }

        function moveNear(index = 0) {
            if (near(index)) {
                throw new Error(`Unexpected state`);
            }

            const [a, b] = index === 0 ? headPos : tailPos[index - 1];
            const [c, d] = tailPos[index];

            const xDist = Math.abs(a - c);
            const yDist = Math.abs(b - d);

            if (xDist <= 0) {
                const mv = b > d ? 1 : -1;
                tailPos[index][1] += mv;
            } else if (yDist <= 0) {
                const mv = a > c ? 1 : -1;
                tailPos[index][0] += mv;
            } else {
                const dirX = a > c ? 1 : -1;
                const dirY = b > d ? 1 : -1;

                tailPos[index][0] += dirX;
                tailPos[index][1] += dirY;
            }

            if (index === 9) {
                //  console.log(tailPos);
                if (!tail9Visited.includesArray(tailPos[9])) {
                    tail9Visited.push([...tailPos[9]]);
                }
            }
        }

        for (const [dir, amount] of input) {
            for (let i = 0; i < amount; ++i) {
                switch (dir) {
                    case 'R':
                        headPos[0] += 1;
                        break;
                    case 'L':
                        headPos[0] -= 1;
                        break;
                    case 'U':
                        headPos[1] -= 1;
                        break;
                    case 'D':
                        headPos[1] += 1;
                        break;
                    default:
                        throw new Error(`unknown direction '${dir as string}'!`);
                }

                while (!near()) {
                    for (let i = 0; i < 10; ++i) {
                        if (near(i)) {
                            break;
                        }
                        if (i === 0) {
                            moveNear(i);
                        } else {
                            while (!near(i)) {
                                // console.log(near(i), i, headPos, tailPos);
                                moveNear(i);
                            }
                        }
                    }

                    const arr = Array.nested<string>(
                        20,
                        10,
                        (x, y) => {
                            if (x === 0 && y === 0) {
                                return 's';
                            } else if (headPos.equals([x, y])) {
                                return 'H';
                            } else if (tailPos.includesArray([x, y])) {
                                return (tailPos.indexOfNested([x, y]) + 1).toString();
                            } else {
                                return '.';
                            }
                        },
                        [-5, -5]
                    );

                    arr.printNested<string>((a) => a, '');
                    console.log('-'.repeat(40));
                }
            }
        }

        //  console.log(tail9Visited);
        const arr = Array.nested<string>(
            30,
            40,
            (x, y) => {
                if (x === 0 && y === 0) {
                    return 's';
                } else if (tail9Visited.includesArray([x, y])) {
                    return '#';
                } else {
                    return '.';
                }
            },
            [-20, -15]
        );

        arr.printNested<string>((a) => a, '');

        return tail9Visited.length;
    }
}

//npm run compile && node . --9 -d
