import { absorbElements } from "./macros/absorbElements.js"

//@ts-ignore
export type FunctionArgsActor = globalThis.dnd5e.documents.Actor5e
//@ts-ignore
export type FunctionArgsTokenDocument = globalThis.dnd5e.documents.TokenDocument5e
//@ts-ignore
export type FunctionArgsItem = globalThis.dnd5e.documents.Item5e

export type FunctionArgs = {
    speaker,
    //@ts-ignore dnd5e v10
    actor: FunctionArgsActor,
    //@ts-ignore dnd5e v10
    token: FunctionArgsTokenDocument,
    character,
    //@ts-ignore dnd5e v10
    item: FunctionArgsItem,
    args
}

export let macros = {
     "absorbElements": absorbElements
}
