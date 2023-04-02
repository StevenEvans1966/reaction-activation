export class Checks {
	constructor(itemUuid) {
		this.reacting = false;
		this.itemUuid = itemUuid;
	}
	update(update, reacting) {
		Object.assign(this, update);
		this.reacting || (this.reacting = reacting);
	}
	checkDamageType(workflowOptions, triggeringDamageTypes) {
		const damageDetails = workflowOptions.damageDetail;
		const triggeringDamageTypesSet = new Set(triggeringDamageTypes);
		let sumByType = new Map();
		for (const damageDetail of damageDetails) {
			const damageType = damageDetail.type;
			if (sumByType.has(damageType)) {
				sumByType[damageType] += damageDetail.damage;
			}
			else {
				sumByType.set(damageType, damageDetail.damage);
			}
		}
		;
		const mapAsArray = Array.from(sumByType);
		const reactingTo = mapAsArray
			.map((t) => { return { type: t[0], damage: t[1] }; })
			.filter((t) => triggeringDamageTypesSet.has(t.type))
			.sort((a, b) => b.damage - a.damage);
		const damageTypeCheck = { reactingTo: reactingTo };
		const reacting = reactingTo.length > 0;
		this.update({ damageTypeCheck: damageTypeCheck }, reacting);
		if (!workflowOptions.reactionChecks) {
			workflowOptions.reactionChecks = new Map();
		}
		workflowOptions.reactionChecks.set(this.itemUuid, this);
	}
}
