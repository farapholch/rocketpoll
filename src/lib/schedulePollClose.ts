import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IPoll } from "../definition";

export async function schedulePollClose(
    modify: IModify,
    poll: IPoll
): Promise<void> {
    if (!poll.timeLimit || poll.timeLimit <= 0) {
        return;
    }

    const when = new Date(Date.now() + poll.timeLimit * 60 * 1000);

    await modify.getScheduler().scheduleOnce({
        id: "poll-close-" + poll.msgId,
        when,
        data: {
            msgId: poll.msgId,
            roomId: poll.roomId,
        },
    });
}
