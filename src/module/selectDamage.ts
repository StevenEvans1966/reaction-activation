import { error } from "../main.js";
import { getUnknownDamageTypes, getDamageTypeNameAndIcon } from "./config.js"

function generateEnergyBox(type: string, defaultValue: string) {
  //@ts-ignore
  const data: NameAndIconData = getDamageTypeNameAndIcon(type)
  return `
<label class="radio-label">
<input type="radio" name="type" value="${type}" ${type === defaultValue ? 'checked' : ''}/>
<img src="${data.img}" style="border: 0px; width: 50px; height: 50px"}/>
${data.name}
</label>
`;
}

export async function showSelectDamage(damagesToShow: string[], defaultValue: string, flavor?: string | undefined): Promise<string | undefined> {

  if (!damagesToShow) {
    error("no damage types to show");
    return;
  }

  let unknownDamageTypes = getUnknownDamageTypes(damagesToShow)

  if (unknownDamageTypes.length > 0) {
    error(`cannot show damage type(s) ${unknownDamageTypes.join(", ")}`);
    return;
  }

  const damageSelection = damagesToShow.map((type) => generateEnergyBox(type, defaultValue)).join("\n");
  const content = `
<style>
  .damageSelect .form-group {
    display: flex;
    flex-wrap: wrap;
    width: 100%;
    align-items: flex-start;
  }
  .damageSelect .radio-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    justify-items: center;
    flex: 1 0 20%;
    line-height: normal;
  }
  .damageSelect .radio-label input {
    display: none;
  }
  .damageSelect img {
    border: 0px;
    width: 50px;
    height: 50px;
    flex: 0 0 50px;
    cursor: pointer;
  }
  /* CHECKED STYLES */
  .damageSelect [type="radio"]:checked + img {
    outline: 2px solid #f00;
  }
</style>
<form class="damageSelect">
  <div class="form-group" id="types">
    ${damageSelection}
  </div>
</form>
`;
  const damageType: string = await new Promise((resolve) => {
    new Dialog({
      title: "Choose Damage Type",
      content,
      buttons: {
        ok: {
          label: "OK",
          callback: async (html) => {
            //@ts-ignore
            const element: string = html.find("input[type='radio'][name='type']:checked").val();
            if (element) resolve(element);
          },
        },
      },
      default: "OK"
    }).render(true);
  });

  return damageType;
}