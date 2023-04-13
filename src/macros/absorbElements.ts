import { FunctionArgs, FunctionArgsActor } from "../macros";
import { log, error } from "../main.js";
import { getDamageTypeForReaction } from "../module/reactionActivation.js"

export async function absorbElements({ speaker, actor, token, character, item, args }: FunctionArgs) {
    const version = "1.0.3";
    log({ speaker, actor, token, character, item, args })

    try {
        let tactor: FunctionArgsActor = token?.actor ?? actor;

        let dialogRtn = await getDamageTypeForReaction(args[0].workflowOptions, item)

        if (!dialogRtn) {
            error("no dialogRtn");
            return;
        }

        //@ts-ignore
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

    } catch (err) {
        console.error(`Absorb Elements OnUse ${version}`, err);
    }
}