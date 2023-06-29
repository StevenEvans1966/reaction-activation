import { EffectChangeData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData"
import { Actor5e } from "../globalTypes"
import { Register } from "../effectReg.js"
import { addReactionActivation } from "../module/reactionActivation.js";

export const  REACTION_FILTER_NAME : string = "flags.midi-qol.reactionFilter"

export type ReactionFilterValue = { damageTypes: string[] };

Register(REACTION_FILTER_NAME, applyActiveEffect)

function applyActiveEffect(actor: Actor5e, change: EffectChangeData) {
    try {   
        JSON.parse(change.value as string) as ReactionFilterValue
    } catch (error) {
        error(`${REACTION_FILTER_NAME} bad data ${change.value} ${error} on ${actor.name}`)
        return
    }
 
    //@ts-ignore
    addReactionActivation(change.effect.origin)
}