import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPoll, IVoteOption } from "../definition";
import { getPoll } from "./getPoll";
import { storePoll } from "./storePoll";
import { createPollBlocks } from "./createPollBlocks";

export async function updatePoll(
    read: IRead,
    modify: IModify,
    persistence: IPersistence,
    pollId: string,
    newQuestion: string,
    newOptions: string[],
    user: IUser,
    singleChoice?: boolean,
    timeLimit?: number
): Promise<{ success: boolean; message?: string }> {
    const poll = await getPoll(read.getPersistenceReader(), pollId);
    
    if (!poll) {
        return { success: false, message: "Omröstningen hittades inte." };
    }

    if (poll.uid !== user.id) {
        return { success: false, message: "Endast skaparen kan redigera omröstningen." };
    }

    if (poll.finished) {
        return { success: false, message: "Kan inte redigera en avslutad omröstning." };
    }

    // Uppdatera frågan
    poll.question = newQuestion;
    
    // Uppdatera inställningar om de skickades
    if (singleChoice !== undefined) {
        poll.singleChoice = singleChoice;
    }
    if (timeLimit !== undefined) {
        poll.timeLimit = timeLimit;
        // Uppdatera eller ta bort expiresAt baserat på ny tidsgräns
        if (timeLimit > 0) {
            poll.expiresAt = new Date(Date.now() + timeLimit * 60000);
        } else {
            poll.expiresAt = undefined;
        }
    }

    // Hantera alternativ - behåll röster för oförändrade alternativ
    const updatedVotes: IVoteOption[] = [];
    
    newOptions.forEach((newOpt, newIndex) => {
        // Kolla om detta alternativ fanns innan
        const oldIndex = poll.options.findIndex(old => old === newOpt);
        if (oldIndex !== -1 && poll.votes[oldIndex]) {
            // Behåll röster
            updatedVotes.push(poll.votes[oldIndex]);
        } else {
            // Nytt alternativ utan röster
            updatedVotes.push({ quantity: 0, voters: [] });
        }
    });

    poll.options = newOptions;
    poll.votes = updatedVotes;
    
    // Räkna om totalVotes
    poll.totalVotes = updatedVotes.reduce((sum, v) => sum + v.quantity, 0);

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
                    createPollBlocks(block, poll, true);
                    updater.setBlocks(block);
                    
                    await modify.getUpdater().finish(updater);
                }
            } catch (e) {
                // Ignorera fel
            }
        }
    }

    return { success: true };
}
