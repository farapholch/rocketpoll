import {
    IModify,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPoll, IPollCreateData, IVoteOption } from "../definition";
import { createPollBlocks } from "./createPollBlocks";
import { storePoll } from "./storePoll";

export async function createPollMessage(
    modify: IModify,
    persistence: IPersistence,
    room: IRoom,
    user: IUser,
    data: IPollCreateData
): Promise<string> {
    const builder = modify.getCreator().startMessage();
    
    // Initiera röster för varje alternativ
    const votes: IVoteOption[] = data.options.map(() => ({
        quantity: 0,
        voters: [],
    }));

    // Skapa poll-objekt (msgId sätts efter meddelandet skapats)
    const poll: IPoll = {
        msgId: "", // Sätts senare
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

    // Bygg meddelandet
    builder.setRoom(room);
    builder.setSender(user);
    
    const block = modify.getCreator().getBlockBuilder();
    createPollBlocks(block, poll, true);
    builder.setBlocks(block);

    // Skicka meddelandet och få tillbaka ID
    const msgId = await modify.getCreator().finish(builder);
    
    // Uppdatera poll med msgId och spara
    poll.msgId = msgId;
    await storePoll(persistence, poll);

    return msgId;
}
