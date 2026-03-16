import {
    ISlashCommand,
    SlashCommandContext,
} from "@rocket.chat/apps-engine/definition/slashcommands";
import {
    IRead,
    IModify,
    IHttp,
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import { createPollModal } from "../lib/createPollModal";
import { createPollMessage } from "../lib/createPollMessage";
import { IPollCreateData } from "../definition";

function parseArguments(args: string): { question: string; options: string[] } | null {
    // Parse: "Fråga?" "Alt1" "Alt2" "Alt3"
    const regex = /"([^"]+)"/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(args)) !== null) {
        matches.push(match[1]);
    }
    
    if (matches.length < 3) {
        return null;
    }
    
    return {
        question: matches[0],
        options: matches.slice(1),
    };
}

export class OmrostningCommand implements ISlashCommand {
    public command: string = "omrostning";
    public i18nParamsExample: string = "";
    public i18nDescription: string = "Skapa en omröstning";
    public providesPreview: boolean = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const triggerId = context.getTriggerId();
        const user = context.getSender();
        const room = context.getRoom();
        const args = context.getArguments().join(" ");

        // Om argument finns, skapa poll direkt
        const parsed = parseArguments(args);
        if (parsed) {
            const pollData: IPollCreateData = {
                question: parsed.question,
                options: parsed.options,
                singleChoice: true,
                confidential: false,
                showResults: true,
                timeLimit: undefined,
            };

            await createPollMessage(
                modify,
                persis,
                room,
                user,
                pollData
            );
            return;
        }

        // Annars öppna modal
        if (!triggerId) {
            const msg = modify.getCreator().startMessage();
            msg.setRoom(room);
            msg.setSender(user);
            msg.setText("Användning: /omrostning \"Fråga?\" \"Alternativ 1\" \"Alternativ 2\" [\"Alternativ 3\" ...]\nEller använd /omrostning utan argument för att öppna formuläret.");
            await modify.getNotifier().notifyUser(user, msg.getMessage());
            return;
        }

        await createPollModal(modify, user, room, triggerId);
    }
}

export class RostCommand implements ISlashCommand {
    public command: string = "rost";
    public i18nParamsExample: string = "";
    public i18nDescription: string = "Skapa en omröstning (alias för /omrostning)";
    public providesPreview: boolean = false;

    public async executor(
        context: SlashCommandContext,
        read: IRead,
        modify: IModify,
        http: IHttp,
        persis: IPersistence
    ): Promise<void> {
        const triggerId = context.getTriggerId();
        const user = context.getSender();
        const room = context.getRoom();
        const args = context.getArguments().join(" ");

        // Om argument finns, skapa poll direkt
        const parsed = parseArguments(args);
        if (parsed) {
            const pollData: IPollCreateData = {
                question: parsed.question,
                options: parsed.options,
                singleChoice: true,
                confidential: false,
                showResults: true,
                timeLimit: undefined,
            };

            await createPollMessage(
                modify,
                persis,
                room,
                user,
                pollData
            );
            return;
        }

        // Annars öppna modal
        if (!triggerId) {
            const msg = modify.getCreator().startMessage();
            msg.setRoom(room);
            msg.setSender(user);
            msg.setText("Användning: /rost \"Fråga?\" \"Alternativ 1\" \"Alternativ 2\" [\"Alternativ 3\" ...]");
            await modify.getNotifier().notifyUser(user, msg.getMessage());
            return;
        }

        await createPollModal(modify, user, room, triggerId);
    }
}
