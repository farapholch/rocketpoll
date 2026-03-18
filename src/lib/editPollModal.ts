import { IModify } from "@rocket.chat/apps-engine/definition/accessors";
import { IUser } from "@rocket.chat/apps-engine/definition/users";
import { IPoll } from "../definition";
import { t, Language } from "./i18n";

export async function editPollModal(
    modify: IModify,
    user: IUser,
    poll: IPoll,
    triggerId: string,
    optionCount?: number,
    lang: Language = "en"
): Promise<void> {
    const block = modify.getCreator().getBlockBuilder();
    
    const numOptions = optionCount ?? poll.options.length;

    // Fråga
    block.addInputBlock({
        blockId: "edit_question",
        label: block.newPlainTextObject(t("modal_question_label", lang)),
        element: block.newPlainTextInputElement({
            actionId: "question",
            initialValue: poll.question,
            placeholder: block.newPlainTextObject(t("modal_question_placeholder", lang)),
        }),
    });

    // Alternativ
    for (let i = 0; i < numOptions; i++) {
        const isRequired = i < 2;
        block.addInputBlock({
            blockId: "edit_option_" + i,
            optional: !isRequired,
            label: block.newPlainTextObject(t("modal_option_label", lang) + " " + (i + 1)),
            element: block.newPlainTextInputElement({
                actionId: "option_" + i,
                initialValue: poll.options[i] || "",
            }),
        });
    }

    // Knappar
    const actionButtons: any[] = [];
    
    if (numOptions < 10) {
        actionButtons.push(
            block.newButtonElement({
                actionId: "edit_add_option",
                text: block.newPlainTextObject(t("modal_add_option", lang)),
                value: poll.id + "|" + (numOptions + 1),
            })
        );
    }
    
    if (numOptions > poll.options.length && numOptions > 2) {
        actionButtons.push(
            block.newButtonElement({
                actionId: "edit_remove_option",
                text: block.newPlainTextObject(t("modal_remove_option", lang)),
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

    block.addDividerBlock();

    // Röstningstyp
    block.addInputBlock({
        blockId: "edit_poll_type",
        label: block.newPlainTextObject(t("modal_vote_type_label", lang)),
        element: block.newStaticSelectElement({
            actionId: "vote_type",
            initialValue: poll.singleChoice ? "single" : "multiple",
            options: [
                {
                    text: block.newPlainTextObject(t("modal_vote_type_single", lang)),
                    value: "single",
                },
                {
                    text: block.newPlainTextObject(t("modal_vote_type_multiple", lang)),
                    value: "multiple",
                },
            ],
        }),
    });

    // Tidsgräns
    const currentTimeLimit = poll.timeLimit ? String(poll.timeLimit) : "0";
    block.addInputBlock({
        blockId: "edit_poll_time_limit",
        label: block.newPlainTextObject(t("modal_time_limit_label", lang)),
        element: block.newStaticSelectElement({
            actionId: "time_limit",
            initialValue: currentTimeLimit,
            options: [
                { text: block.newPlainTextObject(t("modal_time_limit_none", lang)), value: "0" },
                { text: block.newPlainTextObject(t("time_5min", lang)), value: "5" },
                { text: block.newPlainTextObject(t("time_15min", lang)), value: "15" },
                { text: block.newPlainTextObject(t("time_30min", lang)), value: "30" },
                { text: block.newPlainTextObject(t("time_1h", lang)), value: "60" },
                { text: block.newPlainTextObject(t("time_2h", lang)), value: "120" },
                { text: block.newPlainTextObject(t("time_24h", lang)), value: "1440" },
            ],
        }),
    });

    await modify.getUiController().openModalView(
        {
            id: "edit_poll_modal---" + poll.id + "---" + numOptions,
            title: block.newPlainTextObject(t("edit_modal_title", lang)),
            close: block.newButtonElement({
                text: block.newPlainTextObject(t("button_cancel", lang)),
            }),
            submit: block.newButtonElement({
                text: block.newPlainTextObject(t("edit_modal_submit", lang)),
            }),
            blocks: block.getBlocks(),
        },
        { triggerId },
        user
    );
}
