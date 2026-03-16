import { IUser } from "@rocket.chat/apps-engine/definition/users";

export interface IVoter {
    id: string;
    username: string;
    name: string;
}

export interface IVoteOption {
    quantity: number;
    voters: IVoter[];
}

export interface IPoll {
    id: string;           // Unikt poll-ID (för persistence)
    visibleMsgId: string; // Det synliga meddelandets ID (för uppdatering)
    uid: string;
    username: string;
    roomId: string;
    question: string;
    options: string[];
    totalVotes: number;
    votes: IVoteOption[];
    singleChoice: boolean;
    confidential: boolean;
    showResults: boolean;
    finished: boolean;
    timeLimit?: number;
    expiresAt?: Date;
    createdAt: Date;
}

export interface IPollCreateData {
    question: string;
    options: string[];
    singleChoice: boolean;
    confidential: boolean;
    showResults: boolean;
    timeLimit?: number;
}

export function createVoter(user: IUser): IVoter {
    return {
        id: user.id,
        username: user.username,
        name: user.name || user.username,
    };
}
