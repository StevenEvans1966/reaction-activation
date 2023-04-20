import { EffectChangeData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData"
import { Actor5e } from "../globalTypes"
import { Register, getItem } from "../effectReg.js"
import { addReactionActivation } from "../module/reactionActivation.js";

export const reaction_filter_effect: string = "flags.midi-qol.reactionFilter"

export type ReactionFilterValue = { damageTypes: string[] };

Register(reaction_filter_effect, applyActiveEffect)

function applyActiveEffect(actor: Actor5e, change: EffectChangeData) {
    try {   
        JSON.parse(change.value as string) as ReactionFilterValue
    } catch (error) {
        error(`${reaction_filter_effect} bad data ${change.value} ${error} on ${actor.name}`)
        return
    }
 
    addReactionActivation(getItem(change).Uuid)
}