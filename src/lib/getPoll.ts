import { IPersistenceRead } from "@rocket.chat/apps-engine/definition/accessors";
import {
    RocketChatAssociationModel,
    RocketChatAssociationRecord,
} from "@rocket.chat/apps-engine/definition/metadata";
import { IPoll } from "../definition";

export async function getPoll(
    persistenceRead: IPersistenceRead,
    pollId: string
): Promise<IPoll | undefined> {
    const association = new RocketChatAssociationRecord(
        RocketChatAssociationModel.MISC,
        "poll_" + pollId
    );
    const polls = await persistenceRead.readByAssociation(association);
    if (polls && polls.length > 0) {
        return polls[0] as IPoll;
    }
    return undefined;
}
