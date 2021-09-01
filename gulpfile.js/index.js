const { series, parallel, src, dest } = require("gulp");
// const glsl = require("./glsl");
const run = require("gulp-run-command").default;

const clean = () => {return run("rm -rf build")()};

// const makeOutputDirs = () => {
// 	return run("mkdir -p build/assets/textures build/assets/shaders")()
// };
// const texturePacker = () => {
// 	return run("free-tex-packer-cli \
// --project ./src/assets/spritesheet.ftpp \
// --output ./build/assets/textures")()
// };
// const buildShaders = () => {
// 	return src("./src/assets/main/shaders/main/**/*.glsl")
// 		.pipe(glsl())
// 		.pipe(dest("build/assets/shaders/"))
// };
const copyFonts = () => {
	return run("cp -r src/assets/main/fonts/. build/assets/fonts")();
};
// const copySounds = () => {
// 	return run("cp -r src/assets/main/sounds/. build/assets/sounds")();
// };

const assets = series(
	// makeOutputDirs,
	copyFonts);
	// parallel(texturePacker, buildShaders, copyFonts, copySounds));

const ttsc = () => {return run("ttsc")()};
const webpack = () => {return run("webpack")()};
const compile = series(ttsc, webpack);

const defaultTask = parallel(compile, assets);

exports.clean = clean;

// exports.textures = series(makeOutputDirs, texturePacker);
// exports.shaders = series(makeOutputDirs, buildShaders);
exports.fonts = copyFonts;
// exports.sounds = copySounds;
exports.assets = assets;

exports.ttsc = ttsc;
exports.compile = compile;
exports.default = defaultTask;