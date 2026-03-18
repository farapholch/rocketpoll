import {
    IAppAccessors,
    IConfigurationExtend,
    IEnvironmentRead,
    ILogger,
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { App } from "@rocket.chat/apps-engine/definition/App";
import { IAppInfo } from "@rocket.chat/apps-engine/definition/metadata";
import {
    IUIKitResponse,
    UIKitBlockInteractionContext,
    UIKitViewSubmitInteractionContext,
} from "@rocket.chat/apps-engine/definition/uikit";
import { OmrostningCommand, RostCommand } from "./src/commands/OmrostningCommand";
import { PollTimeoutProcessor } from "./src/processors/PollTimeoutProcessor";
import { createPollMessage } from "./src/lib/createPollMessage";
import { schedulePollClose } from "./src/lib/schedulePollClose";
import { votePoll } from "./src/lib/votePoll";
import { finishPoll } from "./src/lib/finishPoll";
import { reopenPoll } from "./src/lib/reopenPoll";
import { getPoll } from "./src/lib/getPoll";
import { editPollModal } from "./src/lib/editPollModal";
import { clearVote } from "./src/lib/clearVote";
import { updatePoll } from "./src/lib/updatePoll";
import { IPollCreateData } from "./src/definition";

export class OmrostningApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(
        configurationExtend: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        await configurationExtend.slashCommands.provideSlashCommand(
            new OmrostningCommand()
        );
        await configurationExtend.slashCommands.provideSlashCommand(
            new RostCommand()
        );

        await configurationExtend.scheduler.registerProcessors([
            new PollTimeoutProcessor(this),
        ]);
    }

    public async executeViewSubmitHandler(
        context: UIKitViewSubmitInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const viewId = data.view.id;
        const user = data.user;
        const state = data.view.state as Record<string, Record<string, string>>;

        // Hantera redigering av poll
        if (viewId.startsWith("edit_poll_modal---")) {
            const pollId = viewId.replace("edit_poll_modal---", "");
            
            const newQuestion = state?.edit_question?.question?.trim();
            if (!newQuestion) {
                return context.getInteractionResponder().viewErrorResponse({
                    viewId,
                    errors: { question: "Du måste ange en fråga." },
                });
            }

            const newOptions: string[] = [];
            for (let i = 0; i < 10; i++) {
                const opt = state?.["edit_option_" + i]?.["option_" + i]?.trim();
                if (opt) {
                    newOptions.push(opt);
                }
            }

            if (newOptions.length < 2) {
                return context.getInteractionResponder().viewErrorResponse({
                    viewId,
                    errors: { option_0: "Du måste ha minst 2 alternativ." },
                });
            }

            await updatePoll(read, modify, persistence, pollId, newQuestion, newOptions, user);
            return { success: true };
        }

        // Hantera skapande av ny poll
        if (!viewId.startsWith("create_poll_modal---")) {
            return { success: true };
        }

        const roomId = viewId.replace("create_poll_modal---", "");

        if (!roomId) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: viewId,
                errors: { question: "Kunde inte hitta rummet." },
            });
        }

        const question = state?.poll_question?.question?.trim();
        if (!question) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: viewId,
                errors: { question: "Du måste ange en fråga." },
            });
        }

        const options: string[] = [];
        for (let i = 1; i <= 10; i++) {
            const option = state?.["poll_option_" + i]?.["option_" + i]?.trim();
            if (option) {
                options.push(option);
            }
        }

        if (options.length < 2) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: viewId,
                errors: { option_1: "Du måste ange minst 2 alternativ." },
            });
        }

        const voteType = state?.poll_type?.vote_type || "single";
        const confidential = state?.poll_confidential?.confidential || "open";
        const showResults = state?.poll_show_results?.show_results || "always";
        const timeLimit = parseInt(state?.poll_time_limit?.time_limit || "0", 10);

        const pollData: IPollCreateData = {
            question,
            options,
            singleChoice: voteType === "single",
            confidential: confidential === "anonymous",
            showResults: showResults === "always",
            timeLimit: timeLimit > 0 ? timeLimit : undefined,
        };

        const room = await read.getRoomReader().getById(roomId);
        if (!room) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: viewId,
                errors: { question: "Kunde inte hitta rummet." },
            });
        }

        const pollId = await createPollMessage(
            modify,
            persistence,
            room,
            user,
            pollData
        );

        if (pollData.timeLimit && pollData.timeLimit > 0) {
            const poll = await getPoll(read.getPersistenceReader(), pollId);
            if (poll) {
                await schedulePollClose(modify, poll);
            }
        }

        return { success: true };
    }

    public async executeBlockActionHandler(
        context: UIKitBlockInteractionContext,
        read: IRead,
        http: IHttp,
        persistence: IPersistence,
        modify: IModify
    ): Promise<IUIKitResponse> {
        const data = context.getInteractionData();
        const actionId = data.actionId;
        const user = data.user;
        const triggerId = data.triggerId;

        if (actionId.startsWith("vote_")) {
            const value = data.value || "";
            const parts = value.split("|");
            if (parts.length === 2) {
                const pollId = parts[0];
                const voteIndex = parseInt(parts[1], 10);
                await votePoll(read, modify, persistence, pollId, voteIndex, user);
            }
        }

        if (actionId === "clear_vote") {
            const pollId = data.value || "";
            await clearVote(read, modify, persistence, pollId, user);
        }

        if (actionId === "edit_poll") {
            const pollId = data.value || "";
            const poll = await getPoll(read.getPersistenceReader(), pollId);
            
            if (poll && poll.uid === user.id && !poll.finished && triggerId) {
                await editPollModal(modify, user, poll, triggerId);
            }
        }

        if (actionId === "finish_poll") {
            const pollId = data.value || "";
            await finishPoll(read, modify, persistence, pollId, user);
        }

        if (actionId === "reopen_poll") {
            const pollId = data.value || "";
            await reopenPoll(read, modify, persistence, pollId, user);
        }

        return { success: true };
    }
}
