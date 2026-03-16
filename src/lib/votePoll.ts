import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPoll, createVoter } from "../definition";
import { getPoll } from "./getPoll";
import { storePoll } from "./storePoll";
import { createPollBlocks } from "./createPollBlocks";

export async function votePoll(
    read: IRead,
    modify: IModify,
    persistence: IPersistence,
    msgId: string,
    voteIndex: number,
    user: IUser
): Promise<{ success: boolean; message?: string }> {
    const poll = await getPoll(read.getPersistenceReader(), msgId);
    
    if (!poll) {
        return { success: false, message: "Omröstningen hittades inte." };
    }

    if (poll.finished) {
        return { success: false, message: "Omröstningen är avslutad." };
    }

    if (voteIndex < 0 || voteIndex >= poll.options.length) {
        return { success: false, message: "Ogiltigt alternativ." };
    }

    const voter = createVoter(user);
    
    // Kolla om användaren redan röstat på detta alternativ
    const existingIndex = poll.votes[voteIndex].voters.findIndex(
        (v) => v.id === voter.id
    );

    if (existingIndex !== -1) {
        // Ta bort röst (toggle off)
        poll.votes[voteIndex].voters.splice(existingIndex, 1);
        poll.votes[voteIndex].quantity--;
        poll.totalVotes--;
    } else {
        // Om enkel röst: ta bort tidigare röst först
        if (poll.singleChoice) {
            for (let i = 0; i < poll.votes.length; i++) {
                const voterIdx = poll.votes[i].voters.findIndex(
                    (v) => v.id === voter.id
                );
                if (voterIdx !== -1) {
                    poll.votes[i].voters.splice(voterIdx, 1);
                    poll.votes[i].quantity--;
                    poll.totalVotes--;
                    break;
                }
            }
        }
        
        // Lägg till ny röst
        poll.votes[voteIndex].voters.push(voter);
        poll.votes[voteIndex].quantity++;
        poll.totalVotes++;
    }

    // Spara uppdaterad poll
    await storePoll(persistence, poll);

    // Uppdatera meddelandet
    await updatePollMessage(read, modify, poll);

    return { success: true };
}

async function updatePollMessage(
    read: IRead,
    modify: IModify,
    poll: IPoll
): Promise<void> {
    const room = await read.getRoomReader().getById(poll.roomId);
    if (!room) {
        return;
    }

    const msgReader = read.getMessageReader();
    const msg = await msgReader.getById(poll.msgId);
    if (!msg) {
        return;
    }

    const builder = await modify.getUpdater().message(poll.msgId, msg.sender);
    builder.setRoom(room);
    
    const block = modify.getCreator().getBlockBuilder();
    createPollBlocks(block, poll, !poll.finished);
    builder.setBlocks(block);

    await modify.getUpdater().finish(builder);
}
