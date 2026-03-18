import {
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";

export async function createPollModal(
    modify: IModify,
    user: IUser,
    room: IRoom,
    triggerId: string,
    optionCount: number = 2
): Promise<void> {
    const block = modify.getCreator().getBlockBuilder();

    // Fråga
    block.addInputBlock({
        blockId: "poll_question",
        label: block.newPlainTextObject("Fråga"),
        element: block.newPlainTextInputElement({
            actionId: "question",
            placeholder: block.newPlainTextObject("Vad vill du fråga?"),
        }),
    });

    // Alternativ (dynamiskt antal)
    const maxOptions = Math.min(optionCount, 10);
    for (let i = 1; i <= maxOptions; i++) {
        const isRequired = i <= 2;
        block.addInputBlock({
            blockId: "poll_option_" + i,
            optional: !isRequired,
            label: block.newPlainTextObject("Alternativ " + i),
            element: block.newPlainTextInputElement({
                actionId: "option_" + i,
                placeholder: block.newPlainTextObject(i <= 2 ? (i === 1 ? "Första alternativet" : "Andra alternativet") : "Ytterligare alternativ"),
            }),
        });
    }

    // Knappar for att lagga till/ta bort alternativ
    const actionButtons: any[] = [];
    
    if (optionCount < 10) {
        actionButtons.push(
            block.newButtonElement({
                actionId: "add_option",
                text: block.newPlainTextObject("+ Lägg till"),
                value: String(optionCount + 1),
            })
        );
    }
    
    if (optionCount > 2) {
        actionButtons.push(
            block.newButtonElement({
                actionId: "remove_option",
                text: block.newPlainTextObject("- Ta bort"),
                value: String(optionCount - 1),
            })
        );
    }
    
    if (actionButtons.length > 0) {
        block.addActionsBlock({
            blockId: "option_buttons_block",
            elements: actionButtons,
        });
    }

    // Divider
    block.addDividerBlock();

    // Röstningstyp
    block.addInputBlock({
        blockId: "poll_type",
        label: block.newPlainTextObject("Röstningstyp"),
        element: block.newStaticSelectElement({
            actionId: "vote_type",
            placeholder: block.newPlainTextObject("Välj typ"),
            initialValue: "single",
            options: [
                {
                    text: block.newPlainTextObject("Enkel röst (ett val)"),
                    value: "single",
                },
                {
                    text: block.newPlainTextObject("Flerval (flera val)"),
                    value: "multiple",
                },
            ],
        }),
    });

    // Tidsgräns
    block.addInputBlock({
        blockId: "poll_time_limit",
        label: block.newPlainTextObject("Tidsgräns"),
        element: block.newStaticSelectElement({
            actionId: "time_limit",
            placeholder: block.newPlainTextObject("Välj tidsgräns"),
            initialValue: "0",
            options: [
                { text: block.newPlainTextObject("Ingen"), value: "0" },
                { text: block.newPlainTextObject("5 minuter"), value: "5" },
                { text: block.newPlainTextObject("15 minuter"), value: "15" },
                { text: block.newPlainTextObject("30 minuter"), value: "30" },
                { text: block.newPlainTextObject("1 timme"), value: "60" },
                { text: block.newPlainTextObject("2 timmar"), value: "120" },
                { text: block.newPlainTextObject("24 timmar"), value: "1440" },
            ],
        }),
    });

    await modify.getUiController().openModalView(
        {
            id: "create_poll_modal---" + room.id + "---" + optionCount,
            title: block.newPlainTextObject("Skapa omröstning"),
            close: block.newButtonElement({
                text: block.newPlainTextObject("Avbryt"),
            }),
            submit: block.newButtonElement({
                text: block.newPlainTextObject("Skapa"),
            }),
            blocks: block.getBlocks(),
        },
        { triggerId },
        user
    );
}
