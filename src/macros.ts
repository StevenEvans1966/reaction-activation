import { Macro } from "./macro"
import { absorbElements } from "./macros/absorbElements.js"
import { favoredFoePostApplyPreItemRoll, favoredFoePostApplyDamageBonus, favoredFoePostApplyOnUse } from "./macros/favoredFoePostApply.js";

type MacroGroup = {
    [key: string]: Macro;
}

export let macros: MacroGroup = {
    "absorbElements": absorbElements,
    "favoredFoePreItemRoll": favoredFoePostApplyPreItemRoll,
    "favoredFoeOnUse": favoredFoePostApplyOnUse,
    "favoredFoeDamageBonus": favoredFoePostApplyDamageBonus
}
