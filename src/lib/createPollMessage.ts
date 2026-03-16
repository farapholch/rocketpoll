import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPoll, IPollCreateData, IVoteOption } from "../definition";
import { createPollBlocks } from "./createPollBlocks";
import { storePoll } from "./storePoll";

function generatePollId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export async function createPollMessage(
    modify: IModify,
    persistence: IPersistence,
    room: IRoom,
    user: IUser,
    data: IPollCreateData
): Promise<string> {
    const pollId = generatePollId();
    
    const votes: IVoteOption[] = data.options.map(() => ({
        quantity: 0,
        voters: [],
    }));

    const poll: IPoll = {
        id: pollId,
        visibleMsgId: "",
        uid: user.id,
        username: user.username,
        roomId: room.id,
        question: data.question,
        options: data.options,
        totalVotes: 0,
        votes,
        singleChoice: data.singleChoice,
        confidential: data.confidential,
        showResults: data.showResults,
        finished: false,
        timeLimit: data.timeLimit,
        createdAt: new Date(),
    };

    if (data.timeLimit && data.timeLimit > 0) {
        poll.expiresAt = new Date(Date.now() + data.timeLimit * 60 * 1000);
    }

    // Skapa meddelandet med blocks och TRV-ikon
    const builder = modify.getCreator().startMessage();
    builder.setRoom(room);
    builder.setSender(user);
    
    const block = modify.getCreator().getBlockBuilder();
    createPollBlocks(block, poll, true);
    builder.setBlocks(block);
    
    const msgId = await modify.getCreator().finish(builder);
    
    // Spara msgId i poll
    poll.visibleMsgId = msgId;
    await storePoll(persistence, poll);

    return pollId;
}
