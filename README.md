# README
A rope simulator, I guess

There's a lot of useless code in here since I copy-pasted from an old project and ripped out the parts I didn't need.

Unused font that's sitting in the assets folder in case I use it in future is [m5x7 by Daniel Linssen](https://managore.itch.io/m5x7).

Available on [github pages](https://cursedflames.github.io/rope_simulator/index.html), or, to run it yourself:

Installation: `npm install`

Compilation: `gulp`

Depending on your browser, opening index.html directly might not work, due to failing to load resources; you'll need a localhost server instead. I recommend [http-server](https://www.npmjs.com/package/http-server) as a simple server.

Also note that pixi.js's ticker seems to busy wait and max out a CPU core, so this thing will max out one of your cores while it's open. I should probably fix that at some point.

P: pause/unpause
C: toggle auto-connect to newly created points
O: toggle repulsion when links become smaller than their base length

Left click: new point
Shift+left click: new anchor
click on one point with another selected to connect them

Right click to remove points
Hold right click to cut through links

Escape to deselect the currently selected point
