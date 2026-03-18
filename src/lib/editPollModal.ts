import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPoll } from "../definition";

export async function editPollModal(
    modify: IModify,
    user: IUser,
    poll: IPoll,
    triggerId: string,
    optionCount?: number
): Promise<void> {
    const block = modify.getCreator().getBlockBuilder();
    
    // Antal alternativ att visa (minst antal befintliga, max 10)
    const numOptions = optionCount ?? poll.options.length;

    // Fråga (forifylld)
    block.addInputBlock({
        blockId: "edit_question",
        label: block.newPlainTextObject("Fråga"),
        element: block.newPlainTextInputElement({
            actionId: "question",
            initialValue: poll.question,
            placeholder: block.newPlainTextObject("Vad vill du fråga?"),
        }),
    });

    // Alternativ (dynamiskt antal)
    for (let i = 0; i < numOptions; i++) {
        const isRequired = i < 2;
        block.addInputBlock({
            blockId: "edit_option_" + i,
            optional: !isRequired,
            label: block.newPlainTextObject("Alternativ " + (i + 1)),
            element: block.newPlainTextInputElement({
                actionId: "option_" + i,
                initialValue: poll.options[i] || "",
                placeholder: block.newPlainTextObject(i < 2 ? (i === 0 ? "Första alternativet" : "Andra alternativet") : "Ytterligare alternativ"),
            }),
        });
    }

    // Knappar for att lagga till/ta bort alternativ
    const actionButtons: any[] = [];
    
    if (numOptions < 10) {
        actionButtons.push(
            block.newButtonElement({
                actionId: "edit_add_option",
                text: block.newPlainTextObject("+ Lägg till"),
                value: poll.id + "|" + (numOptions + 1),
            })
        );
    }
    
    // Kan bara ta bort om vi har fler an befintliga OCH fler an 2
    if (numOptions > poll.options.length && numOptions > 2) {
        actionButtons.push(
            block.newButtonElement({
                actionId: "edit_remove_option",
                text: block.newPlainTextObject("- Ta bort"),
                value: poll.id + "|" + (numOptions - 1),
            })
        );
    }
    
    if (actionButtons.length > 0) {
        block.addActionsBlock({
            blockId: "edit_option_buttons_block",
            elements: actionButtons,
        });
    }

    // Divider
    block.addDividerBlock();

    // Röstningstyp
    block.addInputBlock({
        blockId: "edit_poll_type",
        label: block.newPlainTextObject("Röstningstyp"),
        element: block.newStaticSelectElement({
            actionId: "vote_type",
            placeholder: block.newPlainTextObject("Välj typ"),
            initialValue: poll.singleChoice ? "single" : "multiple",
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
        blockId: "edit_poll_time_limit",
        label: block.newPlainTextObject("Tidsgräns"),
        element: block.newStaticSelectElement({
            actionId: "time_limit",
            placeholder: block.newPlainTextObject("Välj tidsgräns"),
            initialValue: String(poll.timeLimit || 0),
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
            id: "edit_poll_modal---" + poll.id + "---" + numOptions,
            title: block.newPlainTextObject("Redigera omröstning"),
            close: block.newButtonElement({
                text: block.newPlainTextObject("Avbryt"),
            }),
            submit: block.newButtonElement({
                text: block.newPlainTextObject("Spara"),
            }),
            blocks: block.getBlocks(),
        },
        { triggerId },
        user
    );
}
