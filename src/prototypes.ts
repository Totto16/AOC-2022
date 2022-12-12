import EventEmitter from 'events';

export function initPrototypes(): void {
    // "header guard" to not execute multiple times
    // eslint-disable-next-line no-prototype-builtins
    if (Array.prototype.hasOwnProperty('equals')) {
        return;
    }

    //some useful Functions, copy from Day 09 and further along to have all useful functions on Arrays
    Object.defineProperty(Array.prototype, 'equals', {
        value<T = unknown>(this: T[], second: T[], amount = -1) {
            if (!Array.isArray(this) || !Array.isArray(second)) {
                return false;
            }
            if (amount > 0) {
                const length = this.length === second.length ? this.length : Math.min(this.length, second.length);
                if (length < amount) {
                    return false;
                }
                for (let i = 0; i < amount; i++) {
                    if (this.at(i) !== second.at(i)) {
                        return false;
                    }
                }
                return true;
            }
            return this.length === second.length && this.every((a, index) => a === second.at(index));
        },
    });

    Object.defineProperty(Array.prototype, 'includesArray', {
        value<T = unknown>(this: T[][], singleArray: T[]): boolean {
            return this.reduce<boolean>((acc: boolean, cnt: T[]): boolean => {
                return cnt.equals(singleArray) || acc;
            }, false);
        },
    });

    Object.defineProperty(Array.prototype, 'toNestedString', {
        value<T = unknown>(
            this: T[][] | T[],
            mapFunction: PrintNestedMapFunction<T> = (a: T): string => (a === 0 ? '.' : (a as string).toString()),
            separator = ' ',
            EOL = '\n'
        ) {
            try {
                const toLog = this.map((a: T | T[]): string => {
                    if (!Array.isArray(a)) {
                        throw new Error();
                    }
                    return a.map((b: T) => mapFunction(b)).join(separator);
                }).join(EOL);
                return toLog;
            } catch (e) {
                return (e as Error).message;
            }
        },
    });

    Object.defineProperty(Array.prototype, 'printNested', {
        value<T = unknown>(
            this: T[][] | T[],
            mapFunction: PrintNestedMapFunction<T> = (a: T): string => (a === 0 ? '.' : (a as string).toString()),
            separator = ' ',
            EOL = '\n'
        ) {
            const toLog = this.toNestedString(mapFunction, separator, EOL);
            console.log(toLog);
        },
    });

    Object.defineProperty(Array.prototype, 'copy', {
        value<T = unknown>(this: T[]): Array<T> {
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
            const reduceFunction: (acc: number, el: T | T[]) => number = (acc: number, el: T | T[]): number => {
                if (!Array.isArray(el)) {
                    return acc + countFunction(el);
                }
                return acc + el.reduce(reduceFunction, startValue);
            };

            // typescript can't deduce, that the reduce is valid in both cases, if array is T[] or T[][]
            if (Array.isArray(this[0])) {
                return (this as T[][]).reduce<number>(reduceFunction, startValue);
            } else {
                return (this as T[]).reduce<number>(reduceFunction, startValue);
            }
        },
    });

    Object.defineProperty(Array.prototype, 'combine', {
        value<T = unknown>(this: Array<T>, second: Array<T>, flat = true) {
            if (!Array.isArray(this) || !Array.isArray(second)) {
                return [];
            }
            const result = [];
            for (let i = 0; i < this.length; i++) {
                for (let j = 0; j < second.length; j++) {
                    let p: T[] = [this.atSafe(i), second.atSafe(j)];
                    if (flat && (Array.isArray(this.at(i)) || Array.isArray(second.at(j)))) {
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
            if (!Array.isArray(this)) {
                return [];
            }

            if (this.length > 3) {
                return [];
            }

            const newArray = [];
            for (let i = 0; i < this.length; i++) {
                if (this.at(i) === '..') {
                    const startNumber: number = i > 0 && this[i - 1] !== '..' ? (this[i - 1] as number) : startValue;
                    const endNumber: number =
                        i < this.length - 1 && this[i + 1] !== '..' ? (this[i + 1] as number) : end;
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
            if (index < -this.length || index >= this.length) {
                throw new Error(`Array.atSafe: Index out of range: ${-this.length} > ${index} >= ${this.length}`);
            }
            const result: T | undefined = this.at(index);
            if (result === undefined) {
                throw new Error(`Array.atSafe: Fatal error, Array.at() returned undefined`);
            }
            return result as Exclude<T, undefined>;
        },
    });

    Object.defineProperty(Array.prototype, 'indexOfNested', {
        value<T = unknown>(this: Array<Array<T>>, element: Array<T>): number {
            for (let index = 0; index < this.length; ++index) {
                if (this.atSafe(index).equals(element)) {
                    return index;
                }
            }

            return -1;
        },
    });

    Object.defineProperty(Array.prototype, 'times', {
        value(this: number[], factor: number): number[] {
            return this.map((a) => a * factor);
        },
    });

    Object.defineProperty(Array.prototype, 'add', {
        value(
            this: number[],
            arg: number | number[],
            constraintFunction: (nr: number, index: number) => number = (a) => a
        ): number[] {
            if (!Array.isArray(arg)) {
                return this.map((a, index) => constraintFunction(a + arg, index));
            } else {
                const res: number[] = [];
                for (let i = 0; i < Math.max(this.length, arg.length); ++i) {
                    res.push(constraintFunction((this.at(i) ?? 0) + (arg.at(i) ?? 0), i));
                }
                return res;
            }
        },
    });

    Object.defineProperty(Array.prototype, 'sum', {
        value(this: Array<number> | Array<number[]>, start = 0): number {
            if (this.length === 0) {
                return start;
            }
            if (!Array.isArray(this[0])) {
                return (this as number[]).reduce((acc, el) => acc + el, start);
            } else {
                return (this as number[][]).reduce((acc, el) => acc + el.sum(), start);
            }
        },
    });

    Object.defineProperty(Array.prototype, 'includesAll', {
        value<T = unknown>(this: T[], singleArray: T[]): boolean {
            for (const elem of singleArray) {
                if (!this.includes(elem)) {
                    return false;
                }
            }
            return true;
        },
    });

    Object.defineProperty(Number.prototype, 'clamp', {
        value(this: number, min: number, max: number, endInclusive = false): number {
            const result = Math.max(Math.min(endInclusive ? max : max - 1, this), min);
            return result;
        },
    });

    Object.defineProperty(String.prototype, 'atSafe', {
        value(this: string, index: number): string {
            if (index < -this.length || index >= this.length) {
                throw new Error(`Array.atSafe: Index out of range: ${-this.length} > ${index} >= ${this.length}`);
            }
            const result: string | undefined = this.at(index);
            if (result === undefined) {
                throw new Error(`Array.atSafe: Fatal error, Array.at() returned undefined`);
            }
            return result;
        },
    });

    Object.defineProperty(String.prototype, 'count', {
        value(this: string, char: string): number {
            if (char.length !== 1) {
                throw new Error(`String.count() can only count chars, not strings: input was: '${char}'`);
            }
            let result = 0;
            for (let i = 0; i < this.length; ++i) {
                if (this.atSafe(i) === char) {
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
            if (!this.isStringOfLength(min, max ?? min)) {
                throw new Error(`String.toStringOfLength: string is not between ${min} and ${max ?? min}`);
            }

            return this;
        },
    });

    Object.defineProperty(String.prototype, 'isStringOfLength', {
        value<Min extends number, Max extends number = Min>(this: string, min: Min, max?: Max): boolean {
            return this.length >= min && this.length <= (max ?? min);
        },
    });

    Object.defineProperty(String.prototype, 'toCharCode', {
        value(this: StringOfLength<1, 1>): number {
            return this.charCodeAt(0);
        },
    });

    Object.defineProperty(String.prototype, 'replaceAt', {
        value(this: string, index: number, replaceWith: string): string {
            const result = this.substring(0, index) + replaceWith + this.substring(index + replaceWith.length);
            if (index >= this.length || index < 0 || isNaN(index)) {
                throw new Error(
                    `String.replaceAt: can't pass an index, that isn't a valid index into the string, but passed ${index} to a string of length ${this.length}`
                );
            }
            return result;
        },
    });

    Object.defineProperty(Array, 'nested', {
        value<T = unknown>(
            width: number,
            height: number,
            cb: (x: number, y: number) => T,
            offsetArr: [number, number] = [0, 0]
        ): T[][] {
            const arr = new Array(height)
                .fill(undefined)
                .map((_, index) =>
                    new Array(width).fill(undefined).map((__, ind2) => cb(offsetArr[1] + ind2, offsetArr[0] + index))
                );
            return arr;
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

export function ListenToAllEvents(): void {
    const items = new Set();
    const originalEmit = EventEmitter.prototype.emit;
    EventEmitter.prototype.emit = function (event: string | symbol, ...args: any[]): boolean {
        // Do what you want here
        const id = this.constructor.name + ':' + event.toString();
        if (!items.has(id)) {
            items.add(id);
            console.log(id, args);
        }

        // And then call the original
        return originalEmit.call(this, event, ...args);
    };
}
