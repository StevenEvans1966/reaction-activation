import { EffectChangeData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData.js";
import { Item5e } from "../globalTypes.js";
import { error, log } from "../main.js";
import { Checks } from "./checks.js";
import { showSelectDamageButtonsDialog, DialogRtn } from "../app/selectDamageButtonsDialog.js";
import { getDamageTypeNameAndIcon } from "./config.js";
import { ReactionFilterValue, REACTION_FILTER_NAME } from "../effects/reactionFilterEffect.js";

export interface ItemCallbackOptionsData { workflowOptions: WorkflowOptions };
export type DamageDetail = { type: string; damage: number };

export type WorkflowOptions = {
    damageDetail: DamageDetail[];
    reactionChecks?: Checks[];
}

export const ReactionActivationItems = new Map<string, boolean>()

export let reactionActivation =
{
    addReactionActivation,
    removeReactionActivation,
    getDamageTypeForReaction,
}

export function addReactionActivation(itemUuid: string): void {
    if (!ReactionActivationItems.has(itemUuid)) {
        ReactionActivationItems.set(itemUuid, true);
        log(`added reaction activation for ${itemUuid}`)
    }
}

export function removeReactionActivation(itemUuid: string): void {
    ReactionActivationItems.delete(itemUuid);
    log(`removed reaction activation for ${itemUuid}`)
}

//@ts-ignore
export function reactionFilter(reactions: Item5e[], options: ItemCallbackOptionsData) {
    for (let i = 0; i < reactions.length; i++) {
        const item = reactions[i];
        const itemUuid = item.uuid

        if (ReactionActivationItems.has(itemUuid)) {
            if (itemReactionFilter(item, options) === false) {
                log(`removed reaction for ${itemUuid}`)
                reactions.splice(i, 1);
            }
        }
    }
}

export function itemReactionFilter(item: Item5e, options: ItemCallbackOptionsData): boolean {
    const itemUuid: string = item.uuid;
    const workflowOptions = options.workflowOptions;

    if (!workflowOptions.reactionChecks) {
        workflowOptions.reactionChecks = [];
    }

    let checks: Checks | undefined = workflowOptions.reactionChecks?.find(check => check.itemUuid = itemUuid);

    if (!checks) {
        checks = new Checks(itemUuid)
        workflowOptions.reactionChecks?.push(checks)
    }

    const triggeringDamageTypes = getReactionActivationDamageTypes({ item });
    checks.checkDamageType(workflowOptions, triggeringDamageTypes);

    return checks.reacting;
}

export async function getDamageTypeForReaction(workflowOptions: WorkflowOptions, item: Item5e): Promise<DialogRtn | undefined> {
    const results = workflowOptions.reactionChecks;

    if (!results) {
        const damageTypes = getReactionActivationDamageTypes({ item });

        if (!damageTypes) {
            error("no damage types set");
            return;
        }

        return await showSelectDamageButtonsDialog(damageTypes, damageTypes[0], "Unable to determine damage type. You are on your own")
    }

    const itemUuid = item.uuid;
    const result = results.find(check => check.itemUuid = itemUuid);

    if (!result) {
        error(`no check results for item ${itemUuid}`);
        return;
    }

    const damageCheck = result.damageTypeCheck;

    if (!damageCheck) {
        error(`no damage check results for item ${itemUuid}`);
        return;
    }

    const reactingTo = damageCheck.reactingTo;
    const defaultValue = reactingTo[0].type;

    if (reactingTo.length === 1) {
        log(`auto selecting damage as ${defaultValue}`);
        return { damageType: defaultValue, nameAndIcon: getDamageTypeNameAndIcon(defaultValue) };
    }

    const flavor = `Recommend selection <b>${defaultValue}</b> Damage ${reactingTo.map((dd) => `${dd.damage}[${dd.type}]`).join(", ")}`;
    const damageType = await showSelectDamageButtonsDialog(reactingTo.map((damageDetail) => damageDetail.type), defaultValue, flavor);

    if (!damageType) {
        error("no damage type selected");
        return;
    }

    return damageType;
}

export function getReactionActivationDamageTypes({ item }: { item: Item5e; }): string[] {
    let change = find_reaction_filter_midi_qol_change(item)

    if (!change) {
        return []
    }

    const data = JSON.parse(change.value as string) as ReactionFilterValue;
    return data.damageTypes;
}

function find_reaction_filter_midi_qol_change(item: Item5e): EffectChangeData | undefined {
    for (const e of item.effects) {
        //@ts-ignore
        for (var c of e.changes) {
            if (c.key === REACTION_FILTER_NAME) {
                return c;
            }
        }
    }

    error(`cant find ${REACTION_FILTER_NAME}`)
    return undefined;
}
