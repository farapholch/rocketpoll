import {
    IModify,
} from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IRoom } from "@rocket.chat/apps-engine/definition/rooms";
import {
    TextObjectType,
} from "@rocket.chat/apps-engine/definition/uikit";

export async function createPollModal(
    modify: IModify,
    user: IUser,
    room: IRoom,
    triggerId: string
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

    // Alternativ 1 och 2 (obligatoriska)
    block.addInputBlock({
        blockId: "poll_option_1",
        label: block.newPlainTextObject("Alternativ 1"),
        element: block.newPlainTextInputElement({
            actionId: "option_1",
            placeholder: block.newPlainTextObject("Första alternativet"),
        }),
    });

    block.addInputBlock({
        blockId: "poll_option_2",
        label: block.newPlainTextObject("Alternativ 2"),
        element: block.newPlainTextInputElement({
            actionId: "option_2",
            placeholder: block.newPlainTextObject("Andra alternativet"),
        }),
    });

    // Alternativ 3-5 (valfria)
    for (let i = 3; i <= 5; i++) {
        block.addInputBlock({
            blockId: "poll_option_" + i,
            optional: true,
            label: block.newPlainTextObject("Alternativ " + i + " (valfritt)"),
            element: block.newPlainTextInputElement({
                actionId: "option_" + i,
                placeholder: block.newPlainTextObject("Ytterligare alternativ"),
            }),
        });
    }

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

    // Anonymitet
    block.addInputBlock({
        blockId: "poll_confidential",
        label: block.newPlainTextObject("Anonymitet"),
        element: block.newStaticSelectElement({
            actionId: "confidential",
            placeholder: block.newPlainTextObject("Välj anonymitet"),
            initialValue: "open",
            options: [
                {
                    text: block.newPlainTextObject("Öppen (visa namn)"),
                    value: "open",
                },
                {
                    text: block.newPlainTextObject("Anonym (dölj namn)"),
                    value: "anonymous",
                },
            ],
        }),
    });

    // Visa resultat
    block.addInputBlock({
        blockId: "poll_show_results",
        label: block.newPlainTextObject("Visa resultat"),
        element: block.newStaticSelectElement({
            actionId: "show_results",
            placeholder: block.newPlainTextObject("När ska resultat visas?"),
            initialValue: "always",
            options: [
                {
                    text: block.newPlainTextObject("Alltid"),
                    value: "always",
                },
                {
                    text: block.newPlainTextObject("Efter avslut"),
                    value: "after",
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
            id: "create_poll_modal",
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
