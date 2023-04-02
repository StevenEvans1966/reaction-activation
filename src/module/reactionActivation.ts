import { error, log } from "../main.js";
import { Checks } from "./checks.js";
import { showSelectDamageButtonsDialog, DialogRtn } from "../app/selectDamageButtonsDialog.js";
import { getDamageTypeNameAndIcon } from "./config.js";
export type itemCallbackOptionsData = { workflowOptions: WorkflowOptions };

export type reactionHooksData = undefined | { damageTypes: string[] };
export type DamageDetail = { type: string; damage: number };

type ReactionActivationFlags = {
    hookId: number;
    triggeringDamageTypes?: string[];
};

export type WorkflowOptions = {
    damageDetail: DamageDetail[];
    reactionChecks?: Map<string, Checks>;
};

type flags = { flags: reactionActivationFlagScope };
type reactionActivationFlagScope = { "midi-qol"?: reactionActivationFlagsKey };
type reactionActivationFlagsKey = { reactionActivationData?: ReactionActivationFlags };

function checkName<T>(name: keyof T) {
    return name;
}

function scope(): string {
    return checkName<reactionActivationFlagScope>("midi-qol");
}

function key(): string {
    return checkName<reactionActivationFlagsKey>("reactionActivationData");
}

const changingItem: Set<string> = new Set<string>();

function addDamageTypes(checkData: { damageTypes: string[] }, reactionActivateData: ReactionActivationFlags, item: Item,) {
    //remove duplicates
    const newTriggeringDamageTypes = Array.from(new Set<string>(checkData.damageTypes));
    const newValue = JSON.stringify(newTriggeringDamageTypes);

    let replace: boolean;

    try {
        const oldValue = JSON.stringify(reactionActivateData.triggeringDamageTypes);
        replace = oldValue != newValue;
    } catch (error) {
        replace = true;
    }

    if (replace) {
        reactionActivateData.triggeringDamageTypes = newTriggeringDamageTypes;
        console.info(`${item.uuid} reacts on damage types ${reactionActivateData.triggeringDamageTypes.join(", ")}`);
        return true;
    }

    return false;
}

function cleanUpHooksAndAdd(reactionActivateData: ReactionActivationFlags, itemUuid: string): boolean {
    const hookName = `midi-qol.ReactionFilter.${itemUuid}`;

    //@ts-ignore
    let hooks = Hooks.events[hookName];
    let hooksArr = (hooks ? Array.from(hooks) : []) as { id: number }[];
    let rtn: boolean = false;

    if (reactionActivateData.hookId === -1 || hooksArr.length === 0) {
        reactionActivateData.hookId = Hooks.on(hookName, itemReactionFilterCallback);
        return true;
    }
    let removed = false;

    for (const entry of hooksArr) {
        if (entry.id !== reactionActivateData.hookId) {
            Hooks.off(hookName, entry.id);
            removed = true;
        }
    }

    if (removed) {
        //@ts-ignore
        hooks = Hooks.events[hookName];
        hooksArr = (hooks ? Array.from(hooks) : []) as { id: number }[];

        if (hooksArr.length === 0) {
            reactionActivateData.hookId = Hooks.on(hookName, itemReactionFilterCallback);
            rtn = true;
        }
    }

    return rtn;
}

async function itemReactionFilterCallback(item: Item, options: itemCallbackOptionsData) {
    const reactionActivateData = getReactionActivation(item);
    const itemUuid: string = item.uuid;
    const workflowOptions = options.workflowOptions;
    let checks: Checks = workflowOptions.reactionChecks?.[itemUuid] ?? new Checks(itemUuid);

    const triggeringDamageTypes = reactionActivateData.triggeringDamageTypes;

    if (triggeringDamageTypes) {
        checks.checkDamageType(workflowOptions, triggeringDamageTypes);
    }
}

export function getReactionActivation(item: Item): ReactionActivationFlags {
    return item.getFlag(scope(), key()) as ReactionActivationFlags;
}

export async function addReactionActivation(itemUuid: string, checkData: reactionHooksData) {
    if (changingItem.has(itemUuid)) {
        return;
    }

    let item = (await fromUuid(itemUuid)) as Item;
    let reactionActivateData: ReactionActivationFlags = getReactionActivation(item) ?? { hookId: -1 };
    let change = false;

    change = cleanUpHooksAndAdd(reactionActivateData, itemUuid) || change;

    if (checkData?.damageTypes) {
        change = addDamageTypes(checkData, reactionActivateData, item) || change;
    }

    changingItem.add(itemUuid);

    try {
        if (change) {
            await item.setFlag(scope(), key(), reactionActivateData);
        }
    } finally {
        changingItem.delete(itemUuid);
    }
}

export async function removeReactionActivation(itemUuid: string) {
    let item: any | { unsetFlag: (scope: string, key: string) => void } = await fromUuid(itemUuid);
    const reactionActivateData = getReactionActivation(item);

    if (reactionActivateData?.hookId) {
        Hooks.off(`midi-qol.ReactionFilter.${itemUuid}`, reactionActivateData.hookId);
    }

    await item.unsetFlag(scope(), key());
}
type ObjectItem = { flags: flags; uuid: string }

export async function getDamageTypeForReaction(workflowOptions: WorkflowOptions, item: ObjectItem): Promise<DialogRtn | undefined> {
    const results = workflowOptions.reactionChecks;

    if (!results) {
        const damageTypes = item.flags["midi-qol"]?.reactionActivationData?.damageTypes;

        if (!damageTypes) {
            error("no damage types set");
            return;
        }

        return await showSelectDamageButtonsDialog(damageTypes, damageTypes[0], "Unable to determine damage type. You are on your own")
    }

    const uuid = item.uuid;
    const result = results.get(uuid);

    if (!result) {
        error(`no check results for item ${uuid}`);
        return;
    }

    const damageCheck = result.damageTypeCheck;

    if (!damageCheck) {
        error(`no damage check results for item ${uuid}`);
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
