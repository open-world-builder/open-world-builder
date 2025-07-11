export class SplatMapMaterial extends BABYLON.CustomMaterial {
  constructor(name, scene) {
    super(name, scene);

    // Add uniforms for the splat map and the three textures.
    // "sampler2D" type is used for textures.
    this.AddUniform("splatTexture", "sampler2D");
    this.AddUniform("texture1", "sampler2D");
    this.AddUniform("texture2", "sampler2D");
    this.AddUniform("texture3", "sampler2D");
    this.AddUniform("uSymbolsTexture", "sampler2D");
    this.AddUniform("splatmapSampler", "sampler2D");

    // Add uniforms for the UV scales (vec2).
    this.AddUniform("texture1Scale", "vec2", new BABYLON.Vector2(100, 100));
    this.AddUniform("texture2Scale", "vec2", new BABYLON.Vector2(100, 100));
    this.AddUniform("texture3Scale", "vec2", new BABYLON.Vector2(100, 100));

    this.AddUniform("selectionCenter", "vec2", new BABYLON.Vector2(0, 0));
    this.AddUniform("selectionRadius", "float", 0.1);
    this.AddUniform("edgeSoftness", "float", 0.1);
    this.AddUniform("circleColor", "vec3", new BABYLON.Vector3(0.23, 1.0, 0));

    this.AddUniform("time", "float", 0);

    this.AddAttribute("uv");
    this.Vertex_Definitions(`
      varying vec2 vUV;
  `);
    this.Vertex_MainBegin(`
      vUV = uv;
  `);

    this.diffuseColor = new BABYLON.Color3(1, 1, 1);

    // Assign a dummy diffuse texture to ensure vUV is defined.
    // this.diffuseTexture = new BABYLON.Texture(, scene);

    // Inject custom fragment code to override the albedo (diffuse) calculation.
    // This code will sample the splat map and then blend three textures accordingly.
    this.Fragment_Custom_Diffuse(`
      // vec4 txt = texture2D(texture1, vDiffuseUV * texture1Scale);
      // diffuseColor = txt.rgb;
  
      // vec4 splat = texture2D(splatTexture, vDiffuseUV);
      vec4 lightmapTex = texture2D(splatmapSampler, vDiffuseUV);
      
      // // Sample each texture with its own UV scale
      vec4 tex1 = texture2D(texture1, vDiffuseUV * texture1Scale);
      vec4 tex2 = texture2D(texture2, vDiffuseUV * texture2Scale);
      vec4 tex3 = texture2D(texture3, vDiffuseUV * texture3Scale);
      
      // // // // Blend the textures based on the splatmap's red, green, and blue channels
      // vec4 finalColor = tex1 * splat.r + tex2 * splat.g + tex3 * splat.b;
      vec4 finalBlend = tex1 * lightmapTex.r + tex2 * lightmapTex.g + tex3 * lightmapTex.b;
      diffuseColor = finalBlend.rgb;
  
         // Compute the distance from the current UV to the selection circle center.
        // float dist = distance(vDiffuseUV, selectionCenter);
            // float circleMask = smoothstep(selectionRadius, selectionRadius - edgeSoftness, dist);
            // vec3 finalBlendCircle = mix(circleColor, finalBlend.rgb, circleMask);
  
      // diffuseColor = finalBlendCircle;
      // finalColor
        `);

    // Compute distance from current UV coordinate to the selection center
    this.Fragment_Before_FragColor(`
    float dist = distance(vDiffuseUV, selectionCenter);
    
    // Create rotation matrix based on time
    float rotationSpeed = 0.5;
    float rotation = time * rotationSpeed;
    mat2 rotMat = mat2(
      cos(rotation), -sin(rotation),
      sin(rotation), cos(rotation)
    );
  
    // Get vector from center and rotate it
    vec2 fromCenter = rotMat * (vDiffuseUV - selectionCenter);
    
    // Map to texture coordinates (assuming square texture)
    vec2 texCoord = fromCenter / selectionRadius * 0.5 + 0.5;
    
    // Sample the symbol texture
    vec4 symbolsTexture = texture2D(uSymbolsTexture, texCoord);
    
    // Combine with glow effect
    float glowMask = 1.0 - smoothstep(selectionRadius - edgeSoftness, selectionRadius, dist);
    color.rgb = mix(color.rgb, circleColor, glowMask * symbolsTexture.r);
      `);
  }
}
