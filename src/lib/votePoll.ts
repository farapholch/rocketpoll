import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { createVoter } from "../definition";
import { getPoll } from "./getPoll";
import { storePoll } from "./storePoll";
import { createPollBlocks } from "./createPollBlocks";

export async function votePoll(
    read: IRead,
    modify: IModify,
    persistence: IPersistence,
    pollId: string,
    voteIndex: number,
    user: IUser
): Promise<{ success: boolean; message?: string }> {
    const poll = await getPoll(read.getPersistenceReader(), pollId);
    
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
    
    const existingIndex = poll.votes[voteIndex].voters.findIndex(
        (v) => v.id === voter.id
    );

    if (existingIndex !== -1) {
        poll.votes[voteIndex].voters.splice(existingIndex, 1);
        poll.votes[voteIndex].quantity--;
        poll.totalVotes--;
    } else {
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
        
        poll.votes[voteIndex].voters.push(voter);
        poll.votes[voteIndex].quantity++;
        poll.totalVotes++;
    }

    await storePoll(persistence, poll);

    // Uppdatera meddelandet
    if (poll.visibleMsgId) {
        const room = await read.getRoomReader().getById(poll.roomId);
        if (room) {
            try {
                const msgReader = read.getMessageReader();
                const originalMsg = await msgReader.getById(poll.visibleMsgId);
                
                if (originalMsg && originalMsg.sender) {
                    const updater = await modify.getUpdater().message(poll.visibleMsgId, originalMsg.sender);
                    updater.setRoom(room);
                    
                    const block = modify.getCreator().getBlockBuilder();
                    createPollBlocks(block, poll, !poll.finished);
                    updater.setBlocks(block);
                    
                    await modify.getUpdater().finish(updater);
                }
            } catch (e) {
                // Ignorera fel vid uppdatering
            }
        }
    }

    return { success: true };
}
