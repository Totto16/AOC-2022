import { SolutionTemplate, TestOptions, AdvancedStartOptions } from '../utils';

type ParseType = [string, string][];

type PlayState = 'win' | 'draw' | 'lose';

type GameState = 'rock' | 'paper' | 'scissor';

type GameStateWinMap = {
    [key in GameState]: GameState;
};
export default class Solution extends SolutionTemplate<ParseType, number> {
    options: AdvancedStartOptions = {
        filename: __filename,
        needsPrototypes: true,
        inputOptions: { filterOutEmptyLines: true, separator: '\n' },
        slowness: 1,
    };

    tests: TestOptions = {
        first: {
            result: 15,
        },
        second: {
            result: 12,
        },
    };

    parse(input: string[]): ParseType {
        return input.map((a) => a.split(' ')) as ParseType;
    }

    winMap: GameStateWinMap = {
        rock: 'scissor',
        paper: 'rock',
        scissor: 'paper',
    };

    play(_played: string, _toPlay: string): [state: PlayState, points: number] {
        const played = this.parsePlayed(_played);
        const toPlay = this.parsePlayed(_toPlay);
        if (toPlay === played) {
            return ['draw', 3];
        }

        // eslint-disable-next-line security/detect-object-injection
        const winsAgainst = this.winMap[toPlay];
        if (winsAgainst === played) {
            return ['win', 6];
        }

        return ['lose', 0];
    }

    parsePlayed(played: string): GameState {
        switch (played) {
            case 'A':
                return 'rock';
            case 'B':
                return 'paper';
            case 'C':
                return 'scissor';
            case 'X':
                return 'rock';
            case 'Y':
                return 'paper';
            case 'Z':
                return 'scissor';
            case 'rock':
                return 'rock';
            case 'paper':
                return 'paper';
            case 'scissor':
                return 'scissor';
            default:
                throw new Error(`Unexpected input: '${played}'`);
        }
    }

    parseWinRequirement(played: string): PlayState {
        switch (played) {
            case 'X':
                return 'lose';
            case 'Y':
                return 'draw';
            case 'Z':
                return 'win';
            default:
                throw new Error(`Unexpected input: '${played}'`);
        }
    }

    gameStateToPoints(state: GameState): number {
        switch (state) {
            case 'rock':
                return 1;
            case 'paper':
                return 2;
            case 'scissor':
                return 3;
            default:
                throw new Error(`Unexpected input: '${state as string}'`);
        }
    }

    needsToPlay(_played: string, _stateToGet: string): GameState {
        const played = this.parsePlayed(_played);
        const stateToGet = this.parseWinRequirement(_stateToGet);
        if (stateToGet === 'draw') {
            return played;
        }

        // eslint-disable-next-line security/detect-object-injection
        const winsAgainst = this.winMap[played];
        if (stateToGet === 'lose') {
            return winsAgainst;
        }
        const AllStates: GameState[] = ['rock', 'paper', 'scissor'];
        const remainingOption: GameState[] = AllStates.filter((a) => {
            if (a === winsAgainst) {
                return false;
            }

            if (a === played) {
                return false;
            }

            return true;
        });
        return remainingOption[0];
    }

    solve(input: ParseType): number {
        let sum = 0;
        for (const [played, toPlay] of input) {
            const [, points] = this.play(played, toPlay);
            const playPoints = this.gameStateToPoints(this.parsePlayed(toPlay));
            sum += points + playPoints;
        }

        return sum;
    }

    solve2(input: ParseType): number {
        while (true) {
            console.log('$%$');
            if (process.env['gwgsdgs']) {
                break;
            }

            for (let i = 0; i < 10000000; ++i) {
                console.assert(([] as unknown as string) + ([] as unknown as string) === '');
            }
        }
        let sum = 0;
        for (const [played, stateToGet] of input) {
            const toPlay = this.needsToPlay(played, stateToGet);
            const [, points] = this.play(played, toPlay);
            const playPoints = this.gameStateToPoints(toPlay);
            sum += points + playPoints;
        }

        return sum;
    }
}

//npm run compile && node . --2 -d
