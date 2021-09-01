import * as PIXI from "pixi.js";
// @ts-ignore: the types don't seem to exist and I'm too lazy to do types for the library myself
import { Circle as CircleIntersects } from "yy-intersects";
import { GameRenderer } from "./render";
import { GameResources } from "../util/resources";
import { IKeyboardState, KeyboardState } from "../util/keyboard";

class GameLoop {
	delta = 0;
	tickCount = 0;

	constructor(public tick: (tickCount: number)=>void,
			public drawFrame: (tickCount: number, delta: number)=>void) {}

	step(delta: number) {
		this.delta += delta;

		if (this.delta > 2) {
			this.delta = 2;
		}

		while(this.delta >= 1) {
			this.delta--;
			this.tickCount++;
			this.tick(this.tickCount);
		}
		
		this.drawFrame(this.tickCount, this.delta);
	}
}

// This class from https://old.reddit.com/r/javascript/comments/93ntvh/simple_1d_perlin_noise_with_optional_octaves/
class Perlin {
	perm: any;
    constructor() {
        // Quick and dirty permutation table
        this.perm = (() => {
            const tmp = Array.from({length: 256}, () => Math.floor(Math.random() * 256));
            return tmp.concat(tmp);
        })();
    }

    grad(i: number, x: number): number {
        const h = i & 0xf;
        const grad = 1 + (h & 7);

        if ((h & 8) !== 0) {
            return -grad * x;
        }

        return grad * x;
    }

    getValue(x: number): number {
        const i0 = Math.floor(x);
        const i1 = i0 + 1;

        const x0 = x - i0;
        const x1 = x0 - 1;

        let t0 = 1 - x0 * x0;
        t0 *= t0;

        let t1 = 1 - x1 * x1;
        t1 *= t1;

        const n0 = t0 * t0 * this.grad(this.perm[i0 & 0xff], x0);
        const n1 = t1 * t1 * this.grad(this.perm[i1 & 0xff], x1);

        return 0.395 * (n0 + n1); //Output is between -1 and 1.
    }
}

const PERLIN = new Perlin();

const GRAVITY = 0.2;
const FRICTION = 0.98;
const WIND_MIN = 1;
const WIND_MAX = 3;
const WIND_FREQUENCY = 0.01;

class Point {
	public display: PIXI.Graphics;
	public dead: boolean = false;

	public vx: number = 0;
	public vy: number = 0;
	public fx: number = 0;
	public fy: number = 0;

	constructor(public x: number, public y: number, public isFixed: boolean) {
		if (isFixed) {
			this.display = Game.Instance.squareGraphic.clone();
		} else {
			this.display = Game.Instance.circleGraphic.clone();
		}
		this.postTickAndDisplay();
	}


	tick() {
		if (!this.isFixed) {
			this.vx += this.fx;
			this.vy += this.fy;

			let windSpeed = Game.Instance.windSpeed;

			this.vx -= windSpeed;
			this.vx *= FRICTION;
			this.vx += windSpeed;

			this.vy *= FRICTION;
			this.x += this.vx;
			this.y += this.vy;
		}
	}

	postTickAndDisplay() {
		this.fx = 0;
		this.fy = GRAVITY;
		this.display.x = this.x;
		this.display.y = this.y;
	}

	select() {
		this.display.tint = 0x00FFFF;
	}

	deselect() {
		this.display.tint = 0xFFFFFF;
	}
}

const LINE_STRENGTH = 0.1;

class Line {
	public display: PIXI.Graphics;
	public baseLength: number;

	constructor(public a: Point, public b: Point) {
		this.baseLength = Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y));

		this.display = new PIXI.Graphics();
		this.postTickAndDisplay();
	}

	tick() {
		let currentLength = Math.sqrt((this.a.x - this.b.x) * (this.a.x - this.b.x) + (this.a.y - this.b.y) * (this.a.y - this.b.y));
		// Negative means stretched, positive means squished
		let force = LINE_STRENGTH*(this.baseLength - currentLength);

		// Don't repel when squished
		if (!Game.Instance.repelOnSquish && force >= 0) return;

		let xNorm = (this.a.x - this.b.x) / currentLength;
		let yNorm = (this.a.y - this.b.y) / currentLength;
		this.a.fx += xNorm*force;
		this.a.fy += yNorm*force;
		this.b.fx -= xNorm*force;
		this.b.fy -= yNorm*force;
	}

	postTickAndDisplay() {
		this.display.clear();
		this.display.moveTo(this.a.x, this.a.y);
		this.display.lineStyle(3, 0xCCCCCC);
		this.display.lineTo(this.b.x, this.b.y);
	}
}

export class Game {

	static Instance: Game;

	renderer: GameRenderer;
	loop: GameLoop;

	keyboardState: IKeyboardState;

	ticker: PIXI.Ticker;
	tickCount: number = 0;

	circleGraphic: PIXI.Graphics;
	squareGraphic: PIXI.Graphics;

	pointsContainer: PIXI.Container;
	linesContainer: PIXI.Container;

	points: Point[] = [];
	lines: Line[] = [];

	paused: boolean = false;
	autoConnect: boolean = true;
	repelOnSquish: boolean = false;

	mouseX: number;
	mouseY: number;

	shiftDown: boolean = false;
	rightMouseDown: boolean = false;

	windSpeed: number;

	selectedPoint: Point | null = null;

