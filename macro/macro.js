const version = "1.0.0.0";

console.log("Absorb Elements:", args)
const lastArg = args[args.length - 1];
try {
    if (args[0] === "off") {
        await ReactionActivation.removeReactionActivation(lastArg.origin)
        return;
    }
} catch (err) {
    console.error(`Absorb Elements Off ${version}`, err);
}

try {
    if (args[0].tag === "OnUse" && args[0].macroPass === "postActiveEffects") {
        let tactor = (args[0].tokenUuid) ? (await fromUuid(args[0].tokenUuid)).actor : game.actors.get(args[0].actorId);
        let item = args[0].item

        let dialogRtn = await ReactionActivation.getDamageTypeForReaction(args[0].workflowOptions, item)

        const chatMessage = game.messages.get(args[0].itemCardId);
        var content = duplicate(chatMessage.content);
        content = content.substring(0, content.length - 6)
        content += `<div class="card-header flexrow">
        <img src="${dialogRtn.nameAndIcon.img}" width="34" height="34" style="border:0px;vertical-align: bottom;"/>
        <h3>Absorbed ${dialogRtn.nameAndIcon.name}</h3>
        </div></div>`
        chatMessage.update({ content: content })

        const itemName = item.name;
        const damageType = dialogRtn.damageType
        let effect = tactor.effects.find(i => i.label === itemName);
        let changes = duplicate(effect.changes);
        changes[0].value = `${args[0].spellLevel}d6[${damageType}]`;
        changes[1].value = `${args[0].spellLevel}d6[${damageType}]`;
        await effect.update({ changes });
        effect = tactor.effects.find(i => i.label === `${itemName} Resistance`);
        changes = duplicate(effect.changes);
        changes[0].value = damageType;
        await effect.update({ changes });
    }
} catch (err) {
    console.error(`Absorb Elements OnUse ${version}`, err);
}
