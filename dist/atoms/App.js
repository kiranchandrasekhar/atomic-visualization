var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Debugger } from "../lib/webglutils/Debugging.js";
import { CanvasAnimation } from "../lib/webglutils/CanvasAnimation.js";
import { GUI } from "./Gui.js";
import { electronFSText, electronVSText } from "./Shaders.js";
import { Vec4, Vec3 } from "../lib/TSM.js";
import { RenderPass } from "../lib/webglutils/RenderPass.js";
import { Electron } from "./Electron.js";
export class ElectronAnimation extends CanvasAnimation {
    constructor(canvas) {
        super(canvas);
        this.canvas2d = document.getElementById("textCanvas");
        this.ctx = Debugger.makeDebugContext(this.ctx);
        let gl = this.ctx;
        this.gui = new GUI(this.canvas2d, document.getElementById("controls-container"), this);
        this.playerPosition = this.gui.getCamera().pos();
        this.electronRenderPass = new RenderPass(gl, electronVSText, electronFSText);
        this.electronGeometry = new Electron(0.3);
        this.initElectron();
        this.lightPosition = new Vec3([3, 7, -13]);
        this.backgroundColor = new Vec4([1.0, 1.0, 1.0, 1.0]);
        this.initialTime = Date.now();
        this.nlm = new Vec3([1, 0, 0]);
        this.currentGradient = 0.0;
        this.atomicNumber = 1;
        this.setElectronPositions(this.nlm.x, this.nlm.y, this.nlm.z);
    }
    /**
     * Reset the possible electron positions based on input
     * @param n Value of the n quantum number
     * @param l Value of the l quantum number
     * @param m Value of the m quantum number
     * @param config Array of quantum numbers to render multiple orbitals,
     *  specified as [n_i, l_i, m_i, n_{i+1}, m_{i+1}, l_{i+1}, ...]
     */
    setElectronPositions(n, l, m, config) {
        this.electronsLoaded = false;
        if (config == undefined) {
            //Load in just one orbital from the specified N, L, M (for hydrogen)
            this.getElectronPositions(n, l, m).then((data) => {
                this.electronPositions = [];
                this.electronPositions.push(new Float32Array(data));
                this.electronCount = this.electronPositions[0].length / 4;
                this.electronsLoaded = true;
                //Find the maximum radius of this orbital
                let max = -10000000;
                let min = 10000000;
                data.forEach((value) => {
                    if (value > max) {
                        max = value;
                    }
                    if (value < min) {
                        min = value;
                    }
                });
                this.electronRadius = Math.max(Math.abs(max), Math.abs(min));
            });
        }
        else {
            //Load in from config
            this.electronRadius = 0.0;
            this.electronPositions = [];
            this.electronCount = 0;
            this.nlmMultiple = [];
            let totalCount = config.length / 3;
            for (let i = 0; i < config.length; i += 3) {
                this.nlmMultiple.push(new Vec3([config[i], config[i + 1], config[i + 2]]));
                this.getElectronPositions(config[i], config[i + 1], config[i + 2]).then((data) => {
                    //Don't necessarily want to sample all the points, in order to speed up rendering with many orbitals
                    let sampledPos = new Float32Array(data.length / totalCount);
                    for (let j = 0; j < sampledPos.length; ++j) {
                        sampledPos[j] = data[j];
                    }
                    this.electronPositions.push(sampledPos);
                    data.forEach((value) => {
                        if (Math.abs(value) > this.electronRadius) {
                            this.electronRadius = Math.abs(value);
                        }
                    });
                });
            }
            this.electronsLoaded = true;
        }
    }
    /**
     * Asynchronously load an orbital from its JSON file
     * @param n Value of the n quantum number
     * @param l Value of the l quantum number
     * @param m Value of the m quantum number
     * @returns A Promise, which contains an array of quantum numbers to render multiple orbitals,
     *  specified as [n_i, l_i, m_i, n_{i+1}, m_{i+1}, l_{i+1}, ...]
     */
    getElectronPositions(n, l, m) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const path = `../samples/${n}_${l}_${m}.json`;
                fetch(path)
                    .then(response => response.text())
                    .then(data => {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                })
                    .catch(error => {
                    console.error(error);
                    reject("Error reading orbital data");
                });
            });
        });
    }
    /**
     * Setup the simulation. This can be called again to reset the program.
     */
    reset() {
        this.gui.reset();
        this.playerPosition = this.gui.getCamera().pos();
    }
    /**
     * Sets up the electron drawing
     */
    initElectron() {
        this.electronRenderPass.setIndexBufferData(this.electronGeometry.indicesFlat());
        this.electronRenderPass.addAttribute("aVertPos", 3, this.ctx.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, this.electronGeometry.positionsFlat());
        this.electronRenderPass.addAttribute("aNorm", 3, this.ctx.FLOAT, false, 3 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, this.electronGeometry.normalsFlat());
        this.electronRenderPass.addInstancedAttribute("aOffset", 4, this.ctx.FLOAT, false, 4 * Float32Array.BYTES_PER_ELEMENT, 0, undefined, new Float32Array(0));
        this.electronRenderPass.addUniform("uLightPos", (gl, loc) => {
            gl.uniform3fv(loc, this.lightPosition.xyz);
        });
        this.electronRenderPass.addUniform("uProj", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.projMatrix().all()));
        });
        this.electronRenderPass.addUniform("uView", (gl, loc) => {
            gl.uniformMatrix4fv(loc, false, new Float32Array(this.gui.viewMatrix().all()));
        });
        this.electronRenderPass.addUniform("uTime", (gl, loc) => {
            gl.uniform1f(loc, this.getTime());
        });
        this.electronRenderPass.addUniform("uRadius", (gl, loc) => {
            gl.uniform1f(loc, this.getElectronRadius());
        });
        this.electronRenderPass.addUniform("uNLM", (gl, loc) => {
            gl.uniform3fv(loc, this.getQuantumNumbers());
        });
        this.electronRenderPass.addUniform("uCutaway", (gl, loc) => {
            gl.uniform1f(loc, this.getCutaway());
        });
        this.electronRenderPass.addUniform("uShading", (gl, loc) => {
            gl.uniform1f(loc, this.getShading());
        });
        this.electronRenderPass.addUniform("uGradient", (gl, loc) => {
            gl.uniform1f(loc, this.getCurrentGradient());
        });
        this.electronRenderPass.setDrawData(this.ctx.TRIANGLES, this.electronGeometry.indicesFlat().length, this.ctx.UNSIGNED_INT, 0);
        this.electronRenderPass.setup();
    }
    getCutaway() {
        if (this.gui.get("cutaway")) {
            return 1;
        }
        return 0;
    }
    getShading() {
        if (this.gui.get("shading")) {
            return 1;
        }
        return 0;
    }
    getTime() {
        return ((Date.now() - this.initialTime) / 10) % 48000;
    }
    getElectronRadius() {
        return this.electronRadius;
    }
    getQuantumNumbers() {
        return new Float32Array([this.nlm.x, this.nlm.y, this.nlm.z]);
    }
    getCurrentGradient() {
        return this.currentGradient;
    }
    /**
     * Update electron positions based on the atomic number
     */
    updateConfig() {
        let results = Electron.getConfig(this.atomicNumber);
        let config = [];
        results.forEach((value) => {
            let seperated = value.split("_");
            seperated.forEach((str) => {
                config.push(parseInt(str));
            });
        });
        this.setElectronPositions(0, 0, 0, config);
    }
    /**
     * Update the quantum numbers from the GUI and load new electron positions, if necessary.
     */
    updateFromGUI() {
        let changed = false;
        if (this.atomicNumber != this.gui.get("atomic-number")) {
            this.atomicNumber = this.gui.get("atomic-number");
            changed = true;
        }
        if (this.atomicNumber == 1) {
            let n = this.gui.get("n-number");
            let l = this.gui.get("l-number");
            let m = this.gui.get("m-number");
            if (changed || n != this.nlm.x || l != this.nlm.y || m != this.nlm.z) {
                this.nlm = new Vec3([n, l, m]);
                this.setElectronPositions(n, l, m);
                this.electronGeometry.reset(0.1 * n);
            }
        }
        else if (changed) {
            this.updateConfig();
        }
    }
    /**
     * Draws a single frame
     *
     */
    draw() {
        this.updateFromGUI();
        this.playerPosition.add(this.gui.walkDir());
        this.gui.getCamera().setPos(this.playerPosition);
        this.lightPosition = this.playerPosition;
        // Drawing
        const gl = this.ctx;
        const bg = this.backgroundColor;
        gl.clearColor(bg.r, bg.g, bg.b, bg.a);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.frontFace(gl.CCW);
        gl.cullFace(gl.BACK);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null); // null is the default frame buffer
        this.drawScene(0, 0, 1280, 960);
    }
    drawScene(x, y, width, height) {
        const gl = this.ctx;
        gl.viewport(x, y, width, height);
        this.currentGradient = 0;
        if (this.electronsLoaded) {
            if (this.atomicNumber == 1) {
                //Want to draw one orbital, based on GUI n, l, and m
                this.electronRenderPass.updateAttributeBuffer("aOffset", this.electronPositions[0]);
                this.electronRenderPass.drawInstanced(this.electronCount);
            }
            else {
                //Want to draw multiple orbitals, with different gradients for each
                for (let i = 0; i < this.electronPositions.length; i++) {
                    this.electronRenderPass.updateAttributeBuffer("aOffset", this.electronPositions[i]);
                    this.nlm = this.nlmMultiple[i];
                    this.electronRenderPass.drawInstanced(this.electronPositions[i].length / 4);
                    this.currentGradient++;
                    this.currentGradient %= 5;
                }
            }
        }
    }
    getGUI() {
        return this.gui;
    }
}
export function initializeCanvas() {
    const canvas = document.getElementById("glCanvas");
    /* Start drawing */
    const canvasAnimation = new ElectronAnimation(canvas);
    canvasAnimation.start();
}
//# sourceMappingURL=App.js.map