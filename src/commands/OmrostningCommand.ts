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

function parseArguments(argsArray: string[]): { question: string; options: string[] } | null {
    const args = argsArray.join(" ");
    
    if (!args || args.trim().length === 0) {
        return null;
    }
    
    // Normalisera citattecken
    let normalized = args
        .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
        .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035'']/g, "'");
    
    // Metod 1: Fråga med eller utan citat, alternativ med citat
    // Exempel: Vilket djur är bäst? "katt" "hund"
    // Exempel: "Vilket djur är bäst?" "katt" "hund"
    const firstQuoteIndex = normalized.indexOf('"');
    if (firstQuoteIndex >= 0) {
        // Hitta alla citerade strängar
        const quoteRegex = /"([^"]+)"/g;
        const allQuoted: string[] = [];
        let match;
        while ((match = quoteRegex.exec(normalized)) !== null) {
            allQuoted.push(match[1].trim());
        }
        
        if (firstQuoteIndex === 0) {
            // Frågan är också citerad - första är fragan, resten är alternativ
            if (allQuoted.length >= 3) {
                return {
                    question: allQuoted[0],
                    options: allQuoted.slice(1),
                };
            }
        } else {
            // Frågan är inte citerad - allt före första citatet är fragan
            const question = normalized.slice(0, firstQuoteIndex).trim();
            if (question.length > 0 && allQuoted.length >= 2) {
                return { question, options: allQuoted };
            }
        }
    }
    
    // Metod 2: Pipe-separator: Fråga? | Alt1 | Alt2
    if (normalized.includes("|")) {
        const parts = normalized.split("|").map(p => p.trim()).filter(p => p.length > 0);
        if (parts.length >= 3) {
            return {
                question: parts[0],
                options: parts.slice(1),
            };
        }
    }
    
    // Metod 3: Komma-separator efter frågetecken: Vad tycker du? Ja, Nej
    const qMatch = normalized.match(/^(.+\?)\s*(.+)$/);
    if (qMatch) {
        const question = qMatch[1].trim();
        const rest = qMatch[2].trim();
        const opts = rest.split(/,|\s+eller\s+/i).map(o => o.trim()).filter(o => o.length > 0);
        if (opts.length >= 2) {
            return { question, options: opts };
        }
    }
    
    return null;
}

export class OmrostningCommand implements ISlashCommand {
    public command: string = "omröstning";
    public i18nParamsExample: string = "Fråga? \"Alt1\" \"Alt2\"";
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
        const argsArray = context.getArguments();

        if (argsArray.length > 0) {
            const parsed = parseArguments(argsArray);
            
            if (parsed) {
                const pollData: IPollCreateData = {
                    question: parsed.question,
                    options: parsed.options,
                    singleChoice: true,
                    confidential: false,
                    showResults: true,
                    timeLimit: undefined,
                };

                await createPollMessage(modify, persis, room, user, pollData);
                return;
            } else {
                const msg = modify.getCreator().startMessage();
                msg.setRoom(room);
                msg.setSender(user);
                msg.setText(
                    "Kunde inte tolka argumenten.\n\n" +
                    "**Användning:**\n" +
                    "/omröstning Fråga? \"Alt1\" \"Alt2\"\n" +
                    "/omröstning \"Fråga?\" \"Alt1\" \"Alt2\"\n" +
                    "/omröstning Fråga? | Alt1 | Alt2\n" +
                    "\nEller skriv bara /omröstning for formulär"
                );
                await modify.getNotifier().notifyUser(user, msg.getMessage());
                return;
            }
        }

        if (triggerId) {
            await createPollModal(modify, user, room, triggerId);
        }
    }
}

export class RostCommand implements ISlashCommand {
    public command: string = "rost";
    public i18nParamsExample: string = "Fråga? \"Alt1\" \"Alt2\"";
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
        const argsArray = context.getArguments();

        if (argsArray.length > 0) {
            const parsed = parseArguments(argsArray);
            
            if (parsed) {
                const pollData: IPollCreateData = {
                    question: parsed.question,
                    options: parsed.options,
                    singleChoice: true,
                    confidential: false,
                    showResults: true,
                    timeLimit: undefined,
                };

                await createPollMessage(modify, persis, room, user, pollData);
                return;
            }
        }

        if (triggerId) {
            await createPollModal(modify, user, room, triggerId);
        }
    }
}

export class PollCommand implements ISlashCommand {
    public command: string = "poll";
    public i18nParamsExample: string = "Question? \"Option1\" \"Option2\"";
    public i18nDescription: string = "Create a poll";
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
        const argsArray = context.getArguments();

        if (argsArray.length > 0) {
            const parsed = parseArguments(argsArray);
            
            if (parsed) {
                const pollData: IPollCreateData = {
                    question: parsed.question,
                    options: parsed.options,
                    singleChoice: true,
                    confidential: false,
                    showResults: true,
                    timeLimit: undefined,
                };

                await createPollMessage(modify, persis, room, user, pollData);
                return;
            }
        }

        if (triggerId) {
            await createPollModal(modify, user, room, triggerId);
        }
    }
}
