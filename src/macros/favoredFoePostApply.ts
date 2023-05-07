import { DamageBonusReturn, FunctionArg } from "../macro.js";
import { ActiveEffect5e, Actor5e, Item5e, TokenDocument5e } from "../globalTypes.js"
import { debug, error, log } from "../main.js";
import { EffectDurationDataConstructorData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectDurationData.js";
import { EffectChangeData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/effectChangeData.js";
import { ActiveEffectDataConstructorData } from "@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/data/data.mjs/activeEffectData.js";

interface LastHit {
    targetUuid: string
    damageType: string
    isCritical: boolean
    attackItemImg: string
    itemCardId: string
}

export async function favoredFoePostApplyDamageBonus({ speaker, actor, token, character, item, args }: FunctionArg): Promise<DamageBonusReturn> {
    debug("favoredFoeDamageBonus", actor, item, args)

    const hitTargetsUuids: string[] = args[0].hitTargetUuids;
    if (hitTargetsUuids.length === 0) return {}

    //has hits
    try {
        const isCritical = args[0].isCritical
        const targetUuid = hitTargetsUuids[0]

        const onUpdateTarget = actor.flags?.dae?.onUpdateTarget;

        if (onUpdateTarget) {
            const isMarked = onUpdateTarget.find(flag => flag.flagName === "Favored Foe" && flag.sourceTokenUuid === targetUuid);

            if (isMarked) {
                return await createBonusDamage(actor, targetUuid, item.system.damage.parts[0][1], isCritical, item.img);
            }
        }

        if (!(actor.items.find((t: Item5e) => t.name === "Favored Foe").system.uses.value)) return {};

        let lastHitData: LastHit = {
            targetUuid,
            damageType: item.system.damage.parts[0][1],
            isCritical: isCritical,
            attackItemImg: item.img,
            itemCardId: args[0].itemCardId,
        }

        await AddLastHit(actor, lastHitData)
        return {};
    }
    catch (error) {
        error(error);
        return {};
    }
}

export async function favoredFoePostApplyPreItemRoll({ speaker, actor, token, character, item, args }: FunctionArg): Promise<boolean> {
    debug("favoredFoeOnUse", args)
    const attackingActor = args[0].actor;

    let lastHitData: LastHit = getProperty(attackingActor.flags, "midi-qol.sreLastHit")

    if (!lastHitData) {
        error("no last hit")
        return false
    }

    //@ts-ignore
    let target: TokenDocument5e = await game.user.targets.some((t: TokenDocument5e) => IsTarget(t, lastHitData.targetUuid));
    if (target) return true

    //@ts-ignore
    target = await canvas.tokens.placeables.find((t: TokenDocument5e) => IsTarget(t, lastHitData.targetUuid))
    if (!target) {
        error("target of lastHit not in scene")
        return false;
    }

    await target.setTarget(true, { releaseOthers: true })
    log("targeting last hit target")
    return true;
}

export async function favoredFoePostApplyOnUse({ speaker, actor, token, character, item, args }: FunctionArg) {
    debug("favoredFoeOnUse", actor, item, args, token)

    try {
        let lastHit: LastHit = getProperty(actor.flags, "midi-qol.sreLastHit")

        if (!lastHit) {
            error("no last hit")
            return
        }

        await globalThis.MidiQOL.addConcentration(actor, { item, targets: [{ uuid: lastHit.targetUuid }] })

        await rollDamageOnFavoredFoeUsed(lastHit, actor, token);
        await removeLastHitEffect(actor);
    }
    catch (error) {
        error(error);
    }
}

function IsTarget(t: TokenDocument5e, targetUuid: string): boolean {
    return t.actor.uuid === targetUuid;
}

async function rollDamageOnFavoredFoeUsed(lastHit: LastHit, actor: Actor5e, token: TokenDocument5e) {
    const damageRtn = await createBonusDamage(actor, lastHit.targetUuid, lastHit.damageType, lastHit.isCritical, lastHit.attackItemImg)
    if (!damageRtn.damageRoll) return
    const roll = await (new Roll(damageRtn.damageRoll).evaluate({ async: true,  }));
    //@ts-ignore
    game.dice3d?.showForRoll(roll)
    const options = { flavor: damageRtn.flavor, itemCardId: lastHit.itemCardId, isCritical: lastHit.isCritical };
    const targets = [await fromUuid(lastHit.targetUuid)];

    await new globalThis.MidiQOL.DamageOnlyWorkflow(actor,
        token,
        roll.total,
        lastHit.damageType,
        targets,
        roll,
        options);
}

async function createBonusDamage(actor: Actor5e, targetUuid: string, damageType: string, isCritical: boolean, attackItemImg: string): Promise<DamageBonusReturn> {
    if (targetUuid == getProperty(actor.flags, "midi-qol.favoredFoeHit")) {
        log("Favored Foe used this turn on target");
        return {};
    }

    AddFavoredFoeHit(actor, targetUuid, attackItemImg);

    const diceMult = isCritical ? 2 : 1;
    const faces = actor.classes.ranger.scaleValues["favored-foe"].faces;
    const damageRoll = `${diceMult}d${faces}[${damageType}]`
    return { damageRoll, flavor: "Favored Foe" };
}

async function AddLastHit(actor: Actor5e, lastHitData: LastHit): Promise<void> {
    let activeEffect: ActiveEffect5e = findLastHitEffect(actor)

    if (!activeEffect) {
        let duration: EffectDurationDataConstructorData = { startRound: 0, startTurn: 0, rounds: 1, turns: 0 }

        let lastHitEffectData: ActiveEffectDataConstructorData = {
            changes: [{
                key: "flags.midi-qol.sreLastHit",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                priority: 20,
                value: JSON.stringify(lastHitData)
            }] as EffectChangeData[],
            origin: actor.uuid,
            disabled: false,
            icon: lastHitData.attackItemImg,
            label: "Last Hit",
            duration
        }

        setProperty(lastHitEffectData, "flags.dae.specialDuration", ["turnEnd", "combatEnd"]);
        activeEffect = await actor.createEmbeddedDocuments("ActiveEffect", [lastHitEffectData]);
    }
    else {
        const oldChanges = activeEffect.changes
        let changes: EffectChangeData[] = await duplicate(oldChanges)
        changes[0].value = JSON.stringify(lastHitData)
        await activeEffect.update({ changes })
    }
}

async function removeLastHitEffect(actor: Actor5e): Promise<void> {
    let lastHitEffect = findLastHitEffect(actor)
    if (!lastHitEffect) return;
    await actor.deleteEmbeddedDocuments("ActiveEffect", [lastHitEffect.id]);
}

function findLastHitEffect(actor: Actor5e): ActiveEffect5e {
    return actor.effects.find((t: ActiveEffect5e) => t.label === "Last Hit");
}

async function AddFavoredFoeHit(actor: Actor5e, targetUuid: string, attackItemImg: string): Promise<void> {
    const favoredFoeHitData = {
        changes: [
            {
                key: "flags.midi-qol.favoredFoeHit",
                mode: CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
                value: targetUuid,
                priority: 20
            }
        ],
        origin: actor.uuid,
        disabled: false,
        icon: attackItemImg,
        label: "Favored Foe Hit",
    };

    setProperty(favoredFoeHitData, "flags.dae.specialDuration", ["turnStartSource", "combatEnd"]);
    await actor.createEmbeddedDocuments("ActiveEffect", [favoredFoeHitData]);
}