import { BlockBuilder, TextObjectType } from "@rocket.chat/apps-engine/definition/uikit";
import { IPoll } from "../definition";

const FILLED = "█";
const EMPTY = "░";
const WIDTH = 15;

function buildVoteGraph(votes: number, totalVotes: number): string {
    const percent = totalVotes === 0 ? 0 : votes / totalVotes;
    const filledCount = Math.round(percent * WIDTH);
    const bar = FILLED.repeat(filledCount) + EMPTY.repeat(WIDTH - filledCount);
    return "`" + bar + "` " + (percent * 100).toFixed(1) + "% (" + votes + ")";
}

function buildVotersList(voters: { name: string }[], confidential: boolean): string {
    if (confidential || voters.length === 0) {
        return "";
    }
    const names = voters.map((v) => v.name).join(", ");
    return "\n_" + names + "_";
}

export function createPollBlocks(
    block: BlockBuilder,
    poll: IPoll,
    showVoteButtons: boolean = true
): void {
    // Header med fråga
    block.addSectionBlock({
        text: block.newMarkdownTextObject("📊 **" + poll.question + "**"),
    });

    // Info-rad
    const infoItems: string[] = [];
    infoItems.push(poll.singleChoice ? "Enkel röst" : "Flerval");
    if (poll.confidential) {
        infoItems.push("🔒 Anonym");
    }
    if (poll.finished) {
        infoItems.push("✅ Avslutad");
    } else if (poll.expiresAt) {
        const expiresDate = new Date(poll.expiresAt);
        infoItems.push("⏱️ Stänger " + expiresDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }));
    }
    
    block.addContextBlock({
        elements: [
            block.newMarkdownTextObject(infoItems.join(" • ")),
        ],
    });

    block.addDividerBlock();

    // Visa resultat eller inte baserat på inställningar
    const shouldShowResults = poll.showResults || poll.finished;

    // Alternativ med progress bars
    poll.options.forEach((option, index) => {
        const voteData = poll.votes[index];
        const votes = voteData?.quantity || 0;
        
        let optionText = "**" + option + "**";
        
        if (shouldShowResults) {
            optionText += "\n" + buildVoteGraph(votes, poll.totalVotes);
            optionText += buildVotersList(voteData?.voters || [], poll.confidential);
        }

        block.addSectionBlock({
            text: block.newMarkdownTextObject(optionText),
        });

        if (showVoteButtons && !poll.finished) {
            block.addActionsBlock({
                elements: [
                    block.newButtonElement({
                        text: block.newPlainTextObject("Rösta", true),
                        actionId: "vote_" + index,
                        value: poll.msgId + "_" + index,
                    }),
                ],
            });
        }
    });

    block.addDividerBlock();

    // Footer med totalt antal röster
    const footerText = "Totalt: " + poll.totalVotes + " röst" + (poll.totalVotes === 1 ? "" : "er") + " • Skapad av @" + poll.username;
    
    block.addContextBlock({
        elements: [
            block.newMarkdownTextObject(footerText),
        ],
    });

    // Avsluta-knapp om inte redan avslutad
    if (!poll.finished && showVoteButtons) {
        block.addActionsBlock({
            elements: [
                block.newButtonElement({
                    text: block.newPlainTextObject("Avsluta omröstning", true),
                    actionId: "finish_poll",
                    value: poll.msgId,
                }),
            ],
        });
    }
}
