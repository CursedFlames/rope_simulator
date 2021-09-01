import * as PIXI from "pixi.js";
import { Game } from "./game";
import { INV_ASPECT_RATIO, ASPECT_RATIO } from "src/main/constants";

export class GameRenderer {
	stage: PIXI.Container;

	defaultShader: PIXI.Shader;

	renderer: PIXI.Renderer;

	upscaledWidth: number;
	upscaledHeight: number;

	view: HTMLCanvasElement;

	constructor(public readonly game: Game,
			view: HTMLCanvasElement, renderer: PIXI.Renderer,
			viewportWidth: number, viewportHeight: number) {
		this.view = view;
		this.renderer = renderer;
		let viewSize = this.calcViewSize(viewportWidth, viewportHeight);
		this.resizeToResolution(viewSize[0], viewSize[1], false);
	}

	// separated from constructor so it can be called once resource loading is done
	initMembers() {
		console.log("Renderer init");

		this.defaultShader = new PIXI.Filter(undefined, undefined);

		this.stage = new PIXI.Container();
		this.renderer.backgroundColor = 0;

		// Call resize again now that members are initialized
		// Maybe not necessary, but helps avoid initialization bugs
		this.resizeToResolution(this.upscaledWidth, this.upscaledHeight);
	}

	// parts of next two methods from here:
	// https://medium.com/@michelfariarj/scale-a-pixi-js-game-to-fit-the-screen-1a32f8730e9c
	// thanks, dude that wrote it
	private calcViewSize(vpw: number, vph: number): [number, number] {
		let nvw; // New game width
		let nvh; // New game height

		// The aspect ratio is the ratio of the screen's sizes in different dimensions.
		// The height-to-width aspect ratio of the game is HEIGHT / WIDTH.

		if (vph / vpw < INV_ASPECT_RATIO) {
			// If height-to-width ratio of the viewport is less than the height-to-width ratio
			// of the game, then the height will be equal to the height of the viewport, and
			// the width will be scaled.
			nvh = vph;
			nvw = nvh * ASPECT_RATIO;
		} else {
			// In the else case, the opposite is happening.
			nvw = vpw;
			nvh = nvw * INV_ASPECT_RATIO;
		}

		return [nvw, nvh];
	}

	private resizeToResolution(nvw: number, nvh: number, initialized = true) {

		// Set the game screen size to the new values.
		// This command only makes the screen bigger --- it does not scale the contents of the game.
		// There will be a lot of extra room --- or missing room --- if we don't scale the stage.
		this.renderer.resize(nvw, nvh);

		this.upscaledWidth = nvw;
		this.upscaledHeight = nvh;
	}

	resize(vpw: number, vph: number) {
		this.resizeToResolution(...this.calcViewSize(vpw, vph));
	}

	drawFrame(tickCount: number, delta: number) {
		this.renderer.render(this.stage);
	}
}