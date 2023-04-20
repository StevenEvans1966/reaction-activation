
import { EffectChangeData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData.js"
import { Actor5e } from "./globalTypes"
import { macros } from "./macros.js"
import { activeEffectsReg } from "./effectReg.js"
import { reactionActivation, reactionFilter } from "./module/reactionActivation.js"

import { getDamageTypeNameAndIcon } from "./module/config.js"
import { showSelectDamageButtonsDialog } from "./app/selectDamageButtonsDialog.js"
import { fetchParams, registerSettings } from "./settings.js"

export let setDebugLevel = (debugText: string) => {
    debugEnabled = { "none": 0, "warn": 1, "debug": 2, "all": 3 }[debugText] || 0;
    // 0 = none, warnings = 1, debug = 2, all = 3
    if (debugEnabled >= 3) CONFIG.debug.hooks = true;
}

export var debugEnabled;
// 0 = none, warnings = 1, debug = 2, all = 3
export let debug = (...args) => { if (debugEnabled > 1) console.log("DEBUG: steven-premades | ", ...args) };
export let log = (...args) => console.log("steven-premades | ", ...args);
export let warn = (...args) => { if (debugEnabled > 0) console.warn("steven-premades | ", ...args) };
export let error = (...args) => console.error("steven-premades | ", ...args)
export let timelog = (...args) => warn("steven-premades | ", Date.now(), ...args);

//@ts-ignore
export let bannerError = (error: string) => globalThis.ui.notifications.error(error)

Hooks.once('init', function () {
    log('Initializing steven-premades')
    Hooks.on("midi-qol.ReactionFilter", reactionFilter)
    Hooks.on("applyActiveEffect", applyActiveEffect)
    registerSettings();
    fetchParams();
});

Hooks.once('ready', function () {
    //@ts-ignore 
    globalThis.stevenPremades = {
        debug,
        log,
        warn,
        error,
        timelog,
        showSelectDamageButtonsDialog,
        getDamageTypeNameAndIcon,
        macros,
        reactionActivation,
    }
})

function applyActiveEffect(actor: Actor5e, change: EffectChangeData) {
    let applyActiveEffect = activeEffectsReg.get(change.key)

    if (applyActiveEffect) {
        applyActiveEffect(actor, change)
    }
}