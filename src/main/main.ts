import * as PIXI from "pixi.js";
import { KeyboardState } from "./util/keyboard";
import { Game } from "./core/game";
import { GameResources } from "./util/resources";

PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

const loader = new PIXI.Loader("build/assets");

const rendererOpts = {
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0x070707
};

const renderer = PIXI.autoDetectRenderer(rendererOpts);

document.body.appendChild(renderer.view);

let keyboardState = new KeyboardState();
// TODO find set of keys that are safe to preventDefault() for
// - don't want to block F12, etc
window.addEventListener("keydown", event=>{
	// event.preventDefault();
	if (!event.repeat)
		keyboardState.onKeyDown(event.code);
});
window.addEventListener("keyup", event=>{
	// event.preventDefault();
	if (!event.repeat)
		keyboardState.onKeyUp(event.code);
});
window.addEventListener("blur", event=>{
	keyboardState.onBlur();
	// TODO pause on lost focus
});


let game = new Game(new GameResources(loader), renderer.view, renderer, new PIXI.Ticker(), keyboardState,
	window.innerWidth, window.innerHeight);

renderer.view.addEventListener("click", e => {
	const target = e.target!;

    const rect = (target as any).getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
	game.onClick(x, y, false);
});

renderer.view.addEventListener("contextmenu", e => {
	e.preventDefault();
	const target = e.target!;

    const rect = (target as any).getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
	game.onClick(x, y, true);
});

renderer.view.addEventListener("mousemove", e => {
	const target = e.target!;

    const rect = (target as any).getBoundingClientRect();

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
	game.updateMousePos(x, y);
})

renderer.view.addEventListener("mouseup", e => {
	game.onMouseUp((e as any).button);
})

window.addEventListener("resize", ()=>game.renderer.resize(window.innerWidth, window.innerHeight));
