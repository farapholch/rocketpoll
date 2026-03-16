import { IProcessor, IJobContext } from "@rocket.chat/apps-engine/definition/scheduler";
import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { finishPoll } from "../lib/finishPoll";

export class PollTimeoutProcessor implements IProcessor {
    public id: string = "poll-timeout";

    constructor(private readonly app: any) {}

    public async processor(
        jobContext: IJobContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const { pollId } = jobContext as { pollId: string; roomId: string };

        if (!pollId) {
            this.app.getLogger().error("PollTimeoutProcessor: Missing pollId");
            return;
        }

        const result = await finishPoll(read, modify, persis, pollId);
        
        if (!result.success) {
            this.app.getLogger().warn("PollTimeoutProcessor: " + result.message);
        } else {
            this.app.getLogger().info("PollTimeoutProcessor: Poll " + pollId + " closed by timeout");
        }
    }
}
