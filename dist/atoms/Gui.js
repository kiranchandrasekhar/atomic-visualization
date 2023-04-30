import { Camera } from "../lib/webglutils/Camera.js";
import { Vec3 } from "../lib/TSM.js";
/**
 * Handles Mouse and Button events along with
 * the the camera.
 */
export class GUI {
    /**
     *
     * @param canvas required to get the width and height of the canvas
     * @param controls Div with control inputs
     * @param animation required as a back pointer for some of the controls
     */
    constructor(canvas, controls, animation) {
        this.height = canvas.height;
        this.width = canvas.width;
        this.prevX = 0;
        this.prevY = 0;
        this.dragging = false;
        this.animation = animation;
        this.controls = controls;
        this.controlsValues = {};
        this.reset();
        this.registerEventListeners(canvas);
        this.registerResponsiveGUI(controls);
    }
    /**
     * Resets the state of the GUI
     */
    reset() {
        this.camera = new Camera(new Vec3([0, 7, -13]), new Vec3([0, 0, 0]), new Vec3([0, 0, 1]), 45, this.width / this.height, 0.1, 1000.0);
    }
    /**
     * Sets the GUI's camera to the given camera
     * @param cam a new camera
     */
    setCamera(pos, target, upDir, fov, aspect, zNear, zFar) {
        this.camera = new Camera(pos, target, upDir, fov, aspect, zNear, zFar);
    }
    /**
     * Returns the view matrix of the camera
     */
    viewMatrix() {
        return this.camera.viewMatrix();
    }
    /**
     * Returns the projection matrix of the camera
     */
    projMatrix() {
        return this.camera.projMatrix();
    }
    getCamera() {
        return this.camera;
    }
    dragStart(mouse) {
        this.prevX = mouse.screenX;
        this.prevY = mouse.screenY;
        this.dragging = true;
    }
    dragEnd(mouse) {
        this.dragging = false;
    }
    /**
     * The callback function for a drag event.
     * This event happens after dragStart and
     * before dragEnd.
     * @param mouse
     */
    drag(mouse) {
        let x = mouse.offsetX;
        let y = mouse.offsetY;
        const dx = mouse.screenX - this.prevX;
        const dy = mouse.screenY - this.prevY;
        this.prevX = mouse.screenX;
        this.prevY = mouse.screenY;
        if (this.dragging) {
            this.camera.rotate(new Vec3([0, 1, 0]), -GUI.rotationSpeed * dx);
            this.camera.rotate(this.camera.right(), -GUI.rotationSpeed * dy);
        }
    }
    walkDir() {
        let answer = new Vec3;
        if (this.Wdown)
            answer.add(this.camera.forward().negate());
        if (this.Adown)
            answer.add(this.camera.right().negate());
        if (this.Sdown)
            answer.add(this.camera.forward());
        if (this.Ddown)
            answer.add(this.camera.right());
        if (this.up)
            answer.add(this.camera.up());
        if (this.down)
            answer.add(this.camera.up().negate());
        //answer.y = 0;
        answer.normalize();
        return answer;
    }
    /**
     * Enables/disables cutaways
     */
    toggleCutaway() {
        this.controlsValues["cutaway"] = !this.controlsValues["cutaway"];
    }
    /**
     * Enables/disables shading
     */
    toggleShading() {
        this.controlsValues["shading"] = !this.controlsValues["shading"];
    }
    /**
     * Callback function for a key press event
     * @param key
     */
    onKeydown(key) {
        switch (key.code) {
            case "KeyW": {
                this.Wdown = true;
                break;
            }
            case "KeyA": {
                this.Adown = true;
                break;
            }
            case "KeyS": {
                this.Sdown = true;
                break;
            }
            case "KeyD": {
                this.Ddown = true;
                break;
            }
            case "KeyR": {
                this.animation.reset();
                break;
            }
            case "KeyM": {
                this.down = true;
                break;
            }
            case "KeyK": {
                this.up = true;
                break;
            }
            default: {
                console.log("Key : '", key.code, "' was pressed.");
                break;
            }
        }
    }
    /**
     * Callback function for a key press event
     * @param key
     */
    onKeyup(key) {
        switch (key.code) {
            case "KeyW": {
                this.Wdown = false;
                break;
            }
            case "KeyA": {
                this.Adown = false;
                break;
            }
            case "KeyS": {
                this.Sdown = false;
                break;
            }
            case "KeyD": {
                this.Ddown = false;
                break;
            }
            case "KeyM": {
                this.down = false;
                break;
            }
            case "KeyK": {
                this.up = false;
                break;
            }
        }
    }
    /**
     * Registers all event listeners for the GUI
     * @param canvas The canvas being used
     */
    registerEventListeners(canvas) {
        /* Event listener for key controls */
        window.addEventListener("keydown", (key) => this.onKeydown(key));
        window.addEventListener("keyup", (key) => this.onKeyup(key));
        /* Event listener for mouse controls */
        canvas.addEventListener("mousedown", (mouse) => this.dragStart(mouse));
        canvas.addEventListener("mousemove", (mouse) => this.drag(mouse));
        canvas.addEventListener("mouseup", (mouse) => this.dragEnd(mouse));
        /* Event listener to stop the right click menu */
        canvas.addEventListener("contextmenu", (event) => event.preventDefault());
    }
    /**
     * Update an element in the GUI
     * @param element the element in the gui
     * @param values values used for updating the elemnt
     */
    updateElement(element, values) {
        if (element.className == "slider-container") {
            //Update sliders
            let range_elem = element.getElementsByClassName("slider")[0];
            let val_elem = element.getElementsByClassName("slider-value")[0];
            let id = element.id;
            let value = "0";
            //Update value and register in key-value store
            if ("value" in values) {
                value = values.value;
                range_elem.value = value;
                val_elem.innerHTML = value;
                this.controlsValues["private-" + id] = parseInt(value);
            }
            if ("min" in values) {
                range_elem.min = values.min;
            }
            if ("max" in values) {
                range_elem.max = values.max;
            }
            //Special cases
            if (id === "l-number") {
                //value of L affects bounds of M
                let m_slider = document.getElementById("m-number");
                let valueNum = parseInt(range_elem.value);
                this.updateElement(m_slider, { value: "0", min: (-valueNum) + "", max: valueNum + "" });
            }
            else if (id === "n-number") {
                //value of N affects bounds of L
                let l_slider = document.getElementById("l-number");
                this.updateElement(l_slider, { value: "0", max: parseInt(value) - 1 });
            }
        }
        else if (element.className == "toggle-button") {
            //Update toggles
            let button = element;
            let value = false;
            if (button.id == "cutaway-toggle-button") {
                this.toggleCutaway();
                value = this.controlsValues["cutaway"];
            }
            else if (button.id == "shading-toggle-button") {
                this.toggleShading();
                value = this.controlsValues["shading"];
            }
            if (value) {
                button.value = "Enabled";
                button.style.backgroundColor = "green";
            }
            else {
                button.value = "Disabled";
                button.style.backgroundColor = "red";
            }
        }
        else if (element.className == "activate-button") {
            //Update remaining buttons
            let button = element;
            if (button.id == "atomic-activate-button") {
                this.controlsValues["atomic-number"] = this.controlsValues["private-atomic-number"];
            }
            else if (button.id == "orbital-activate-button") {
                this.controlsValues["n-number"] = this.controlsValues["private-n-number"];
                this.controlsValues["l-number"] = this.controlsValues["private-l-number"];
                this.controlsValues["m-number"] = this.controlsValues["private-m-number"];
            }
        }
    }
    /**
     * Registers callbacks on the various sliders and buttons used to control the program
     * @param controls Container with various sliders and buttons to control the program
     */
    registerResponsiveGUI(controls) {
        //Initialize Sliders
        let sliders = controls.getElementsByClassName("slider-container");
        for (let i = 0; i < sliders.length; ++i) {
            let id = sliders[i].id;
            let range = document.getElementById(id + "-slider");
            if (range !== null) {
                range.oninput = (event) => {
                    if (event.target != null) {
                        let target = event.target;
                        if (target.parentElement)
                            this.updateElement(target.parentElement, { value: target.value });
                    }
                };
            }
        }
        //Initalize Buttons
        let buttons = controls.getElementsByClassName("button-container");
        for (let i = 0; i < buttons.length; ++i) {
            let id = buttons[i].id;
            let button = document.getElementById(id + "-button");
            if (button !== null) {
                button.onclick = (event) => {
                    if (event.target != null) {
                        this.updateElement(event.target, {});
                    }
                };
            }
        }
        this.intializeValues();
    }
    /**
     * Initialize values in the GUI
     */
    intializeValues() {
        this.controlsValues["n-number"] = 1;
        this.controlsValues["l-number"] = 0;
        this.controlsValues["m-number"] = 0;
        this.controlsValues["private-n-number"] = 1;
        this.controlsValues["private-l-number"] = 0;
        this.controlsValues["private-m-number"] = 0;
        this.controlsValues["cutaway"] = false;
        this.controlsValues["shading"] = false;
        this.controlsValues["atomic-number"] = 1;
        this.controlsValues["private-atomic-number"] = 1;
    }
    /**
     *
     * @param key The value to obtain from the GUI
     * @returns the value of the specified element
     */
    get(key) {
        return this.controlsValues[key];
    }
}
GUI.rotationSpeed = 0.01;
GUI.walkSpeed = 1;
GUI.rollSpeed = 0.1;
GUI.panSpeed = 0.1;
//# sourceMappingURL=Gui.js.map