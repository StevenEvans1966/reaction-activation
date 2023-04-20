import { error } from "../main.js"

type IconData = { img: string }
export type NameAndIconData = { key: string, name: string | undefined, img: string | undefined }

type DamageTypeIconData = {
  [key: string]: IconData
}

export let damageTypeIcons: DamageTypeIconData = {
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

export function getUnknownDamageTypes(damagesToShow: string[]): string[] {
  let keys = Object.keys(damageTypeIcons);
  return damagesToShow.filter(t => !keys.includes(t))
}

export function getAllDamageTypeNameAndIcon(damageTypes: string[]): NameAndIconData[] {
  return damageTypes.map(damageType => getDamageTypeNameAndIcon(damageType))
}

export function getDamageTypeNameAndIcon(damageType: string): NameAndIconData {
  //@ts-ignore
  const name: string | undefined = CONFIG.DND5E.damageTypes[damageType]
  const img: string | undefined = damageTypeIcons[damageType].img

  if (!name) {
    error(`No damage name for ${damageType}`)
  }

  if (!img) {
    error(`No damage image for ${damageType}`)
  }

  return { key: damageType, name: name, img: img }
}

