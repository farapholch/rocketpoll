import { BlockBuilder } from "@rocket.chat/apps-engine/definition/uikit";
import { IPoll } from "../definition";

function buildVoteBar(votes: number, totalVotes: number): string {
    const percent = totalVotes === 0 ? 0 : votes / totalVotes;
    const percentText = (percent * 100).toFixed(0);
    
    const width = 10;
    const filled = Math.round(percent * width);
    const bar = "🟩".repeat(filled) + "⬜".repeat(width - filled);
    
    return bar + " " + percentText + "%";
}

function getRankEmoji(rank: number): string {
    if (rank === 1) return "🥇 ";
    if (rank === 2) return "🥈 ";
    if (rank === 3) return "🥉 ";
    return "";
}

export function createPollBlocks(
    block: BlockBuilder,
    poll: IPoll,
    showVoteButtons: boolean = true
): void {
    // Header med frågan
    let headerText = "### " + poll.question;
    const metaItems: string[] = [];
    if (poll.finished) metaItems.push("✅");
    else if (poll.expiresAt) {
        const expiresDate = new Date(poll.expiresAt);
        metaItems.push("⏰ Stänger " + expiresDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Stockholm" }));
    }
    if (metaItems.length > 0) {
        headerText += "  " + metaItems.join(" ");
    }

    block.addSectionBlock({
        text: block.newMarkdownTextObject(headerText),
    });

    const shouldShowResults = poll.showResults || poll.finished;

    // Beräkna ranking för avslutade polls
    let rankings: number[] = [];
    if (poll.finished && poll.totalVotes > 0) {
        const sortedVotes = [...poll.votes.map(v => v.quantity)].sort((a, b) => b - a);
        rankings = poll.votes.map(v => {
            if (v.quantity === 0) return 99;
            return sortedVotes.indexOf(v.quantity) + 1;
        });
    }

    // Alla röstningsknappar på EN rad (endast om inte avslutad)
    if (showVoteButtons && !poll.finished) {
        const buttons = poll.options.map((option, index) => {
            return block.newButtonElement({
                text: block.newPlainTextObject(option),
                actionId: "vote_" + index,
                value: poll.id + "|" + index,
            });
        });
        
        block.addActionsBlock({
            elements: buttons,
        });
        
        // Linje endast efter knappar, innan resultat
        if (shouldShowResults && poll.totalVotes > 0) {
            block.addDividerBlock();
        }
    } else if (poll.finished) {
        // Avslutad - linje mellan fråga och resultat
        block.addDividerBlock();
    }

    // Visa resultat
    if (shouldShowResults && poll.totalVotes > 0) {
        let resultsText = "";
        poll.options.forEach((option, index) => {
            const voteData = poll.votes[index];
            const votes = voteData?.quantity || 0;
            
            let prefix = "";
            if (poll.finished && rankings[index] <= 3) {
                prefix = getRankEmoji(rankings[index]);
            }
            
            resultsText += prefix + "**" + option + "**  " + buildVoteBar(votes, poll.totalVotes) + " (" + votes + ")\n";
        });
        
        block.addSectionBlock({
            text: block.newMarkdownTextObject(resultsText.trim()),
        });
    } else if (poll.finished && poll.totalVotes === 0) {
        let resultsText = "";
        poll.options.forEach((option) => {
            resultsText += "**" + option + "**  " + buildVoteBar(0, 0) + " (0)\n";
        });
        block.addSectionBlock({
            text: block.newMarkdownTextObject(resultsText.trim()),
        });
    }

    // Footer
    block.addContextBlock({
        elements: [
            block.newMarkdownTextObject("Total: " + poll.totalVotes + " röster"),
        ],
    });

    // Kontrollknappar
    if (showVoteButtons) {
        const controlButtons = [];
        
        if (!poll.finished) {
            controlButtons.push(
                block.newButtonElement({
                    text: block.newPlainTextObject("🗑️ Ta bort röst"),
                    actionId: "clear_vote",
                    value: poll.id,
                })
            );
            
            controlButtons.push(
                block.newButtonElement({
                    text: block.newPlainTextObject("✏️ Redigera"),
                    actionId: "edit_poll",
                    value: poll.id,
                })
            );
            
            controlButtons.push(
                block.newButtonElement({
                    text: block.newPlainTextObject("Avsluta"),
                    actionId: "finish_poll",
                    value: poll.id,
                })
            );
        } else {
            controlButtons.push(
                block.newButtonElement({
                    text: block.newPlainTextObject("Öppna igen"),
                    actionId: "reopen_poll",
                    value: poll.id,
                })
            );
        }
        
        block.addActionsBlock({
            elements: controlButtons,
        });
    }
}
