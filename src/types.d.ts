import { CountFunction, PossibleFillTypes, PrintNestedMapFunction, StringOfLength } from './prototypes';

export {};
declare global {
    interface Array<T> {
        equals(array: Array<T>): boolean;
        includesArray<U = T>(this: Array<Array<U>>, array: Array<U>): boolean;
        printNested<U = T>(
            this: Array<U> | Array<Array<U>>,
            mapFunction?: PrintNestedMapFunction<U>,
            separator?: string,
            EOL?: string
        ): void;
        copy(): Array<T>;
        isArray(): true;
        count<U = T>(this: Array<U> | Array<Array<U>>, countFunction?: CountFunction<U>, startValue?: number): number;
        combine(second: Array<T>, flat?: boolean): Array<T>;
        fillElements(
            this: PossibleFillTypes | T[],
            start?: number,
            end?: number
        ): this extends PossibleFillTypes ? Array<number> : [];
        print(): false | void;
        atSafe(index: number): Exclude<T, undefined>;
        indexOfNested<U = T>(this: Array<Array<U>>, element: Array<U>): number;
        times(this: Array<number>, factor: number): Array<number>;
        add(
            this: Array<number>,
            number: number | Array<number>,
            constraintFunction?: (nr: number, index: number) => number
        ): Array<number>;
        sum(this: Array<number> | Array<number[]>, start?: number): number;
        includesAll(this: Array<T>, array: Array<T>): boolean;
        toNestedString<U = T>(
            this: Array<U> | Array<Array<U>>,
            mapFunction?: PrintNestedMapFunction<U>,
            separator?: string,
            EOL?: string
        ): string;
    }

    interface Object {
        isArray(): boolean;
    }

    interface Number {
        clamp(this: Number, min: Number, max: Number, endInclusive?: boolean): Number;
    }

    interface String {
        atSafe(this: String, index: number): string;
        count(this: String, char: StringOfLength<1, 1>): number;
        toStringOfLength<Min extends number, Max extends number = Min>(
            this: String,
            min: Min,
            max?: Max
        ): StringOfLength<Min, Max>;
        isStringOfLength<Min extends number, Max extends number = Min>(
            this: String,
            min: Min,
            max?: Max
        ): this is StringOfLength<Min, Max>;
        toCharCode(this: string): number;
        replaceAt(this: string, index: number, replaceWith: string): string;
    }

    interface ArrayConstructor {
        nested<T>(width: number, height: number, cb: (i: number, j: number) => T, offsetArr?: [number, number]): T[][];
    }
}
