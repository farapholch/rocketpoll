import {
    IModify,
    IPersistence,
    IRead,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPoll } from "../definition";
import { getPoll } from "./getPoll";
import { storePoll } from "./storePoll";
import { createPollBlocks } from "./createPollBlocks";

export async function finishPoll(
    read: IRead,
    modify: IModify,
    persistence: IPersistence,
    msgId: string,
    user?: IUser
): Promise<{ success: boolean; message?: string }> {
    const poll = await getPoll(read.getPersistenceReader(), msgId);
    
    if (!poll) {
        return { success: false, message: "Omröstningen hittades inte." };
    }

    if (poll.finished) {
        return { success: false, message: "Omröstningen är redan avslutad." };
    }

    // Endast skaparen kan avsluta (om user anges)
    if (user && poll.uid !== user.id) {
        return { success: false, message: "Endast skaparen kan avsluta omröstningen." };
    }

    // Markera som avslutad
    poll.finished = true;

    // Spara
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
    createPollBlocks(block, poll, false);
    builder.setBlocks(block);

    await modify.getUpdater().finish(builder);
}
