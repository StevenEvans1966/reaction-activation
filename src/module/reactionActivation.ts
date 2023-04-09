import { EffectChangeData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData.js";

import { error, log, reaction_filter_midi_qol_effect as reaction_filter_midi_qol_change_name } from "../main.js";
import { Checks } from "./checks.js";
import { showSelectDamageButtonsDialog, DialogRtn } from "../app/selectDamageButtonsDialog.js";
import { getDamageTypeNameAndIcon } from "./config.js";

export interface ItemCallbackOptionsData { workflowOptions: WorkflowOptions };
export type ReactionChangeValue = { damageTypes: string[] };
export type DamageDetail = { type: string; damage: number };

export type WorkflowOptions = {
    damageDetail: DamageDetail[];
    reactionChecks?: Checks[];
};

const ReactionActivationHookIds = new Map<string, number>()

export async function addReactionActivation(itemUuid: string) {
    const hookName = `midi-qol.ReactionFilter.${itemUuid}`;

    //@ts-ignore
    let hooks = Hooks.events[hookName];
    let hooksArr = (hooks ? Array.from(hooks) : []) as { id: number }[];

    if (ReactionActivationHookIds.get(itemUuid) === -1 || hooksArr.length === 0) {
        addHook(itemUuid, hookName)
    }

    let removed = false;

    const currentHookId = ReactionActivationHookIds.get(itemUuid);

    for (const entry of hooksArr) {
        if (entry.id !== currentHookId) {
            Hooks.off(hookName, entry.id);
            removed = true;
        }
    }

    if (removed) {
        //@ts-ignore
        hooks = Hooks.events[hookName];
        hooksArr = (hooks ? Array.from(hooks) : []) as { id: number }[];

        if (hooksArr.length === 0) {
            addHook(itemUuid, hookName)
        }
    }
}

async function itemReactionFilterCallback(item: Item, options: ItemCallbackOptionsData) {
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

    const triggeringDamageTypes = getReactionActivationDamageTypes(item);
    checks.checkDamageType(workflowOptions, triggeringDamageTypes);
}

export async function removeReactionActivation(itemUuid: string) {
    const hookId = ReactionActivationHookIds.get(itemUuid);

    if (hookId) {
        Hooks.off(`midi-qol.ReactionFilter.${itemUuid}`, hookId);
        log(`removing reactionActivationHook for ${itemUuid}`)
    }
}

export async function getDamageTypeForReaction(workflowOptions: WorkflowOptions, item: Item): Promise<DialogRtn | undefined> {
    const results = workflowOptions.reactionChecks;

    if (!results) {
        const damageTypes = getReactionActivationDamageTypes(item);

        if (!damageTypes) {
            error("no damage types set");
            return;
        }

        return await showSelectDamageButtonsDialog(damageTypes, damageTypes[0], "Unable to determine damage type. You are on your own")
    }

    const itemUuid = item.uuid;
    const result = results.find(check=> check.itemUuid = itemUuid);

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

async function addHook(itemUuid: string, hookName: string): Promise<void> {
    ReactionActivationHookIds.set(itemUuid, Hooks.on(hookName, itemReactionFilterCallback));
    log(`adding reactionActivationHook for ${itemUuid}`)
}

export function getReactionActivationDamageTypes(item: Item): string[] {
    let change = find_reaction_filter_midi_qol_change(item)

    if (!change) {
        return []
    }

    const data = JSON.parse(change.value as string) as ReactionChangeValue;
    return data.damageTypes;
}

function find_reaction_filter_midi_qol_change(item: Item): EffectChangeData | undefined {
    for (const e of item.effects) {
        //@ts-ignore
        for (const c of e.changes) {
            if (c.key === reaction_filter_midi_qol_change_name) {
                return c;
            }
        }
    }

    error(`cant find ${reaction_filter_midi_qol_change_name}`)
    return undefined;
}
