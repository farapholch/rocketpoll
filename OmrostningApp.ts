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
import { getPoll } from "./src/lib/getPoll";
import { IPollCreateData } from "./src/definition";

export class OmrostningApp extends App {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors) {
        super(info, logger, accessors);
    }

    public async initialize(
        configurationExtend: IConfigurationExtend,
        environmentRead: IEnvironmentRead
    ): Promise<void> {
        // Registrera slash commands
        await configurationExtend.slashCommands.provideSlashCommand(
            new OmrostningCommand()
        );
        await configurationExtend.slashCommands.provideSlashCommand(
            new RostCommand()
        );

        // Registrera scheduler processor
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

        if (data.view.id !== "create_poll_modal") {
            return { success: true };
        }

        const user = data.user;
        
        // Hämta roomId från modal state
        const viewState = data.view.state as Record<string, any>;
        const roomId = viewState?.roomId || (data.room?.id);

        if (!roomId) {
            this.getLogger().error("No roomId found in state or data.room");
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: { question: "Kunde inte hitta rummet. Försök igen." },
            });
        }

        const state = data.view.state as Record<string, Record<string, string>>;

        // Extrahera fråga
        const question = state?.poll_question?.question?.trim();
        if (!question) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: { question: "Du måste ange en fråga." },
            });
        }

        // Extrahera alternativ
        const options: string[] = [];
        for (let i = 1; i <= 10; i++) {
            const option = state?.["poll_option_" + i]?.["option_" + i]?.trim();
            if (option) {
                options.push(option);
            }
        }

        if (options.length < 2) {
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: { option_1: "Du måste ange minst 2 alternativ." },
            });
        }

        // Extrahera inställningar
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

        // Hämta rummet från roomId
        const room = await read.getRoomReader().getById(roomId);
        if (!room) {
            this.getLogger().error("Room not found: " + roomId);
            return context.getInteractionResponder().viewErrorResponse({
                viewId: data.view.id,
                errors: { question: "Kunde inte hitta rummet." },
            });
        }

        const msgId = await createPollMessage(
            modify,
            persistence,
            room,
            user,
            pollData
        );

        // Schemalägg stängning om tidsgräns
        if (pollData.timeLimit && pollData.timeLimit > 0) {
            const poll = await getPoll(read.getPersistenceReader(), msgId);
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

        // Hantera röstning
        if (actionId.startsWith("vote_")) {
            const value = data.value || "";
            const parts = value.split("_");
            if (parts.length >= 2) {
                const msgId = parts[0];
                const voteIndex = parseInt(parts[1], 10);

                const result = await votePoll(
                    read,
                    modify,
                    persistence,
                    msgId,
                    voteIndex,
                    user
                );

                if (!result.success) {
                    this.getLogger().warn("Vote failed: " + result.message);
                }
            }
        }

        // Hantera avsluta omröstning
        if (actionId === "finish_poll") {
            const msgId = data.value || "";
            
            const result = await finishPoll(
                read,
                modify,
                persistence,
                msgId,
                user
            );

            if (!result.success) {
                this.getLogger().warn("Finish poll failed: " + result.message);
            }
        }

        return { success: true };
    }
}
