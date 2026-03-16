import {
    IPersistence,
} from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IPoll } from "../definition";

export async function storePoll(
    persistence: IPersistence,
    poll: IPoll
): Promise<void> {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        "poll_" + poll.id
    );
    await persistence.updateByAssociation(association, poll, true);
}
