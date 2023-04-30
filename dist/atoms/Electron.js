import { Sphere } from "./Sphere.js";
export class Electron {
    //Construct a new electron, to render with the specified sphere radius
    constructor(radius) {
        this.subdivisions = 8;
        this.geometry = new Sphere(radius, this.subdivisions, this.subdivisions, true);
    }
    reset(radius) {
        this.geometry.set(radius, this.subdivisions, this.subdivisions, true, this.geometry.upAxis);
    }
    positionsFlat() {
        return this.geometry.getVertices();
    }
    indicesFlat() {
        return this.geometry.getIndices();
    }
    normalsFlat() {
        return this.geometry.getNormals();
    }
    uvFlat() {
        return this.geometry.getTexCoords();
    }
    /**
     * Get the quantum numbers for the specified atomic number
     * @param atomic_number Atomic number of the element to render
     * @returns A set of strings, where each string defines an orbital
     */
    static getConfig(atomic_number) {
        const orbitals = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s"];
        var result = new Set();
        let electrons = 0;
        let index = 0;
        while (electrons < atomic_number) {
            let orbital = orbitals[index];
            console.log(orbital);
            let eAdded = Math.min(Electron.getENum(orbital), atomic_number - electrons);
            console.log(eAdded);
            electrons += eAdded;
            for (let i = 0; i < eAdded; i++) {
                let str = this.getN(orbital).toString() + "_" + this.getl(orbital).toString() + "_" + (i % (this.getENum(orbital) / 2) + -this.getl(orbital)).toString() + ".json";
                result.add(str);
            }
            index += 1;
        }
        return result;
    }
    static getN(orbital) {
        return parseInt(orbital[0]);
    }
    static getl(orbital) {
        if (orbital[1] == 's') {
            return 0;
        }
        else if (orbital[1] == 'p') {
            return 1;
        }
        else if (orbital[1] == 'd') {
            return 2;
        }
        else {
            return 3;
        }
    }
    static getENum(orbital) {
        if (orbital[1] == 's') {
            return 2;
        }
        else if (orbital[1] == 'p') {
            return 6;
        }
        else if (orbital[1] == 'd') {
            return 10;
        }
        else {
            return 14;
        }
    }
}
//# sourceMappingURL=Electron.js.map