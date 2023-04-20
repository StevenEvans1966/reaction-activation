import { EffectChangeData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData";
import { Actor5e, Item5e } from "./globalTypes";

export type onApplyActiveEffect = (actor: Actor5e, change: EffectChangeData) => void;

export let activeEffectsReg  = new Map<string, onApplyActiveEffect>();

export function Register(key:string, func:onApplyActiveEffect) : void
{
    activeEffectsReg.set(key, func)
}

export function getItem(change: EffectChangeData) : Item5e
{
    //@ts-ignore
    return change.effect.origin
}

