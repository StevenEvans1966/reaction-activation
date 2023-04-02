import { warn, error } from "../main.js";
import { getUnknownDamageTypes as getUnknownDamageTypes, getAllDamageTypeNameAndIcon, getDamageTypeNameAndIcon } from "../module/config.js";
export async function showSelectDamageButtonsDialog(damageTypes, defaultValue, flavor) {
	switch (damageTypes.length) {
		case 0:
			error("Not damage types to display");
			return;
		case 1:
			const damageType = damageTypes[0];
			return { damageType, nameAndIcon: getDamageTypeNameAndIcon(damageType) };
	}
	let unknownDamageTypes = getUnknownDamageTypes(damageTypes);
	if (unknownDamageTypes.length > 0) {
		error(`cannot show damage type(s) ${unknownDamageTypes.join(", ")}`);
		return;
	}
	const damageNamesAndIcons = getAllDamageTypeNameAndIcon(damageTypes);
	//@ts-ignore
	const timeOut = ((MidiQOL.configSettings.reactionTimeout || 30) - 1) * 1000;
	return new Promise((resolve, reject) => {
		let timeoutId = setTimeout(() => {
			dialog.close();
			resolve({ damageType: defaultValue, nameAndIcon: getDamageTypeNameAndIcon(defaultValue) });
		}, timeOut);
		const callback = async function (dialog, button) {
			clearTimeout(timeoutId);
			const key = button.key;
			dialog.close();
			resolve({ damageType: key, nameAndIcon: getDamageTypeNameAndIcon(key) });
		};
		const dialog = new SelectDamageButtonsDialog({
			targetObject: this,
			title: "Choose Damage Type",
			items: damageNamesAndIcons,
			content: flavor,
			callback,
			close: resolve,
		}, { width: 400 });
		dialog.render(true);
	});
}
class SelectDamageButtonsDialog extends Application {
	constructor(data, options) {
		super(options);
		this.startTime = Date.now();
		this.data = data;
		this.data.completed = false;
	}
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			template: "modules/midi-qol/templates/dialog.html",
			classes: ["dialog"],
			width: 150,
			height: "auto",
			jQuery: true
		});
	}
	get title() {
		return this.data.title || "Dialog";
	}
	async getData(options) {
		this.data.buttons = this.data.items.reduce((acc, item) => {
			acc[randomID()] = {
				icon: `<div class="item-image"> <image src=${item.img} width="50" height="50" style="margin:10px"></div>`,
				label: `${item.name}`,
				value: item.name,
				key: item.key,
				callback: this.data.callback,
			};
			return acc;
		}, {});
		return {
			content: this.data.content,
			buttons: this.data.buttons
		};
	}
	activateListeners(html) {
		html.find(".dialog-button").click(this._onClickButton.bind(this));
		$(document).on('keydown.chooseDefault', this._onKeyDown.bind(this));
	}
	_onClickButton(event) {
		const id = event.currentTarget.dataset.button;
		const button = this.data.buttons[id];
		warn("Reaction dialog button clicked", id, button, Date.now() - this.startTime);
		this.submit(button);
	}
	_onKeyDown(event) {
		// Close dialog
		if (event.key === "Escape" || event.key === "Enter") {
			warn("Reaction Dialog onKeyDown esc/enter pressed", event.key, Date.now() - this.startTime);
			event.preventDefault();
			event.stopPropagation();
			this.data.completed = true;
			if (this.data.close)
				this.data.close({ name: "keydown" });
			this.close();
		}
	}
	async submit(button) {
		try {
			warn("ReactionDialog submit", Date.now() - this.startTime, button.callback);
			if (button.callback) {
				this.data.completed = true;
				await button.callback(this, button);
				this.close();
			}
		}
		catch (err) {
			ui.notifications?.error(err);
			error(err);
			this.data.completed = false;
			this.close();
		}
	}
	async close() {
		warn("Reaction Dialog close ", Date.now() - this.startTime, this.data.completed);
		if (!this.data.completed && this.data.close) {
			this.data.close({ name: "Close" });
		}
		$(document).off('keydown.chooseDefault');
		return super.close();
	}
}
