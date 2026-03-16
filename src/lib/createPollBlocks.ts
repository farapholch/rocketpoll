import { BlockBuilder } from "@rocket.chat/apps-engine/definition/uikit";
import { IPoll } from "../definition";

function buildVoteGraph(votes: number, totalVotes: number): string {
    const percent = totalVotes === 0 ? 0 : votes / totalVotes;
    const percentText = (percent * 100).toFixed(0);
    
    const width = 10;
    const filled = Math.round(percent * width);
    const bar = "🟩".repeat(filled) + "⬜".repeat(width - filled);
    
    return bar + " " + percentText + "%";
}

function buildVotersList(voters: { name: string }[], confidential: boolean): string {
    if (confidential || voters.length === 0) {
        return "";
    }
    const names = voters.map((v) => v.name).join(", ");
    return "\n_" + names + "_";
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
    block.addSectionBlock({
        text: block.newMarkdownTextObject("📊 **" + poll.question + "**"),
    });

    // Info-rad
    const infoItems: string[] = [];
    if (poll.confidential) {
        infoItems.push("🔒 Anonym");
    }
    if (poll.finished) {
        infoItems.push("✅ Avslutad");
    } else if (poll.expiresAt) {
        const expiresDate = new Date(poll.expiresAt);
        infoItems.push("⏰ " + expiresDate.toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" }));
    }
    
    if (infoItems.length > 0) {
        block.addContextBlock({
            elements: [
                block.newMarkdownTextObject(infoItems.join(" · ")),
            ],
        });
    }

    block.addDividerBlock();

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

    // Alternativ med röst-knappar
    poll.options.forEach((option, index) => {
        const voteData = poll.votes[index];
        const votes = voteData?.quantity || 0;
        
        let prefix = "";
        if (poll.finished && poll.totalVotes > 0 && rankings[index] <= 3) {
            prefix = getRankEmoji(rankings[index]);
        }
        
        // Bygg alternativtext
        let optionText = prefix + "**" + option + "**";
        if (shouldShowResults) {
            optionText += "\n" + buildVoteGraph(votes, poll.totalVotes) + " (" + votes + ")";
            optionText += buildVotersList(voteData?.voters || [], poll.confidential);
        }
        
        block.addSectionBlock({
            text: block.newMarkdownTextObject(optionText),
        });
        
        // Rösta-knapp under varje alternativ (om inte avslutad)
        if (showVoteButtons && !poll.finished) {
            block.addActionsBlock({
                elements: [
                    block.newButtonElement({
                        text: block.newPlainTextObject("Rösta på " + option),
                        actionId: "vote_" + index,
                        value: poll.id + "|" + index,
                    }),
                ],
            });
        }
    });

    block.addDividerBlock();

    // Footer
    block.addContextBlock({
        elements: [
            block.newMarkdownTextObject(
                "📊 " + poll.totalVotes + " röster · 👤 @" + poll.username
            ),
        ],
    });

    // Avsluta/Öppna igen knapp
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
