import { setDebugLevel } from "./main.js";
let moduleName = 'steven-premades';
export const registerSettings = function () {
     //@ts-ignore
    game.settings.register(moduleName, "Debug", {
        name: "Enable debug",
        hint: "Set to None unless you want to fill up the console log. All enables CONFIG.hooks.debug",
        scope: "world",
        default: "None",
        type: String,
        config: true,
        choices:  {
            "none": "None",
            "warn": "Warnings",
            "debug": "Debug",
            "all": "All"
        },
        onChange: fetchParams
    });
}

export let fetchParams = () => {
    //@ts-ignore
    let debugText: string = String(game.settings.get(moduleName, "Debug"));
    setDebugLevel(debugText);
}