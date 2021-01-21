export interface IUser {
    name: string;
    first: number;
    second: number;
}

export interface IPlayedRound {
    round: number;
    leader_board: ILeaderBoard[];
}

export interface ILeaderBoard {
    name: string;
    lower: number;
    upper: number;
    score: number;
    winner: boolean;
}

export interface IPlayers {
    name: string;
    upper: number;
    lower: number;
    joined: boolean;
}