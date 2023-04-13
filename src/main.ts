import { EffectChangeData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData.js";
import {
    ReactionChangeValue,
    ItemCallbackOptionsData,
    getDamageTypeForReaction,
    addReactionActivation,
    removeReactionActivation,
    itemReactionFilter
} from "./module/reactionActivation.js"

import { getDamageTypeNameAndIcon } from "./module/config.js"
import { Checks } from "./module/checks.js"
import { showSelectDamageButtonsDialog } from "./app/selectDamageButtonsDialog.js"
import { macros } from "./macros.js"

export let setDebugLevel = (debugText: string) => {
    debugEnabled = { "none": 0, "warn": 1, "debug": 2, "all": 3 }[debugText] || 0;
    // 0 = none, warnings = 1, debug = 2, all = 3
    if (debugEnabled >= 3) CONFIG.debug.hooks = true;
}

export var debugEnabled;
// 0 = none, warnings = 1, debug = 2, all = 3
export let debug = (...args) => { if (debugEnabled > 1) console.log("DEBUG: reaction-activation | ", ...args) };
export let log = (...args) => console.log("reaction-activation | ", ...args);
export let warn = (...args) => { if (debugEnabled > 0) console.warn("reaction-activation | ", ...args) };
export let error = (...args) => console.error("reaction-activation | ", ...args)
export let timelog = (...args) => warn("reaction-activation | ", Date.now(), ...args);

export const reaction_filter_midi_qol_effect: string = "flags.midi-qol.reactionHooks"
export const ReactionActivationItems = new Map<string, boolean>()

export function HookName(itemUuid: string): string {
    return `midi-qol.ReactionFilter.${itemUuid}`;
}

Hooks.once('init', function () {
    log('Initializing reaction-activation')
    Hooks.on("midi-qol.ReactionFilter", reactionFilter)
    Hooks.on("applyActiveEffect", applyActiveEffect)
});

Hooks.once('ready', function () {
    //@ts-ignore 
    globalThis.ReactionActivation = {
        debug,
        log,
        warn,
        error,
        timelog,
        addReactionActivation,
        removeReactionActivation,
        getDamageTypeForReaction,
        showSelectDamageButtonsDialog,
        getDamageTypeNameAndIcon,
        macros
    }
})

//@ts-ignore
function applyActiveEffect(actor: globalThis.dnd5e.documents.Actor5e, change: EffectChangeData) {
    if (change.key !== reaction_filter_midi_qol_effect) {
        return;
    }

    try {
        JSON.parse(change.value as string) as ReactionChangeValue
    } catch (error) {
        error(`flags.midi-qol.reactionHooks bad data ${change.value} ${error} on ${actor.name}`)
        return
    }

    //@ts-ignore
    addReactionActivation(change.effect.origin)
}

//@ts-ignore
function reactionFilter(reactions: globalThis.dnd5e.documents.Item5e[], options: ItemCallbackOptionsData) {
    for (let i = 0; i < reactions.length; i++) {
        const item = reactions[i];
        const itemUuid = item.uuid

        if (ReactionActivationItems.has(itemUuid)) {
            if (itemReactionFilter(item, options) === false) {
                log(`removed reaction for ${itemUuid}`,)
                reactions.splice(i, 1);
            }
        }
    }
}
