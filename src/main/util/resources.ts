import * as PIXI from "pixi.js";

export class GameResources {
	constructor(public loader: PIXI.Loader) {
		// loader.use(PIXI.BitmapFontLoader.use);
	}

	loadAll(onComplete: ()=>void) {
		// TODO handle failed loading gracefully
		this.loader.reset();
		this.loader.onError.add((a: any)=>console.log(a))
		this.loader
			// .use(PIXI.BitmapFontLoader.use)
			// .add("fonts/m5x7_16", "fonts/m5x7_medium_16.xml");
		console.log("all resources queued");
		this.loader.load(()=>{
			console.log("loading complete");
			console.log(this.loader.resources);
			onComplete();
		});
	}

	get(loc: string) {
		return this.loader.resources[loc];
	}
}