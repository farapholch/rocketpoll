import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { getPoll } from "./getPoll";
import { storePoll } from "./storePoll";
import { createPollBlocks } from "./createPollBlocks";

export async function reopenPoll(
    read: IRead,
    modify: IModify,
    persistence: IPersistence,
    pollId: string,
    user: IUser
): Promise<{ success: boolean; message?: string }> {
    const poll = await getPoll(read.getPersistenceReader(), pollId);
    
    if (!poll) {
        return { success: false, message: "Omröstningen hittades inte." };
    }

    if (!poll.finished) {
        return { success: false, message: "Omröstningen är inte avslutad." };
    }

    if (poll.uid !== user.id) {
        return { success: false, message: "Endast skaparen kan öppna omröstningen igen." };
    }

    poll.finished = false;
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
