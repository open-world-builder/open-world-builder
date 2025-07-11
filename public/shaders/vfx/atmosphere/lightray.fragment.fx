    precision highp float;

    // Varyings
    varying vec2 vUV;
varying vec3 vWorldPositionDe;

    // Uniforms
    uniform sampler2D textureSampler;
    uniform float time;

    uniform vec3 color1; // = vec3(1.0, 0.7, 0.0); // Yellow
uniform vec3 color2; // = vec3(1.0, 0.2, 0.0); // Orange
uniform float colorBlendFactor;
float alpha = 0.5;

    void main(void) {
        // Scroll the texture vertically over time
        vec2 uv = vUV;
        uv.y -= time/2.0; //add ramdon offset 

        // Sample the texture
        vec4 baseColor = texture2D(textureSampler, uv);
        
             // Interpolate between yellow and orange based on the colorBlendFactor
    vec3 blendedColor = mix(color1, color2, colorBlendFactor);

    //   vec4 blendedColor = mix(color1, color2, colorBlendFactor);
//    vec4 finalColor = vec4(baseColor.rgb * blendedColor.rgb, baseColor.a * blendedColor.a);

    // Multiply the base texture with the interpolated color
    vec4 finalColor = vec4(baseColor.rgb * blendedColor, alpha);
    
        
        gl_FragColor = finalColor;
        
        // if (gl_FragColor.a < 0.1) {
        //     discard;
        // }

        // color.a = color.r;
        // color.a = color.a * 0.1;
        // color.rgb = color.rgb * 1.0;

        // gl_FragColor.rgb  = gl_FragColor.rgb * 0.9; 
        
        gl_FragColor.a = baseColor.a * 0.1;
        // gl_FragColor = color;
    }