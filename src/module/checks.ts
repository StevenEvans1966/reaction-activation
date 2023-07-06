import { DamageDetail, WorkflowOptions } from "./reactionActivation.js";

export type DamageTypeCheck = {
  reactingTo: DamageDetail[];
};

export class Checks {
  itemUuid: string;
  reacting: boolean = false;
  damageTypeCheck?: DamageTypeCheck;

  constructor(itemUuid: string) {
    this.itemUuid = itemUuid;
  }

  static update(checks: Checks, update: Partial<Checks>, reacting: boolean) {
    Object.assign(checks, update);
    checks.reacting ||= reacting;
  }

  static checkDamageType(workflowOptions: WorkflowOptions, triggeringDamageTypes: string[]): { update: Partial<Checks>, reacting: boolean } {
    const damageDetails = workflowOptions.damageDetail;
    const triggeringDamageTypesSet = new Set(triggeringDamageTypes);

    let sumByType = new Map<string, number>();

    for (const damageDetail of damageDetails) {
      const damageType = damageDetail.type;

      if (sumByType.has(damageType)) {
        sumByType[damageType] += damageDetail.damage;
      }
      else {
        sumByType.set(damageType, damageDetail.damage)
      }
    };

    const mapAsArray = Array.from(sumByType);
    const reactingTo: DamageDetail[] = mapAsArray
      .map((t) => { return { type: t[0], damage: t[1] }; })
      .filter((t) => triggeringDamageTypesSet.has(t.type))
      .sort((a, b) => b.damage - a.damage);

    const damageTypeCheck: DamageTypeCheck = { reactingTo: reactingTo };
    const reacting = reactingTo.length > 0;
    const update: Partial<Checks> = { damageTypeCheck };
    return { update, reacting };
  }
}