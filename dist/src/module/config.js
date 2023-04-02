import { error } from "../main.js";
export function getUnknownDamageTypes(damagesToShow) {
	let keys = Object.keys(damageTypeIcons);
	return damagesToShow.filter(t => !keys.includes(t));
}
export let damageTypeIcons = {
	bludgeoning: { img: "icons/weapons/clubs/club-baton-brown.webp" },
	piercing: { img: "icons/weapons/swords/swords-sharp-worn.webp" },
	slashing: { img: "icons/skills/melee/strikes-sword-scimitar.webp" },
	acid: { img: "icons/magic/acid/dissolve-bone-white.webp" },
	cold: { img: "icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp" },
	fire: { img: "icons/magic/fire/barrier-wall-flame-ring-yellow.webp" },
	lightning: { img: "icons/magic/lightning/bolt-strike-blue.webp" },
	poison: { img: "icons/consumables/potions/bottle-conical-fumes-green.webp" },
	thunder: { img: "icons/magic/sonic/explosion-shock-wave-teal.webp" },
	force: { img: "icons/magic/control/energy-stream-link-large-white.webp" },
	necrotic: { img: "icons/magic/death/skull-energy-light-purple.webp" },
	psychic: { img: "icons/commodities/biological/organ-brain-pink-purple.webp" },
	radiant: { img: "icons/magic/holy/projectiles-blades-salvo-yellow.webp" },
};
export function getAllDamageTypeNameAndIcon(damageTypes) {
	return damageTypes.map(damageType => getDamageTypeNameAndIcon(damageType));
}
export function getDamageTypeNameAndIcon(damageType) {
	//@ts-ignore
	const name = CONFIG.DND5E.damageTypes[damageType];
	const img = damageTypeIcons[damageType].img;
	if (!name) {
		error(`No damage name for ${damageType}`);
	}
	if (!img) {
		error(`No damage image for ${damageType}`);
	}
	return { key: damageType, name: name, img: img };
}
