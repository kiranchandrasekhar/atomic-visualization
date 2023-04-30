export const electronVSText = `
    precision mediump float;

    uniform vec3 uLightPos;    
    uniform mat4 uView;
    uniform mat4 uProj;
    uniform float uTime;
    uniform float uRadius;
    uniform float uCutaway;
    uniform float uShading;
    uniform float uGradient;

    uniform vec3 uNLM;
    
    attribute vec3 aNorm;
    attribute vec3 aVertPos;
    attribute vec4 aOffset;
    
    varying vec4 normal;
    varying vec4 wsPos;

    float random (in vec2 pt, in float seed) {
        return fract(sin( (seed + dot(pt.xy, vec2(12.9898,78.233))))*43758.5453123);
    }
        
    vec3 unit_vec(in vec3 xyz, in float seed) {
        //pi = 3.14159265358
        float phiSeed = random(xyz.xz, seed);
        float phi =   6.28318530718 * random(xyz.yz, phiSeed);
        float theta = 6.28318530718 * random(xyz.xy, seed);
        return vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));
    }

    //Compute the new position of the "electron" at the given timestamp
    vec2 computePosition(in vec2 xy, in float time) {
        float c1 = xy.y;
        float c2 = xy.x;

        float r_squared = length(xy) * length(xy);

        //This is done using a closed-form formula for position 
        //derived from Bohmian trajectories for velocity
        float x = -c1 * sin(time / r_squared) + c2 * cos(time / r_squared);
        float y = c1 * cos(time / r_squared) + c2 * sin(time / r_squared);
        return vec2(x, y);
    }

    void main () {
        //Modify the offset by some slight noise to avoid grid artifacts
        vec3 noise = unit_vec(aOffset.xyz, 0.23129164);
        noise -= vec3(0.5, 0.5, 0.5);
        vec3 noiseOff = aOffset.xyz + noise;

        vec2 currentPos = computePosition(noiseOff.xy, uTime);

        vec4 offset = vec4(currentPos.x, currentPos.y, noiseOff.z, 1.0);
        if(uNLM.y == 0.0 || uNLM.z == 0.0) {
            //l or m are 0, no motion
            offset = vec4(noiseOff, 1.0);
        } 

        if(uNLM.z < 0.0) { 
            //m is negative, reverse motion
            offset = vec4(currentPos.y, currentPos.x, noiseOff.z, 1.0);
        }

        vec4 vertPos = vec4(aVertPos.xyz, 1.0);
        wsPos = vertPos + offset;

        gl_Position = uProj * uView * (wsPos);

        normal = vec4(aNorm.xyz, 0.0);
        normal = normalize(normal);
    }
`;
export const electronFSText = `
    precision mediump float;

    uniform vec3 uLightPos;
    uniform float uRadius;
    uniform float uCutaway;
    uniform float uShading;
    uniform float uGradient;
    
    varying vec4 normal;
    varying vec4 wsPos;

    //Interpolate matplotlib Viridis gradient
    vec3 viridis(float t) {
        const vec3 c0 = vec3(0.2777273272234177, 0.005407344544966578, 0.3340998053353061);
        const vec3 c1 = vec3(0.1050930431085774, 1.404613529898575, 1.384590162594685);
        const vec3 c2 = vec3(-0.3308618287255563, 0.214847559468213, 0.09509516302823659);
        const vec3 c3 = vec3(-4.634230498983486, -5.799100973351585, -19.33244095627987);
        const vec3 c4 = vec3(6.228269936347081, 14.17993336680509, 56.69055260068105);
        const vec3 c5 = vec3(4.776384997670288, -13.74514537774601, -65.35303263337234);
        const vec3 c6 = vec3(-5.435455855934631, 4.645852612178535, 26.3124352495832);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    
    }
    
    //Interpolate matplotlib plasma gradient
    vec3 plasma(float t) {
        const vec3 c0 = vec3(0.05873234392399702, 0.02333670892565664, 0.5433401826748754);
        const vec3 c1 = vec3(2.176514634195958, 0.2383834171260182, 0.7539604599784036);
        const vec3 c2 = vec3(-2.689460476458034, -7.455851135738909, 3.110799939717086);
        const vec3 c3 = vec3(6.130348345893603, 42.3461881477227, -28.51885465332158);
        const vec3 c4 = vec3(-11.10743619062271, -82.66631109428045, 60.13984767418263);
        const vec3 c5 = vec3(10.02306557647065, 71.41361770095349, -54.07218655560067);
        const vec3 c6 = vec3(-3.658713842777788, -22.93153465461149, 18.19190778539828);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    }
    
    //Interpolate magma plasma gradient
    vec3 magma(float t) {
        const vec3 c0 = vec3(-0.002136485053939582, -0.000749655052795221, -0.005386127855323933);
        const vec3 c1 = vec3(0.2516605407371642, 0.6775232436837668, 2.494026599312351);
        const vec3 c2 = vec3(8.353717279216625, -3.577719514958484, 0.3144679030132573);
        const vec3 c3 = vec3(-27.66873308576866, 14.26473078096533, -13.64921318813922);
        const vec3 c4 = vec3(52.17613981234068, -27.94360607168351, 12.94416944238394);
        const vec3 c5 = vec3(-50.76852536473588, 29.04658282127291, 4.23415299384598);
        const vec3 c6 = vec3(18.65570506591883, -11.48977351997711, -5.601961508734096);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    }
    
    //Interpolate inferno plasma gradient
    vec3 inferno(float t) {
    
        const vec3 c0 = vec3(0.0002189403691192265, 0.001651004631001012, -0.01948089843709184);
        const vec3 c1 = vec3(0.1065134194856116, 0.5639564367884091, 3.932712388889277);
        const vec3 c2 = vec3(11.60249308247187, -3.972853965665698, -15.9423941062914);
        const vec3 c3 = vec3(-41.70399613139459, 17.43639888205313, 44.35414519872813);
        const vec3 c4 = vec3(77.162935699427, -33.40235894210092, -81.80730925738993);
        const vec3 c5 = vec3(-71.31942824499214, 32.62606426397723, 73.20951985803202);
        const vec3 c6 = vec3(25.13112622477341, -12.24266895238567, -23.07032500287172);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    }
    
    //Interpolate turbo plasma gradient
    vec3 turbo(float t) {
        const vec3 c0 = vec3(0.1140890109226559, 0.06288340699912215, 0.2248337216805064);
        const vec3 c1 = vec3(6.716419496985708, 3.182286745507602, 7.571581586103393);
        const vec3 c2 = vec3(-66.09402360453038, -4.9279827041226, -10.09439367561635);
        const vec3 c3 = vec3(228.7660791526501, 25.04986699771073, -91.54105330182436);
        const vec3 c4 = vec3(-334.8351565777451, -69.31749712757485, 288.5858850615712);
        const vec3 c5 = vec3(218.7637218434795, 67.52150567819112, -305.2045772184957);
        const vec3 c6 = vec3(-52.88903478218835, -21.54527364654712, 110.5174647748972);
    
        return c0+t*(c1+t*(c2+t*(c3+t*(c4+t*(c5+t*c6)))));
    }
    
    void main() {
        //If within cutaway range and cutaway is enabled, don't render this point
        if(uCutaway > 0.0 && wsPos.x > 0.0 && wsPos.y > 0.0) {
            discard;
        }

        //Grab distance and normalize based on maximum distance
        float dist = length(wsPos.xyz - vec3(0.0, 0.0, 0.0));
        dist /= uRadius;
        dist = 1.0 - dist;

        //Interpolate correct gradient with distance
        vec3 kd = vec3(0.0, 0.0, 0.0);
        if(uGradient == 0.0) {
            kd = clamp(inferno(dist), 0.0, 1.0);
        } else if(uGradient == 1.0) {
            kd = clamp(turbo(dist), 0.0, 1.0);
        } else if (uGradient == 2.0) {
            kd = clamp(viridis(dist), 0.0, 1.0);
        } else if (uGradient == 3.0) {
            kd = clamp(magma(dist), 0.0, 1.0);
        } else {
            kd = clamp(plasma(dist), 0.0, 1.0);
        }

        if(uShading > 0.0) {
            /* Compute light fall off */
            vec3 ka = vec3(0.1, 0.1, 0.1);

            vec4 lightPos = vec4(uLightPos, 1.0);
            vec4 lightDirection = lightPos - wsPos;
            float dot_nl = dot(normalize(lightDirection), normalize(normal));
            dot_nl = clamp(dot_nl, 0.0, 1.0);

            vec3 color = ka + dot_nl * kd;
            
            lightPos = vec4(0.0, 0.0, 0.0, 1.0);
            lightDirection = lightPos - wsPos;
            dot_nl = dot(normalize(lightDirection), normalize(normal));
            dot_nl = clamp(dot_nl, 0.0, 1.0);

            color += dot_nl * kd;

            lightPos = vec4(0.0, 1000.0, 0.0, 1.0);
            lightDirection = lightPos - wsPos;
            dot_nl = dot(normalize(lightDirection), normalize(normal));
            dot_nl = clamp(dot_nl, 0.0, 1.0);

            color += dot_nl * kd;
        
            gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
        } else {
            gl_FragColor = vec4(kd, 1.0);
        }
    }
`;
//# sourceMappingURL=Shaders.js.map