	constructor(public resources: GameResources,
			view: HTMLCanvasElement, renderer: PIXI.Renderer,
			ticker: PIXI.Ticker, keyboardState: KeyboardState,
			viewportWidth: number, viewportHeight: number) {
		Game.Instance = this;
		this.ticker = ticker;
		this.keyboardState = keyboardState;
		this.renderer = new GameRenderer(this, view, renderer, viewportWidth, viewportHeight);
		this.loop = new GameLoop(
				()=>this.tick(keyboardState),
				(tickCount, delta)=>this.renderer.drawFrame(tickCount, delta));
		resources.loadAll(()=>this.init());
	}

	init() {
		this.renderer.initMembers();

		this.circleGraphic = new PIXI.Graphics();
		this.circleGraphic.beginFill(0xffffff);
		this.circleGraphic.drawCircle(0, 0, 8);
		this.circleGraphic.endFill();

		this.squareGraphic = new PIXI.Graphics();
		this.squareGraphic.beginFill(0xffffff);
		this.squareGraphic.drawRect(-8, -8, 16, 16);
		this.squareGraphic.endFill();

		this.linesContainer = new PIXI.Container();
		this.pointsContainer = new PIXI.Container();
		this.renderer.stage.addChild(this.linesContainer);
		this.renderer.stage.addChild(this.pointsContainer);

		console.log("Initialization complete");

		this.ticker.add((delta)=>this.loop.step(delta));
		this.ticker.start();
	}

	makeLine(a: Point, b: Point) {
		let line = new Line(a, b);
		this.lines.push(line);
		this.linesContainer.addChild(line.display);
	}

	removePoint(index: number) {
		let point = this.points.splice(index, 1)[0];
		point.dead = true;
		this.pointsContainer.removeChild(point.display);
	}

	removeLine(index: number) {
		let line = this.lines.splice(index, 1)[0];
		this.linesContainer.removeChild(line.display);
	}

	onClick(x: number, y: number, isRightClick: boolean) {
		let clickedIndex = this.points.findIndex(p => p.display.containsPoint(new PIXI.Point(x, y)));
		let clicked = this.points[clickedIndex];
		if (!isRightClick) {
			if (clicked != null) {
				if (this.selectedPoint == null) {
					this.selectedPoint = clicked;
					clicked.select();
				} else if (this.selectedPoint != clicked) {
					let existingLine = this.lines.find(line => (line.a == this.selectedPoint && line.b == clicked) || (line.b == this.selectedPoint && line.a == clicked));
					if (existingLine == null) {
						this.makeLine(this.selectedPoint, clicked);
					}
					this.selectedPoint.deselect();
					clicked.select();
					this.selectedPoint = clicked;
				}
				return;
			}
			let point = new Point(x, y, this.shiftDown);
			// unshift instead of push so when we look for clicked points, newer points come up first
			// could just iterate in reverse order but I'm lazy
			this.points.unshift(point);
			this.pointsContainer.addChild(point.display);
			if (this.selectedPoint != null) {
				if (this.autoConnect) {
					this.makeLine(this.selectedPoint, point);
				}
				this.selectedPoint.deselect();
			}
			this.selectedPoint = point;
			point.select();
		} else {
			if (clicked != null) {
				this.removePoint(clickedIndex);
			} else {
				this.rightMouseDown = true;
			}
		}
	}

	updateMousePos(x: number, y: number) {
		this.mouseX = x;
		this.mouseY = y;
	}

	onMouseUp(n: number) {
		if (n == 2) {
			this.rightMouseDown = false;
		}
	}

	tick(keyboardState: KeyboardState) {
		this.shiftDown = keyboardState.pressed["ShiftLeft"];
		if (keyboardState.keyDowns.has("KeyP")) {
			this.paused = !this.paused;
			console.log("Paused: " + this.paused);
		}
		if (keyboardState.keyDowns.has("KeyC")) {
			this.autoConnect = !this.autoConnect;
			console.log("Auto connect: " + this.autoConnect);
		}
		if (keyboardState.keyDowns.has("KeyO")) {
			this.repelOnSquish = !this.repelOnSquish;
			console.log("Repel on squish: " + this.repelOnSquish);
		}

		if (keyboardState.keyDowns.has("Escape")) {
			if (this.selectedPoint != null) {
				this.selectedPoint.deselect();
				this.selectedPoint = null;
			}
		}

		if (this.rightMouseDown) {
			let circle = new CircleIntersects({}, {radius: 5, positionObject: {x: this.mouseX, y: this.mouseY}});
			for (let i = this.lines.length-1; i >= 0; i--) {
				let line = this.lines[i];
				if (circle.collidesLine(line.a, line.b)) {
					this.removeLine(i);
				}
			}
		}

		if (!this.paused) {
			this.tickCount++;
			
			this.windSpeed = WIND_MIN + (WIND_MAX - WIND_MIN) * PERLIN.getValue(Game.Instance.tickCount * WIND_FREQUENCY);

			for (let line of this.lines) {
				line.tick();
			}
			for (let i = this.points.length-1; i >= 0; i--) {
				let point = this.points[i];
				point.tick();
				if (point.y > 10000) {
					this.removePoint(i);
					if (this.selectedPoint == point) {
						this.selectedPoint = null;
						point.deselect();
					}
				} else {
					point.postTickAndDisplay();
				}
			}
			for (let i = this.lines.length-1; i >= 0; i--) {
				let line = this.lines[i];
				if (line.a.dead || line.b.dead) {
					this.removeLine(i);
				} else {
					line.postTickAndDisplay();
				}
			}
		}


		keyboardState.onPostTick();
	}
}