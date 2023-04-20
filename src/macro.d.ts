export type FunctionArg = {
    speaker,
    //@ts-ignore dnd5e v10
    actor: Actor5e,
    //@ts-ignore dnd5e v10
    token: TokenDocument5e,
    character,
    //@ts-ignore dnd5e v10
    item: Item5e,
    args

}

export type DamageBonusReturn = { damageRoll?: string, flavor?: string}
export type Macro = (args: FunctionArg) => Promise<void | DamageBonusReturn | boolean>