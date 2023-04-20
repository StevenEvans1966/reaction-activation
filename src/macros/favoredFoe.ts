import { DamageBonusReturn, FunctionArg } from "../macro.js";
import { Actor5e, Item5e, TokenDocument5e } from "../globalTypes.js"
import { debug } from "../main.js";

export async function favoredFoeOnUse({ speaker, actor, token, character, item, args }: FunctionArg) {
    debug("favoredFoeOnUse", speaker, actor, token, character, item, args)
    let tactor : Actor5e = token.actor ?? actor
    await apply(item, tactor, args[0].targets)
}

export async function favoredFoeDamageBonus({ speaker, actor, token, character, item, args }: FunctionArg): Promise<DamageBonusReturn> {
    debug("favoredFoeDamageBonus", speaker, actor, token, character, item, args)

    let tactor : Actor5e = token.actor ?? actor
    
    const hitTargetsUuids: string[] = args[0].hitTargetUuids;
    let isMarked = false;

    if (tactor.flags?.dae?.onUpdateTarget && hitTargetsUuids.length > 0) {
        isMarked = tactor.flags.dae.onUpdateTarget.find(flag =>
            flag.flagName === "Favored Foe" && flag.sourceTokenUuid === hitTargetsUuids[0]);
    }

    if (!isMarked && hitTargetsUuids.length > 0) {
        let ffItem = tactor.items.getName("Favored Foe");

        if (ffItem.system.uses.value > 0) {
            const buttonData = {
                buttons: [
                    { label: "Yes", value: true },
                    { label: "No", value: false }],
                title: `Use Favored Foe on ${args[0].hitTargets[0].name}`
            };

            //@ts-ignore
            const choice = await warpgate.buttonDialog(buttonData);

            if (choice === true) {
                await ffItem.roll();
                isMarked = true
            }
        }
    }

    if (isMarked) {
        return await marked(tactor, item, hitTargetsUuids[0], args[0].isCritical)
    }

    return {}
}

async function apply(item: Item5e, tactor: Actor5e, targets: TokenDocument5e): Promise<void> {
    globalThis.MidiQOL.addConcentration(tactor, { item: item, targets: targets });
}

async function marked(actor: Actor5e, item: Item5e, targetUuid: string, isCritical: boolean): Promise<DamageBonusReturn> {
    if (targetUuid == getProperty(actor.flags, "midi-qol.favoredFoeHit")) {
        debug("Favored Foe used this turn");
        return {};
    }

    Hooks.once("midi-qol.DamageRollComplete", async () => {
        const favoredFoeHitData = {
            changes: [
                {
                    key: "flags.midi-qol.favoredFoeHit",
                    mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                    value: targetUuid,
                    priority: 20
                }
            ],
            origin: actor.Uuid,
            disabled: false,
            icon: item.img,
            label: "Favored Foe Hit",
        };

        setProperty(favoredFoeHitData, "flags.dae.specialDuration", ["turnStartSource"]);
        await actor.createEmbeddedDocuments("ActiveEffect", [favoredFoeHitData]);
    })

    const damageType = item.system.damage.parts[0][1];
    const diceMult = isCritical ? 2 : 1;
    const faces = actor.classes.ranger.scaleValues["favored-foe"].faces;
    const damageRoll = `${diceMult}d${faces}[${damageType}]`
    return { damageRoll, flavor: "Favored Foe" };
}
