import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type Output = [type: 'dir', name: string] | [type: 'file', name: string, size: number];

type CommandType = 'cd' | 'ls';

type TypeMapping = {
    cd: {
        name: string;
    };
    ls: {
        name?: never;
    };
};

type Command<T extends CommandType = CommandType> = {
    type: T;
} & TypeMapping[T];

type Instruction = Command | Output;

type File = [name: string, size: number];

type Folder = [size: number, files: File[]];

type FileSystem = {
    [key in string]: Folder;
};

type ParseType = Instruction[];
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
    };

    tests: TestOptions = {
        first: {
            result: 95437,
        },
        second: {
            result: 24933642,
        },
    };

    parse(input: string[]): ParseType {
        return input.map((inp) => {
            if (inp.startsWith('$')) {
                const result1 = /^\$ (cd) ([\w\.\/]+)$/.exec(inp);
                if (result1 !== null) {
                    return { type: 'cd', name: result1[2] };
                } else if (inp === '$ ls') {
                    return { type: 'ls' };
                } else {
                    throw new Error(`Unrecognized command: '${inp}'`);
                }
            }

            const result1 = /^(\d+) ([\w\.]+)$/.exec(inp);

            if (result1 !== null) {
                const [, size, name] = result1;
                return ['file', name, parseInt(size)];
            }

            const result2 = /^dir (\w+)$/.exec(inp);
            if (result2 === null) {
                throw new Error(`Unrecognized output: '${inp}'`);
            }

            return ['dir', result2[1]];
        });
    }

    parseInstructions(instructions: Instruction[]): FileSystem {
        const root: FileSystem = { '/': [-1, []] };
        const currentDir: string[] = [];
        let currentMode: 'ls' | '' = '';
        for (const _inst of instructions) {
            if (!Array.isArray(_inst)) {
                const { type, name } = _inst as Command;
                if (type === 'cd') {
                    currentMode = '';
                    if (name === '/') {
                        currentDir.push('');
                    } else if (name === '.') {
                        continue;
                    } else if (name === '..') {
                        currentDir.splice(-1);
                    } else {
                        currentDir.push(name as string);
                    }
                    const index = currentDir.length === 1 ? '/' : currentDir.join('/');
                    if ((root[index] as Folder | undefined) === undefined) {
                        throw new Error(`Can't cd in non existing directory: '${index}'`);
                    }
                } else {
                    currentMode = 'ls';
                    continue;
                }
            } else {
                if (currentMode !== 'ls') {
                    throw new Error(`Not in ls mode. but got an Output!`);
                }
                const [type, name, size]: Output = _inst;
                if (type === 'dir') {
                    const toCreate = [...currentDir, name];
                    const index = toCreate.length === 1 ? '/' : toCreate.join('/');
                    if ((root[index] as Folder | undefined) === undefined) {
                        root[index] = [-1, []];
                    }
                } else {
                    const index = currentDir.length === 1 ? '/' : currentDir.join('/');
                    if ((root[index] as Folder | undefined) === undefined) {
                        throw new Error(`FATAl internal bug, no directory with name '${index}' available`);
                    }
                    root[index][1].push([name, size]);
                }
            }
        }

        const allKeys = Object.keys(root).sort((a, b) => {
            const [, ...aP] = a.split('/');
            const [, ...bP] = b.split('/');
            if (aP.length === bP.length) {
                if (aP[0] === '') {
                    return 1;
                } else if (bP[0] === '') {
                    return -1;
                } else {
                    return a.localeCompare(b);
                }
            } else {
                return bP.length - aP.length;
            }
        });

        for (const key of allKeys) {
            const files: File[] = root[key][1];
            const fileSize = files.reduce((acc, [, size]) => acc + size, 0);
            const subFolderSize = Object.entries(root).reduce((acc, [name, [size]]) => {
                if (name === key) {
                    return acc;
                } else if (name.startsWith(key)) {
                    const folder = key === '/' ? key : `${key}/`;
                    const subFolderName = name.substring(folder.length);
                    if (subFolderName.includes('/')) {
                        return acc;
                    }
                    if (size < 0) {
                        throw new Error(
                            `Subfolder '${name}' of '${key}' wasn't ordered in the correct way, it shouldn't have an uninitialized size!`
                        );
                    }
                    return size + acc;
                }

                return acc;
            }, 0);
            root[key][0] = fileSize + subFolderSize;
        }

        return root;
    }

    solve(input: ParseType): number {
        const filesystem = this.parseInstructions(input);

        return Object.entries(filesystem).reduce((acc, [, [size]]) => {
            if (size <= 100000) {
                return size + acc;
            }

            return acc;
        }, 0);
    }

    solve2(input: ParseType): number {
        const filesystem = this.parseInstructions(input);
        const totalSize = 70000000;
        const needFreeSize = 30000000;
        const rootSize = filesystem['/'][0];
        const usedSize = totalSize - rootSize;
        if (usedSize < 0) {
            throw new Error(
                `Your system used more than you have available: '${usedSize}', this is a size calculate Error!`
            );
        }
        const needSize = needFreeSize - usedSize;

        const sizes = Object.values(filesystem)
            .map(([size]) => size)
            .sort((a, b) => a - b)
            .filter((a) => a > needSize);

        return sizes[0];
    }
}

//npm run compile && node . --7 -d
