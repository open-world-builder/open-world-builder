    precision highp float;

    // Attributes
    attribute vec3 position;
    attribute vec2 uv;

    // Uniforms
    uniform mat4 worldViewProjection;

    // Varyings
    varying vec2 vUV;
varying vec3 vWorldPositionDe;

  #include<instancesDeclaration>
 uniform mat4 viewProjection;



  void main(void) {
  #include<instancesVertex>
        gl_Position = worldViewProjection * vec4(position, 1.0);
        //   vWorldPositionDe = position; // Assuming this is in world space; otherwise, transform it to world space.

        vUV = uv;
    }