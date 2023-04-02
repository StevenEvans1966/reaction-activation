import { error, log } from "../main.js";
import { Checks } from "./checks.js";
import { showSelectDamageButtonsDialog } from "../app/selectDamageButtonsDialog.js";
import { getDamageTypeNameAndIcon } from "./config.js";
function checkName(name) {
	return name;
}
function scope() {
	return checkName("midi-qol");
}
function key() {
	return checkName("reactionActivationData");
}
const changingItem = new Set();
function addDamageTypes(checkData, reactionActivateData, item) {
	//remove duplicates
	const newTriggeringDamageTypes = Array.from(new Set(checkData.damageTypes));
	const newValue = JSON.stringify(newTriggeringDamageTypes);
	let replace;
	try {
		const oldValue = JSON.stringify(reactionActivateData.triggeringDamageTypes);
		replace = oldValue != newValue;
	}
	catch (error) {
		replace = true;
	}
	if (replace) {
		reactionActivateData.triggeringDamageTypes = newTriggeringDamageTypes;
		console.info(`${item.uuid} reacts on damage types ${reactionActivateData.triggeringDamageTypes.join(", ")}`);
		return true;
	}
	return false;
}
function cleanUpHooksAndAdd(reactionActivateData, itemUuid) {
	const hookName = `midi-qol.ReactionFilter.${itemUuid}`;
	//@ts-ignore
	let hooks = Hooks.events[hookName];
	let hooksArr = (hooks ? Array.from(hooks) : []);
	let rtn = false;
	if (reactionActivateData.hookId === -1 || hooksArr.length === 0) {
		reactionActivateData.hookId = Hooks.on(hookName, itemReactionFilterCallback);
		return true;
	}
	let removed = false;
	for (const entry of hooksArr) {
		if (entry.id !== reactionActivateData.hookId) {
			Hooks.off(hookName, entry.id);
			removed = true;
		}
	}
	if (removed) {
		//@ts-ignore
		hooks = Hooks.events[hookName];
		hooksArr = (hooks ? Array.from(hooks) : []);
		if (hooksArr.length === 0) {
			reactionActivateData.hookId = Hooks.on(hookName, itemReactionFilterCallback);
			rtn = true;
		}
	}
	return rtn;
}
async function itemReactionFilterCallback(item, options) {
	const reactionActivateData = getReactionActivation(item);
	const itemUuid = item.uuid;
	const workflowOptions = options.workflowOptions;
	let checks = workflowOptions.reactionChecks?.[itemUuid] ?? new Checks(itemUuid);
	const triggeringDamageTypes = reactionActivateData.triggeringDamageTypes;
	if (triggeringDamageTypes) {
		checks.checkDamageType(workflowOptions, triggeringDamageTypes);
	}
}
export function getReactionActivation(item) {
	return item.getFlag(scope(), key());
}
export async function addReactionActivation(itemUuid, checkData) {
	if (changingItem.has(itemUuid)) {
		return;
	}
	let item = (await fromUuid(itemUuid));
	let reactionActivateData = getReactionActivation(item) ?? { hookId: -1 };
	let change = false;
	change = cleanUpHooksAndAdd(reactionActivateData, itemUuid) || change;
	if (checkData?.damageTypes) {
		change = addDamageTypes(checkData, reactionActivateData, item) || change;
	}
	changingItem.add(itemUuid);
	try {
		if (change) {
			await item.setFlag(scope(), key(), reactionActivateData);
		}
	}
	finally {
		changingItem.delete(itemUuid);
	}
}
export async function removeReactionActivation(itemUuid) {
	let item = await fromUuid(itemUuid);
	const reactionActivateData = getReactionActivation(item);
	if (reactionActivateData?.hookId) {
		Hooks.off(`midi-qol.ReactionFilter.${itemUuid}`, reactionActivateData.hookId);
	}
	await item.unsetFlag(scope(), key());
}
export async function getDamageTypeForReaction(workflowOptions, item) {
	const results = workflowOptions.reactionChecks;
	if (!results) {
		const damageTypes = item.flags["midi-qol"]?.reactionActivationData?.damageTypes;
		if (!damageTypes) {
			error("no damage types set");
			return;
		}
		return await showSelectDamageButtonsDialog(damageTypes, damageTypes[0], "Unable to determine damage type. You are on your own");
	}
	const uuid = item.uuid;
	const result = results.get(uuid);
	if (!result) {
		error(`no check results for item ${uuid}`);
		return;
	}
	const damageCheck = result.damageTypeCheck;
	if (!damageCheck) {
		error(`no damage check results for item ${uuid}`);
		return;
	}
	const reactingTo = damageCheck.reactingTo;
	const defaultValue = reactingTo[0].type;
	if (reactingTo.length === 1) {
		log(`auto selecting damage as ${defaultValue}`);
		return { damageType: defaultValue, nameAndIcon: getDamageTypeNameAndIcon(defaultValue) };
	}
	const flavor = `Recommend selection <b>${defaultValue}</b> Damage ${reactingTo.map((dd) => `${dd.damage}[${dd.type}]`).join(", ")}`;
	const damageType = await showSelectDamageButtonsDialog(reactingTo.map((damageDetail) => damageDetail.type), defaultValue, flavor);
	if (!damageType) {
		error("no damage type selected");
		return;
	}
	return damageType;
}
