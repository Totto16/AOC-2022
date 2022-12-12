import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type Type = 'normal' | 'best' | 'start';
type Height = { height: number; type: Type };
type Point = [x: number, y: number];
type PointInfo = { point: Point; cost: number };

type ParseType = Height[][];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
        slowness: 1,
    };

    tests: TestOptions = {
        first: {
            result: 31,
        },
        second: {
            result: 29,
        },
    };

    parse(input: string[]): ParseType {
        return input.map((inp) =>
            inp.split('').map((sq) => {
                const inpCh = sq.toCharCode();
                const aCh = 'a'.toCharCode();
                if (inpCh >= aCh && inpCh <= 'z'.toCharCode()) {
                    return { height: inpCh - aCh, type: 'normal' };
                } else if (sq === 'S') {
                    return { height: 0, type: 'start' };
                } else if (sq === 'E') {
                    return { height: 'z'.toCharCode() - aCh, type: 'best' };
                } else {
                    throw new Error(`Unrecognized input: '${sq}'`);
                }
            })
        );
    }

    findPointByType(arr: ParseType, type: Type): Point {
        for (let y = 0; y < arr.length; ++y) {
            for (let x = 0; x < arr[0].length; ++x) {
                if (arr[y][x].type === type) {
                    return [x, y];
                }
            }
        }
        throw new Error(`Couldn't find ${type} in findPointByType`);
    }

    findShortestPath(input: ParseType, startPos: Point): number | undefined {
        const found: PointInfo[] = [];
        let searching: PointInfo[] = [{ point: startPos, cost: 0 }];

        function getValidNeighbors([x, y]: Point): Point[] {
            const neighbors: Point[] = [];
            const width = input[0].length;
            const height = input.length;
            if (x > 0) {
                neighbors.push([x - 1, y]);
            }
            if (x < width - 1) {
                neighbors.push([x + 1, y]);
            }

            if (y > 0) {
                neighbors.push([x, y - 1]);
            }
            if (y < height - 1) {
                neighbors.push([x, y + 1]);
            }

            const selfWeight = input[y][x].height;

            return neighbors.filter(([i, j]) => {
                const weight = input[j][i].height;
                if (weight - selfWeight <= 1) {
                    return true;
                }

                return false;
            });
        }

        function includesPoint(list: PointInfo[], neighbor: Point, updateCost?: number): boolean {
            for (let i = 0; i < list.length; ++i) {
                const { point, cost } = list[i];
                if (point.equals(neighbor)) {
                    if (updateCost !== undefined && cost > updateCost) {
                        list[i].cost = updateCost;
                    }
                    return true;
                }
            }
            return false;
        }

        while (searching.length !== 0) {
            const [{ point, cost }] = searching.splice(0, 1);
            found.push({ point, cost });
            const neighbors: Point[] = getValidNeighbors(point);
            for (const neighbor of neighbors) {
                if (!includesPoint(found, neighbor)) {
                    if (!includesPoint(searching, neighbor, cost + 1)) {
                        searching.push({ point: neighbor, cost: cost + 1 });
                    }
                }
            }
            searching = searching.sort(({ cost: cost1 }, { cost: cost2 }) => cost1 - cost2);
        }

        const endPoint = this.findPointByType(input, 'best');
        for (const { point, cost } of found) {
            if (endPoint.equals(point)) {
                return cost;
            }
        }
        return undefined;
    }

    solve(input: ParseType): number {
        const startPos = this.findPointByType(input, 'start');
        const result = this.findShortestPath(input, startPos);
        if (result === undefined) {
            throw new Error(`The algorithm failed`);
        }
        return result;
    }

    solve2(input: ParseType): number {
        const paths: number[] = [];
        for (let y = 0; y < input.length; ++y) {
            for (let x = 0; x < input[0].length; ++x) {
                // a has heigth 0
                if (input[y][x].height === 0) {
                    const result = this.findShortestPath(input, [x, y]);
                    if (result !== undefined) {
                        paths.push(result);
                    }
                }
            }
        }

        if (paths.length === 0) {
            throw new Error(`The algorithm failed, no startPoint (a) found!`);
        }

        paths.sort((a, b) => a - b);

        return paths[0];
    }
}

//npm run compile && node . --12 -d
