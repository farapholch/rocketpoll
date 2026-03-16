import { BlockBuilder } from "@rocket.chat/apps-engine/definition/uikit";
import { IPoll } from "../definition";

function buildVoteGraph(votes: number, totalVotes: number): string {
    const percent = totalVotes === 0 ? 0 : votes / totalVotes;
    const percentText = (percent * 100).toFixed(0);
    
    // Färgad progress bar med gröna och vita block
    const width = 10;
    const filled = Math.round(percent * width);
    const bar = "🟩".repeat(filled) + "⬜".repeat(width - filled);
    
    return bar + "  " + percentText + "%";
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
    // Header
    block.addSectionBlock({
        text: block.newMarkdownTextObject("📊  **" + poll.question + "**"),
    });

    // Info-rad
    const infoItems: string[] = [];
    infoItems.push(poll.singleChoice ? "Enkel röst" : "Flerval");
    if (poll.confidential) {
        infoItems.push("Anonym");
    }
    if (poll.finished) {
        infoItems.push("Avslutad ✓");
    } else if (poll.expiresAt) {
        const expiresDate = new Date(poll.expiresAt);
        infoItems.push("Stänger " + expiresDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }));
    }
    
    block.addContextBlock({
        elements: [
            block.newMarkdownTextObject(infoItems.join(" · ")),
        ],
    });

    block.addDividerBlock();

    const shouldShowResults = poll.showResults || poll.finished;

    // Alternativ
    poll.options.forEach((option, index) => {
        const voteData = poll.votes[index];
        const votes = voteData?.quantity || 0;
        
        // Markera vinnare
        let prefix = "";
        if (poll.finished && poll.totalVotes > 0) {
            const maxVotes = Math.max(...poll.votes.map(v => v.quantity));
            if (votes === maxVotes && votes > 0) {
                prefix = "🏆 ";
            }
        }
        
        let optionText = prefix + "**" + option + "**";
        
        if (shouldShowResults) {
            optionText += "\n" + buildVoteGraph(votes, poll.totalVotes) + " (" + votes + ")";
            optionText += buildVotersList(voteData?.voters || [], poll.confidential);
        }

        if (showVoteButtons && !poll.finished) {
            block.addSectionBlock({
                text: block.newMarkdownTextObject(optionText),
                accessory: block.newButtonElement({
                    text: block.newPlainTextObject("Rösta"),
                    actionId: "vote_" + index,
                    value: poll.id + "|" + index,
                }),
            });
        } else {
            block.addSectionBlock({
                text: block.newMarkdownTextObject(optionText),
            });
        }
    });

    block.addDividerBlock();

    // Footer med person-emoji
    block.addContextBlock({
        elements: [
            block.newMarkdownTextObject(
                poll.totalVotes + " röster · 👤 @" + poll.username
            ),
        ],
    });

    // Knappar
    if (showVoteButtons) {
        if (!poll.finished) {
            block.addActionsBlock({
                elements: [
                    block.newButtonElement({
                        text: block.newPlainTextObject("Avsluta omröstning"),
                        actionId: "finish_poll",
                        value: poll.id,
                    }),
                ],
            });
        } else {
            block.addActionsBlock({
                elements: [
                    block.newButtonElement({
                        text: block.newPlainTextObject("Öppna igen"),
                        actionId: "reopen_poll",
                        value: poll.id,
                    }),
                ],
            });
        }
    }
}
