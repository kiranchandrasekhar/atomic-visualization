import { Mat3, Mat4, Vec3, Vec4 } from "../lib/TSM.js";

import { Sphere } from "./Sphere.js";

export class Electron {
  public center: Vec3;
  public scalar: GLfloat;

  private subdivisions: number;

  private geometry: Sphere;

  //Construct a new electron, to render with the specified sphere radius
  constructor(radius:number) {
    this.subdivisions = 8;
    this.geometry = new Sphere(radius, this.subdivisions, this.subdivisions, true);
  }

  public reset(radius:number):void {
    this.geometry.set(radius, this.subdivisions, this.subdivisions, true, this.geometry.upAxis);
  }

  public positionsFlat(): Float32Array {
    return this.geometry.getVertices();
  }

  public indicesFlat(): Uint32Array {
    return this.geometry.getIndices();
  }

  public normalsFlat(): Float32Array {
    return this.geometry.getNormals();
  }
  
  public uvFlat() : Float32Array {
    return this.geometry.getTexCoords();
  }

  /**
   * Get the quantum numbers for the specified atomic number
   * @param atomic_number Atomic number of the element to render
   * @returns A set of strings, where each string defines an orbital
   */
  public static getConfig(atomic_number:number) : Set<string>{
    const orbitals = ["1s", "2s", "2p", "3s", "3p", "4s", "3d", "4p", "5s"]
    var result = new Set<string>();
    let electrons = 0;
    let index = 0;
    
    while(electrons < atomic_number){
      let orbital = orbitals[index]
      console.log(orbital);
      let eAdded = Math.min(Electron.getENum(orbital), atomic_number-electrons);
      console.log(eAdded);
      electrons+=eAdded;
      for(let i = 0; i < eAdded; i++){
        let str = this.getN(orbital).toString() + "_" + this.getl(orbital).toString() + "_" + (i%(this.getENum(orbital)/2) + -this.getl(orbital)).toString() + ".json";
        result.add(str);
      }
        
      index += 1;
    }
    return result;
  }

  private static getN(orbital): number{
    return parseInt(orbital[0]);
  }

  private static getl(orbital): number{
    if(orbital[1] == 's'){
      return 0;
    }else if(orbital[1] == 'p'){
      return 1;
    }else if(orbital[1] == 'd'){
      return 2;
    }else{
      return 3;
    }
  }

  private static getENum(orbital): number{
    if(orbital[1] == 's'){
      return 2;
    }else if(orbital[1] == 'p'){
      return 6;
    }else if(orbital[1] == 'd'){
      return 10;
    }else{
      return 14;
    }
  }
}
