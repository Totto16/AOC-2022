export function initPrototypes(): void {
    // "header guard" to not execute multiple times
    // eslint-disable-next-line no-prototype-builtins
    if (Array.hasOwnProperty('equals')) {
        return;
    }
    //some useful Functions, copy from Day 09 and further along to have all useful functions on Arrays
    Object.defineProperty(Array.prototype, 'equals', {
        value<T = unknown>(this: T[], second: T[], amount = -1) {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first = this;
            if (!Array.isArray(first) || !Array.isArray(second)) {
                return false;
            }
            if (amount > 0) {
                const length = first.length === second.length ? first.length : Math.min(first.length, second.length);
                if (length < amount) {
                    return false;
                }
                for (let i = 0; i < amount; i++) {
                    if (first.at(i) !== second.at(i)) {
                        return false;
                    }
                }
                return true;
            }
            return first.length === second.length && first.every((a, index) => a === second.at(index));
        },
    });

    Object.defineProperty(Array.prototype, 'includesArray', {
        value<T = unknown>(this: T[][], singleArray: T[]): boolean {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const BigArray = this;
            return BigArray.reduce<boolean>((acc: boolean, cnt: T[]): boolean => {
                return cnt.equals(singleArray) || acc;
            }, false);
        },
    });

    Object.defineProperty(Array.prototype, 'printNested', {
        value<T = unknown>(
            this: T[][] | T[],
            mapFunction: PrintNestedMapFunction<T> = (a: T): string => (a === 0 ? '.' : (a as string).toString()),
            separator = ' ',
            EOL = '\n'
        ) {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const array = this;
            try {
                const toLog = array
                    .map((a: T | T[]): string => {
                        if (!Array.isArray(a)) {
                            throw new Error();
                        }
                        return a.map((b: T) => mapFunction(b)).join(separator);
                    })
                    .join(EOL);
                console.log(toLog);
                return true;
            } catch (e) {
                return false;
            }
        },
    });

    Object.defineProperty(Array.prototype, 'copy', {
        value<T = unknown>(this: T[]): Array<T> {
            // eslint-disable-next-line this/no-this
            return JSON.parse(JSON.stringify(this)) as Array<T>;
        },
    });

    Object.defineProperty(Array.prototype, 'isArray', {
        value() {
            return true;
        },
    });

    Object.defineProperty(Object.prototype, 'isArray', {
        value() {
            return false;
        },
    });

    Object.defineProperty(Number.prototype, 'isArray', {
        value() {
            return false;
        },
    });

    Object.defineProperty(Array.prototype, 'count', {
        value<T = unknown>(
            this: T[] | T[][],
            countFunction: CountFunction<T> = (a: T): number => a as number,
            startValue = 0
        ) {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const array: T[] | T[][] = this;
            const reduceFunction: (acc: number, el: T | T[]) => number = (acc: number, el: T | T[]): number => {
                if (!Array.isArray(el)) {
                    return acc + countFunction(el);
                }
                return acc + el.reduce(reduceFunction, startValue);
            };

            // typescript can't deduce, that the reduce is valid in both cases, if array is T[] or T[][]
            if (Array.isArray(array[0])) {
                return (array as T[][]).reduce<number>(reduceFunction, startValue);
            } else {
                return (array as T[]).reduce<number>(reduceFunction, startValue);
            }
        },
    });

    Object.defineProperty(Array.prototype, 'combine', {
        value<T = unknown>(this: Array<T>, second: Array<T>, flat = true) {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: Array<T> = this;
            if (!Array.isArray(first) || !Array.isArray(second)) {
                return [];
            }
            const result = [];
            for (let i = 0; i < first.length; i++) {
                for (let j = 0; j < second.length; j++) {
                    let p: T[] = [first.atSafe(i), second.atSafe(j)];
                    if (flat && (Array.isArray(first.at(i)) || Array.isArray(second.at(j)))) {
                        p = p.flat() as T[];
                    }
                    result.push(p);
                }
            }
            return result;
        },
    });

    Object.defineProperty(Array.prototype, 'fillElements', {
        value<T = unknown>(this: PossibleFillTypes | T, startValue = 0, end = 1000): number[] {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: PossibleFillTypes | T = this;
            if (!Array.isArray(first)) {
                return [];
            }

            if (first.length > 3) {
                return [];
            }

            const newArray = [];
            for (let i = 0; i < first.length; i++) {
                if (first.at(i) === '..') {
                    const startNumber: number = i > 0 && first[i - 1] !== '..' ? (first[i - 1] as number) : startValue;
                    const endNumber: number =
                        i < first.length - 1 && first[i + 1] !== '..' ? (first[i + 1] as number) : end;
                    const diff = endNumber >= startNumber ? 1 : -1;
                    const compareFunction =
                        endNumber >= startNumber ? (a: number, b: number) => a <= b : (a: number, b: number) => a >= b;
                    for (let j: number = startNumber; compareFunction(j, endNumber); j += diff) {
                        newArray.push(j);
                    }
                }
            }
            return newArray;
        },
    });

    Object.defineProperty(Array.prototype, 'print', {
        value<T = unknown>(this: T[]) {
            try {
                // eslint-disable-next-line this/no-this
                const toPrint = JSON.stringify(this);
                console.log(toPrint);
            } catch (e) {
                return false;
            }
            return;
        },
    });

    Object.defineProperty(Array.prototype, 'atSafe', {
        value<T = unknown>(this: T[], index: number): Exclude<T, undefined> {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: Array<T> = this;
            if (index < -first.length || index >= first.length) {
                throw new Error(`Array.atSafe: Index out of range: ${-first.length} > ${index} >= ${first.length}`);
            }
            const result: T | undefined = first.at(index);
            if (result === undefined) {
                throw new Error(`Array.atSafe: Fatal error, Array.at() returned undefined`);
            }
            return result as Exclude<T, undefined>;
        },
    });

    Object.defineProperty(Array.prototype, 'indexOfNested', {
        value<T = unknown>(this: Array<Array<T>>, element: Array<T>): number {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: Array<Array<T>> = this;

            for (let index = 0; index < first.length; ++index) {
                if (first.atSafe(index).equals(element)) {
                    return index;
                }
            }

            return -1;
        },
    });

    Object.defineProperty(Array.prototype, 'times', {
        value(this: number[], factor: number): number[] {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: number[] = this;
            return first.map((a) => a * factor);
        },
    });

    Object.defineProperty(Array.prototype, 'add', {
        value(
            this: number[],
            arg: number | number[],
            constraintFunction: (nr: number, index: number) => number = (a) => a
        ): number[] {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: number[] = this;
            if (!Array.isArray(arg)) {
                return first.map((a, index) => constraintFunction(a + arg, index));
            } else {
                const res: number[] = [];
                for (let i = 0; i < Math.max(first.length, arg.length); ++i) {
                    res.push(constraintFunction((first.at(i) ?? 0) + (arg.at(i) ?? 0), i));
                }
                return res;
            }
        },
    });

    Object.defineProperty(Number.prototype, 'clamp', {
        value(this: number, min: number, max: number, endInclusive = false): number {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: number = this;
            const result = Math.max(Math.min(endInclusive ? max : max - 1, first), min);
            return result;
        },
    });

    Object.defineProperty(String.prototype, 'atSafe', {
        value(this: string, index: number): string {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: string = this;
            if (index < -first.length || index >= first.length) {
                throw new Error(`Array.atSafe: Index out of range: ${-first.length} > ${index} >= ${first.length}`);
            }
            const result: string | undefined = first.at(index);
            if (result === undefined) {
                throw new Error(`Array.atSafe: Fatal error, Array.at() returned undefined`);
            }
            return result;
        },
    });

    Object.defineProperty(String.prototype, 'count', {
        value(this: string, char: string): number {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: string = this;
            if (char.length !== 1) {
                throw new Error(`String.count() can only count chars, not strings: input was: '${char}'`);
            }
            let result = 0;
            for (let i = 0; i < first.length; ++i) {
                if (first.atSafe(i) === char) {
                    ++result;
                }
            }
            return result;
        },
    });

    Object.defineProperty(String.prototype, 'toStringOfLength', {
        value<Min extends number, Max extends number = Min>(
            this: string,
            min: Min,
            max?: Max
        ): StringOfLength<Min, Max> {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: string = this;

            if (!first.isStringOfLength(min, max ?? min)) {
                throw new Error(`String.toStringOfLength: string is not between ${min} and ${max ?? min}`);
            }

            return first;
        },
    });

    Object.defineProperty(String.prototype, 'isStringOfLength', {
        value<Min extends number, Max extends number = Min>(this: string, min: Min, max?: Max): boolean {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: string = this;
            return first.length >= min && first.length <= (max ?? min);
        },
    });

    Object.defineProperty(String.prototype, 'toCharCode', {
        value(this: StringOfLength<1, 1>): number {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: StringOfLength<1, 1> = this;
            return first.charCodeAt(0);
        },
    });

    Object.defineProperty(String.prototype, 'replaceAt', {
        value(this: string, index: number, replaceWith: string): string {
            // eslint-disable-next-line this/no-this, @typescript-eslint/no-this-alias
            const first: string = this;
            const result = first.substring(0, index) + replaceWith + first.substring(index + replaceWith.length);
            if (index >= first.length || index < 0 || isNaN(index)) {
                throw new Error(
                    `String.replaceAt: can't pass an index, that isn't a valid index into the string, but passed ${index} to a string of length ${first.length}`
                );
            }
            return result;
        },
    });
}

export type PrintNestedMapFunction<T = unknown> = (a: T) => string;

export type CountFunction<T = unknown> = (a: T) => number;

export type PossibleFillTypes = [number, '..', number] | ['..', number] | [number, '..'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
export type StringOfLength<Min, Max> = string & {
    readonly StringOfLength: unique symbol; // this is the phantom type
};
