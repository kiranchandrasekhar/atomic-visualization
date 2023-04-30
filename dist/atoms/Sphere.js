///////////////////////////////////////////////////////////////////////////////
// Modified for TS from: 
// Sphere.h
// ========
// Sphere for OpenGL with (radius, sectors, stacks)
// The min number of sectors is 3 and the min number of stacks are 2.
// The default up axis is +Y axis. You can change the up axis with setUpAxis():
// X=1, Y=2, Z=3.
//
//  AUTHOR: Song Ho Ahn (song.ahn@gmail.com)
// CREATED: 2017-11-01
// UPDATED: 2023-03-11
///////////////////////////////////////////////////////////////////////////////
const MIN_SECTOR_COUNT = 3;
const MIN_STACK_COUNT = 2;
export class Sphere {
    constructor(radius = 1.0, sectorCount = 36, stackCount = 18, smooth = true, up = 2) {
        this.set(radius, sectorCount, stackCount, smooth, up);
    }
    set(radius, sectors, stacks, smooth, up) {
        if (radius > 0)
            this.radius = radius;
        this.sectorCount = sectors;
        if (sectors < MIN_SECTOR_COUNT)
            this.sectorCount = MIN_SECTOR_COUNT;
        this.stackCount = stacks;
        if (stacks < MIN_STACK_COUNT)
            this.stackCount = MIN_STACK_COUNT;
        this.smooth = smooth;
        this.upAxis = up;
        if (up < 1 || up > 3)
            this.upAxis = 2;
        if (smooth)
            this.buildVerticesSmooth();
        else
            this.buildVerticesFlat();
    }
    buildF32() {
        this.verticesF32 = new Float32Array(this.vertices.length);
        this.vertices.forEach((value, index) => {
            this.verticesF32[index] = value;
        });
        this.normalsF32 = new Float32Array(this.normals.length);
        this.normals.forEach((value, index) => {
            this.normalsF32[index] = value;
        });
        this.texCoordsF32 = new Float32Array(this.texCoords.length);
        this.texCoords.forEach((value, index) => {
            this.texCoordsF32[index] = value;
        });
        this.indicesU32 = new Uint32Array(this.indices.length);
        this.indices.forEach((value, index) => {
            this.indicesU32[index] = value;
        });
    }
    ///////////////////////////////////////////////////////////////////////////////
    // build vertices of sphere with smooth shading using parametric equation
    // x = r * cos(u) * cos(v)
    // y = r * cos(u) * sin(v)
    // z = r * sin(u)
    // where u: stack(latitude) angle (-90 <= u <= 90)
    //       v: sector(longitude) angle (0 <= v <= 360)
    ///////////////////////////////////////////////////////////////////////////////
    buildVerticesSmooth() {
        // clear memory of prev arrays
        this.clearArrays();
        let x, y, z, xy; // vertex position
        let nx, ny, nz;
        let lengthInv = 1.0 / this.radius; // normal
        let s, t; // texCoord
        let sectorStep = 2 * Math.PI / this.sectorCount;
        let stackStep = Math.PI / this.stackCount;
        let sectorAngle, stackAngle;
        for (let i = 0; i <= this.stackCount; ++i) {
            stackAngle = Math.PI / 2 - i * stackStep; // starting from pi/2 to -pi/2
            xy = this.radius * Math.cos(stackAngle); // r * cos(u)
            z = this.radius * Math.sin(stackAngle); // r * sin(u)
            // add (sectorCount+1) vertices per stack
            // the first and last vertices have same position and normal, but different tex coords
            for (let j = 0; j <= this.sectorCount; ++j) {
                sectorAngle = j * sectorStep; // starting from 0 to 2pi
                // vertex position
                x = xy * Math.cos(sectorAngle); // r * cos(u) * cos(v)
                y = xy * Math.sin(sectorAngle); // r * cos(u) * sin(v)
                this.addVertex(x, y, z);
                // normalized vertex normal
                nx = x * lengthInv;
                ny = y * lengthInv;
                nz = z * lengthInv;
                this.addNormal(nx, ny, nz);
                // vertex tex coord between [0, 1]
                s = j / this.sectorCount;
                t = i / this.stackCount;
                this.addTexCoord(s, t);
            }
        }
        // indices
        //  k1--k1+1
        //  |  / |
        //  | /  |
        //  k2--k2+1
        let k1, k2;
        for (let i = 0; i < this.stackCount; ++i) {
            k1 = i * (this.sectorCount + 1); // beginning of current stack
            k2 = k1 + this.sectorCount + 1; // beginning of next stack
            for (let j = 0; j < this.sectorCount; ++j, ++k1, ++k2) {
                // 2 triangles per sector excluding 1st and last stacks
                if (i != 0) {
                    this.addIndices(k1, k2, k1 + 1); // k1---k2---k1+1
                }
                if (i != (this.stackCount - 1)) {
                    this.addIndices(k1 + 1, k2, k2 + 1); // k1+1---k2---k2+1
                }
                // vertical lines for all stacks
                this.lineIndices.push(k1);
                this.lineIndices.push(k2);
                if (i != 0) {
                    // horizontal lines except 1st stack
                    this.lineIndices.push(k1);
                    this.lineIndices.push(k1 + 1);
                }
            }
        }
        // generate interleaved vertex array as well
        this.buildInterleavedVertices();
        this.reverseNormals();
        this.buildF32();
        // change up axis from Y-axis to the given
        if (this.upAxis != 2)
            this.changeUpAxis(2, this.upAxis);
    }
    ///////////////////////////////////////////////////////////////////////////////
    // generate vertices with flat shading
    // each triangle is independent (no shared vertices)
    ///////////////////////////////////////////////////////////////////////////////
    buildVerticesFlat() {
        // tmp vertex definition (x,y,z,s,t)
        let tmpVertices = [];
        let sectorStep = 2 * Math.PI / this.sectorCount;
        let stackStep = Math.PI / this.stackCount;
        let sectorAngle, stackAngle;
        // compute all vertices first, each vertex contains (x,y,z,s,t) except normal
        for (let i = 0; i <= this.stackCount; ++i) {
            stackAngle = Math.PI / 2 - i * stackStep; // starting from pi/2 to -pi/2
            let xy = this.radius * Math.cos(stackAngle); // r * cos(u)
            let z = this.radius * Math.sin(stackAngle); // r * sin(u)
            // add (sectorCount+1) vertices per stack
            // the first and last vertices have same position and normal, but different tex coords
            for (let j = 0; j <= this.sectorCount; ++j) {
                sectorAngle = j * sectorStep; // starting from 0 to 2pi
                let vertex = {
                    x: xy * Math.cos(sectorAngle),
                    y: xy * Math.sin(sectorAngle),
                    z: z,
                    s: j / this.sectorCount,
                    t: i / this.stackCount
                };
                tmpVertices.push(vertex);
            }
        }
        // clear memory of prev arrays
        this.clearArrays();
        let n; // 1 face normal
        let i, j, k, vi1, vi2;
        let index = 0; // index for vertex
        for (i = 0; i < this.stackCount; ++i) {
            vi1 = i * (this.sectorCount + 1); // index of tmpVertices
            vi2 = (i + 1) * (this.sectorCount + 1);
            for (j = 0; j < this.sectorCount; ++j, ++vi1, ++vi2) {
                // get 4 vertices per sector
                //  v1--v3
                //  |    |
                //  v2--v4
                let v1 = tmpVertices[vi1];
                let v2 = tmpVertices[vi2];
                let v3 = tmpVertices[vi1 + 1];
                let v4 = tmpVertices[vi2 + 1];
                // if 1st stack and last stack, store only 1 triangle per sector
                // otherwise, store 2 triangles (quad) per sector
                if (i == 0) {
                    // a triangle for first stack ==========================
                    // put a triangle
                    this.addVertex(v1.x, v1.y, v1.z);
                    this.addVertex(v2.x, v2.y, v2.z);
                    this.addVertex(v4.x, v4.y, v4.z);
                    // put tex coords of triangle
                    this.addTexCoord(v1.s, v1.t);
                    this.addTexCoord(v2.s, v2.t);
                    this.addTexCoord(v4.s, v4.t);
                    // put normal
                    n = this.computeFaceNormal(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v4.x, v4.y, v4.z);
                    for (k = 0; k < 3; ++k) // same normals for 3 vertices
                     {
                        this.addNormal(n[0], n[1], n[2]);
                    }
                    // put indices of 1 triangle
                    this.addIndices(index, index + 1, index + 2);
                    // indices for line (first stack requires only vertical line)
                    this.lineIndices.push(index);
                    this.lineIndices.push(index + 1);
                    index += 3; // for next
                }
                else if (i == (this.stackCount - 1)) {
                    // a triangle for last stack =========
                    // put a triangle
                    this.addVertex(v1.x, v1.y, v1.z);
                    this.addVertex(v2.x, v2.y, v2.z);
                    this.addVertex(v3.x, v3.y, v3.z);
                    // put tex coords of triangle
                    this.addTexCoord(v1.s, v1.t);
                    this.addTexCoord(v2.s, v2.t);
                    this.addTexCoord(v3.s, v3.t);
                    // put normal
                    n = this.computeFaceNormal(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
                    for (k = 0; k < 3; ++k) // same normals for 3 vertices
                     {
                        this.addNormal(n[0], n[1], n[2]);
                    }
                    // put indices of 1 triangle
                    this.addIndices(index, index + 1, index + 2);
                    // indices for lines (last stack requires both vert/hori lines)
                    this.lineIndices.push(index);
                    this.lineIndices.push(index + 1);
                    this.lineIndices.push(index);
                    this.lineIndices.push(index + 2);
                    index += 3; // for next
                }
                else {
                    // 2 triangles for others ====================================
                    // put quad vertices: v1-v2-v3-v4
                    this.addVertex(v1.x, v1.y, v1.z);
                    this.addVertex(v2.x, v2.y, v2.z);
                    this.addVertex(v3.x, v3.y, v3.z);
                    this.addVertex(v4.x, v4.y, v4.z);
                    // put tex coords of quad
                    this.addTexCoord(v1.s, v1.t);
                    this.addTexCoord(v2.s, v2.t);
                    this.addTexCoord(v3.s, v3.t);
                    this.addTexCoord(v4.s, v4.t);
                    // put normal
                    n = this.computeFaceNormal(v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z);
                    for (k = 0; k < 4; ++k) // same normals for 4 vertices
                     {
                        this.addNormal(n[0], n[1], n[2]);
                    }
                    // put indices of quad (2 triangles)
                    this.addIndices(index, index + 1, index + 2);
                    this.addIndices(index + 2, index + 1, index + 3);
                    // indices for lines
                    this.lineIndices.push(index);
                    this.lineIndices.push(index + 1);
                    this.lineIndices.push(index);
                    this.lineIndices.push(index + 2);
                    index += 4; // for next
                }
            }
        }
        // generate interleaved vertex array as well
        this.buildInterleavedVertices();
        this.reverseNormals();
        this.buildF32();
        // change up axis from Y-axis to the given
        if (this.upAxis != 2)
            this.changeUpAxis(2, this.upAxis);
    }
    clearArrays() {
        this.vertices = [];
        this.normals = [];
        this.texCoords = [];
        this.indices = [];
        this.lineIndices = [];
    }
    ///////////////////////////////////////////////////////////////////////////////
    // generate interleaved vertices: V/N/T
    // stride must be 32 bytes
    ///////////////////////////////////////////////////////////////////////////////
    buildInterleavedVertices() {
        this.interleavedVertices = [];
        let i, j;
        let count = this.vertices.length;
        for (i = 0, j = 0; i < count; i += 3, j += 2) {
            this.interleavedVertices.push(this.vertices[i]);
            this.interleavedVertices.push(this.vertices[i + 1]);
            this.interleavedVertices.push(this.vertices[i + 2]);
            this.interleavedVertices.push(this.normals[i]);
            this.interleavedVertices.push(this.normals[i + 1]);
            this.interleavedVertices.push(this.normals[i + 2]);
            this.interleavedVertices.push(this.texCoords[j]);
            this.interleavedVertices.push(this.texCoords[j + 1]);
        }
    }
    ///////////////////////////////////////////////////////////////////////////////
    // transform vertex/normal (x,y,z) coords
    // assume from/to values are validated: 1~3 and from != to
    ///////////////////////////////////////////////////////////////////////////////
    changeUpAxis(from, to) {
        // initial transform matrix cols
        let tx = [1.0, 0.0, 0.0]; // x-axis (left)
        let ty = [0.0, 1.0, 0.0]; // y-axis (up)
        let tz = [0.0, 0.0, 1.0]; // z-axis (forward)
        // X -> Y
        if (from == 1 && to == 2) {
            tx[0] = 0.0;
            tx[1] = 1.0;
            ty[0] = -1.0;
            ty[1] = 0.0;
        }
        // X -> Z
        else if (from == 1 && to == 3) {
            tx[0] = 0.0;
            tx[2] = 1.0;
            tz[0] = -1.0;
            tz[2] = 0.0;
        }
        // Y -> X
        else if (from == 2 && to == 1) {
            tx[0] = 0.0;
            tx[1] = -1.0;
            ty[0] = 1.0;
            ty[1] = 0.0;
        }
        // Y -> Z
        else if (from == 2 && to == 3) {
            ty[1] = 0.0;
            ty[2] = 1.0;
            tz[1] = -1.0;
            tz[2] = 0.0;
        }
        //  Z -> X
        else if (from == 3 && to == 1) {
            tx[0] = 0.0;
            tx[2] = -1.0;
            tz[0] = 1.0;
            tz[2] = 0.0;
        }
        // Z -> Y
        else {
            ty[1] = 0.0;
            ty[2] = -1.0;
            tz[1] = 1.0;
            tz[2] = 0.0;
        }
        let i, j;
        let count = this.vertices.length;
        let vx, vy, vz;
        let nx, ny, nz;
        for (i = 0, j = 0; i < count; i += 3, j += 8) {
            // transform vertices
            vx = this.vertices[i];
            vy = this.vertices[i + 1];
            vz = this.vertices[i + 2];
            this.vertices[i] = tx[0] * vx + ty[0] * vy + tz[0] * vz; // x
            this.vertices[i + 1] = tx[1] * vx + ty[1] * vy + tz[1] * vz; // y
            this.vertices[i + 2] = tx[2] * vx + ty[2] * vy + tz[2] * vz; // z
            // transform normals
            nx = this.normals[i];
            ny = this.normals[i + 1];
            nz = this.normals[i + 2];
            this.normals[i] = tx[0] * nx + ty[0] * ny + tz[0] * nz; // nx
            this.normals[i + 1] = tx[1] * nx + ty[1] * ny + tz[1] * nz; // ny
            this.normals[i + 2] = tx[2] * nx + ty[2] * ny + tz[2] * nz; // nz
            // transform interleaved array
            this.interleavedVertices[j] = this.vertices[i];
            this.interleavedVertices[j + 1] = this.vertices[i + 1];
            this.interleavedVertices[j + 2] = this.vertices[i + 2];
            this.interleavedVertices[j + 3] = this.normals[i];
            this.interleavedVertices[j + 4] = this.normals[i + 1];
            this.interleavedVertices[j + 5] = this.normals[i + 2];
        }
    }
    ///////////////////////////////////////////////////////////////////////////////
    // add single vertex to array
    ///////////////////////////////////////////////////////////////////////////////
    addVertex(x, y, z) {
        this.vertices.push(x);
        this.vertices.push(y);
        this.vertices.push(z);
    }
    ///////////////////////////////////////////////////////////////////////////////
    // add single normal to array
    ///////////////////////////////////////////////////////////////////////////////
    addNormal(nx, ny, nz) {
        this.normals.push(nx);
        this.normals.push(ny);
        this.normals.push(nz);
    }
    ///////////////////////////////////////////////////////////////////////////////
    // add single texture coord to array
    ///////////////////////////////////////////////////////////////////////////////
    addTexCoord(s, t) {
        this.texCoords.push(s);
        this.texCoords.push(t);
    }
    ///////////////////////////////////////////////////////////////////////////////
    // add 3 indices to array
    ///////////////////////////////////////////////////////////////////////////////
    addIndices(i1, i2, i3) {
        this.indices.push(i1);
        this.indices.push(i2);
        this.indices.push(i3);
    }
    ///////////////////////////////////////////////////////////////////////////////
    // return face normal of a triangle v1-v2-v3
    // if a triangle has no surface (normal length = 0), then return a zero vector
    ///////////////////////////////////////////////////////////////////////////////
    computeFaceNormal(x1, y1, z1, // v1
    x2, y2, z2, // v2
    x3, y3, z3) {
        const EPSILON = 0.000001;
        let normal = [0.0, 0.0, 0.0]; // default return value (0,0,0)
        let nx, ny, nz;
        // find 2 edge vectors: v1-v2, v1-v3
        let ex1 = x2 - x1;
        let ey1 = y2 - y1;
        let ez1 = z2 - z1;
        let ex2 = x3 - x1;
        let ey2 = y3 - y1;
        let ez2 = z3 - z1;
        // cross product: e1 x e2
        nx = ey1 * ez2 - ez1 * ey2;
        ny = ez1 * ex2 - ex1 * ez2;
        nz = ex1 * ey2 - ey1 * ex2;
        // normalize only if the length is > 0
        let length = Math.sqrt(nx * nx + ny * ny + nz * nz);
        if (length > EPSILON) {
            // normalize
            let lengthInv = 1.0 / length;
            normal[0] = nx * lengthInv;
            normal[1] = ny * lengthInv;
            normal[2] = nz * lengthInv;
        }
        return normal;
    }
    getVertices() {
        return this.verticesF32;
    }
    getNormals() {
        return this.normalsF32;
    }
    getTexCoords() {
        return this.texCoordsF32;
    }
    getIndices() {
        return this.indicesU32;
    }
    ///////////////////////////////////////////////////////////////////////////////
    // flip the face normals to opposite directions
    ///////////////////////////////////////////////////////////////////////////////
    reverseNormals() {
        let i, j;
        let count = this.normals.length;
        for (i = 0, j = 3; i < count; i += 3, j += 8) {
            this.normals[i] *= -1;
            this.normals[i + 1] *= -1;
            this.normals[i + 2] *= -1;
            // update interleaved array
            this.interleavedVertices[j] = this.normals[i];
            this.interleavedVertices[j + 1] = this.normals[i + 1];
            this.interleavedVertices[j + 2] = this.normals[i + 2];
        }
        // also reverse triangle windings
        let tmp;
        count = this.indices.length;
        for (i = 0; i < count; i += 3) {
            tmp = this.indices[i];
            this.indices[i] = this.indices[i + 2];
            this.indices[i + 2] = tmp;
        }
    }
}
//# sourceMappingURL=Sphere.js.map