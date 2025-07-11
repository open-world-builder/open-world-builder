// Incharge of streaming assets in the scene

// calls get_objects_in_range everytime, every time distance difference is greater than 100 units, since last call

//load all new assets with assetIdfrom asset manager, then

// if the object is not in the scene, load it

// if the object is in the scene, unload it

class ThreeTextureBlendMaterial extends window.BABYLON.CustomMaterial {
  constructor(name: any, scene: any) {
    super(name, scene);

    // Define textures and their properties
    this.baseTexture = null;
    this.overlayTexture1 = null;
    this.overlayTexture2 = null;
    this.heightMap1 = null;
    this.heightMap2 = null;

    // Tiling settings
    this.baseTiling = new window.BABYLON.Vector2(1, 1);
    this.overlay1Tiling = new window.BABYLON.Vector2(1, 1);
    this.overlay2Tiling = new window.BABYLON.Vector2(1, 1);

    // Register uniforms and samplers
    this.AddUniform("baseTiling", "vec2");
    this.AddUniform("overlay1Tiling", "vec2");
    this.AddUniform("overlay2Tiling", "vec2");

    this.AddUniform("heightMap1Tiling", "vec2");
    this.AddUniform("heightMap2Tiling", "vec2");

    this.AddUniform("baseTexture", "sampler2D");
    this.AddUniform("overlayTexture1", "sampler2D");
    this.AddUniform("overlayTexture2", "sampler2D");
    this.AddUniform("heightMap1", "sampler2D");
    this.AddUniform("heightMap2", "sampler2D");

    this.AddUniform("ambientColor", "vec3");

    this.AddUniform("heightBlendStart", "float");
    this.AddUniform("heightBlendEnd", "float");

    this.AddUniform("heightMapStrength", "float");
    this.AddUniform("heightMapStrength2", "float");

    this.AddUniform("noiseScale", "float"); // Control noise frequency
    this.AddUniform("noiseStrength", "float"); // Control noise intensity

    this.AddUniform("ambientAmount", "float");

    this.AddAttribute("uv");
    this.AddAttribute("position");
    this.Vertex_Definitions(`
        varying vec2 vUV;
        // varying vec3 vPosition;
    `);
    this.Vertex_MainBegin(`
        vUV = uv;
        // vPosition = position;
    `);

    this.Fragment_Definitions(`
        // Fast smooth noise function
        vec2 hash22(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
            p3 += dot(p3, p3.yzx+33.33);
            return fract((p3.xx+p3.yz)*p3.zy);
        }

        float smoothNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            
            // Smooth interpolation
            vec2 u = f * f * (3.0 - 2.0 * f);
            
            // Sample 4 corners
            float a = dot(hash22(i), f);
            float b = dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0));
            float c = dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0));
            float d = dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0));
            
            // Interpolate
            return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
    `);

    this.Fragment_Custom_Diffuse(`
                vec4 baseLayerColor = texture2D(baseTexture, vDiffuseUV * baseTiling);
                vec4 overlay1LayerColor = texture2D(overlayTexture1, vDiffuseUV * overlay1Tiling);
                vec4 overlay2LayerColor = texture2D(overlayTexture2, vDiffuseUV * overlay2Tiling);

                diffuseColor = baseLayerColor.rgb;


                           float blendFactor;
     
                // Use vertical position for blending
                blendFactor = smoothstep(heightBlendStart, heightBlendEnd, vPositionW.y);
                    
                //Debug vertical position blending
                vec3 red = vec3(1.0, 0.0, 0.0);
                vec3 blue = vec3(0.0, 0.0, 1.0);
                //   diffuseColor = mix(red, blue, blendFactor);


                    // float height1 = texture2D(heightMap1, vDiffuseUV * heightMap1Tiling).r * heightMapStrength;
          
                      // Generate noise
                float noise = smoothNoise(vDiffuseUV * noiseScale);
                noise = noise * 2.0 - 1.0; // Convert to -1 to 1 range
             
                    float height1 = texture2D(heightMap1, vDiffuseUV *heightMap1Tiling).r;
                  height1 = height1 + (noise * noiseStrength);
                height1 = clamp(height1 * heightMapStrength, 0.0, 1.0);
            
              
                  // First blend overlay1 based on its height map
                diffuseColor = mix(diffuseColor.rgb, overlay1LayerColor.rgb, height1);
                
                
      float height2 = texture2D(heightMap2, vDiffuseUV * heightMap2Tiling).r * heightMapStrength2;
      diffuseColor = mix(diffuseColor.rgb, overlay2LayerColor.rgb, height2 * blendFactor);
                //   diffuseColor = mix(diffuseColor.rgb, overlay2LayerColor.rgb, blendFactor);

            `);

    this.Fragment_Before_FragColor(`


          
            vec3 customAmbient = diffuseColor.rgb;
            color.rgb = mix(color.rgb, customAmbient, ambientAmount);
            
            
            // color.rgb = diffuseColor.rgb * ambientColor;
        `);

    // // Create the custom shader
    // this.CustomParts.Fragment_Begin = `
    //         // Additional varyings and uniforms
    //         // uniform sampler2D baseTexture;
    //         // uniform sampler2D overlayTexture1;
    //         // uniform sampler2D overlayTexture2;
    //         // uniform sampler2D heightMap1;
    //         // uniform sampler2D heightMap2;

    //         // uniform vec2 baseTiling;
    //         // uniform vec2 overlay1Tiling;
    //         // uniform vec2 overlay2Tiling;
    //     `;

    // this.CustomParts.Fragment_MainBegin = `
    //         // Calculate UV coordinates for each texture based on tiling
    //         // vec2 baseUV = vUV * baseTiling;
    //         // vec2 overlay1UV = vUV * overlay1Tiling;
    //         // vec2 overlay2UV = vUV * overlay2Tiling;

    //         // // Sample textures
    //         // vec4 baseColor = texture2D(baseTexture, baseUV);
    //         // vec4 overlay1Color = texture2D(overlayTexture1, overlay1UV);
    //         // vec4 overlay2Color = texture2D(overlayTexture2, overlay2UV);

    //         // // Sample height maps
    //         // float height1 = texture2D(heightMap1, vUV).r;
    //         // float height2 = texture2D(heightMap2, vUV).r;
    //     `;

    // this.CustomParts.Fragment_Custom_Diffuse = `
    //         // Blend based on height maps
    //         // vec4 finalColor = baseColor;

    //         // // Apply first overlay based on height map
    //         // finalColor = mix(finalColor, overlay1Color, height1);

    //         // // Apply second overlay based on height map
    //         // finalColor = mix(finalColor, overlay2Color, height2);

    //         // color = finalColor;
    //     `;
  }

  // Helper methods to set textures and properties
  setBaseTexture(texture: any) {
    this.baseTexture = texture;
  }

  setOverlayTexture1(texture: any) {
    this.overlayTexture1 = texture;
  }

  setOverlayTexture2(texture: any) {
    this.overlayTexture2 = texture;
  }

  setHeightMap1(texture: any) {
    this.heightMap1 = texture;
  }

  setHeightMap2(texture: any) {
    this.heightMap2 = texture;
  }

  setBaseTiling(x: any, y: any) {
    this.baseTiling.x = x;
    this.baseTiling.y = y;
  }

  setOverlay1Tiling(x: any, y: any) {
    this.overlay1Tiling.x = x;
    this.overlay1Tiling.y = y;
  }

  setOverlay2Tiling(x: any, y: any) {
    this.overlay2Tiling.x = x;
    this.overlay2Tiling.y = y;
  }

  setHeightBlendStart(value: any) {
    this.heightBlendStart = value;
  }

  setHeightBlendEnd(value: any) {
    this.heightBlendEnd = value;
  }
}

import React, { useEffect, useRef } from "react";
import { Object, EventContext } from "../module_bindings";
// /DbConnection,
// Dummy types and functions for demonstration
type Position = { x: number; y: number; z: number };
// type SceneObject = { id: string; position: Position };

// const assetManager = {
//   // Simulate async loading with a Promise
//   load: async (assetIds: string[]): Promise<void> => {
//     await Promise.all(
//       assetIds.map(
//         (id) =>
//           new Promise<void>((resolve) => {
//             // Simulate async load (replace with real loading logic)
//             setTimeout(() => {
//               console.log(`Loaded asset ${id}`);
//               resolve();
//             }, 100); // Simulate 100ms load time
//           })
//       )
//     );
//   },
//   unload: (assetId: string) => {
//     /* unload asset */
//   },
// };
const assetManager = {
  // Cache to store loaded assets
  // loadedAssets: new Map<string, any>(),
  loadedAssets: new Map<string, any>(),
  materialCache: new Map<string, any>(),

  //   material specific loads, make thse more generic

  //   createLightRayMaterial(scene: any) {
  //     const material = new window.BABYLON.ShaderMaterial(
  //       "lightRayShader",
  //       scene,
  //       {
  //         vertex: "../../../shaders/vfx/atmosphere/lightray",
  //         fragment: "../../../shaders/vfx/atmosphere/lightray",
  //       },
  //       {
  //         attributes: ["position", "uv"],
  //         uniforms: [
  //           "world",
  //           "worldView",
  //           "worldViewProjection",
  //           "time",
  //           "lightColor",
  //         ],
  //         needAlphaBlending: true,
  //       }
  //     );

  //     // Set up basic properties
  //     material.setColor3("lightColor", new window.BABYLON.Color3(1, 0.9, 0.7));
  //     material.backFaceCulling = false;

  //     // Add time animation
  //     scene.registerBeforeRender(() => {
  //       material.setFloat("time", performance.now() * 0.001);
  //     });

  //     return material;
  //   },

  createLightRayMaterial: (scene: any) => {
    const shaderMaterial = new window.BABYLON.ShaderMaterial(
      "lightRayShader",
      scene,
      {
        vertex: "/shaders/vfx/atmosphere/lightray",
        fragment: "/shaders/vfx/atmosphere/lightray",
      },
      {
        attributes: ["position", "uv"],
        uniforms: [
          "world",
          "worldView",
          "worldViewProjection",
          "view",
          "projection",
          "time",
          "lightColor",
          "speed",
          "density",
          "falloff",
        ],
        needAlphaBlending: true,
        needAlphaTesting: true,
      }
    );
    const texture = new window.BABYLON.Texture(
      "assets/util/atmosphere/lightrays/smoothLightshafts.png",
      scene
    );
    shaderMaterial.setTexture("textureSampler", texture);
    shaderMaterial.backFaceCulling = false;
    shaderMaterial.needPre = false;
    shaderMaterial.needDepthPrePass = true;
    shaderMaterial.setFloat("time", 0);
    shaderMaterial.setColor3(
      "lightColor",
      new window.BABYLON.Color3(1, 0.9, 0.7)
    );
    shaderMaterial.setFloat("speed", 1.0);
    // shaderMaterial.setFloat("density", 3.0);
    // shaderMaterial.setFloat("falloff", 2.0);

    const grassThinShader = new window.BABYLON.ShaderMaterial(
      "grass_thin",
      scene,
      {
        vertex: "/shaders/vfx/atmosphere/lightray",
        fragment: "/shaders/vfx/atmosphere/lightray",
      },
      {
        attributes: [
          "position",
          "normal",
          "uv",
          "color",
          "world0",
          "world1",
          "world2",
          "world3",
        ],
        uniforms: [
          "world",
          "worldView",
          "worldViewProjection",
          "view",
          "projection",
          "time",
          "viewProjection",
          "vFogInfos",
          "vFogColor",
          "color1",
          "color2",
          "colorBlendFactor",
        ],
        needAlphaTesting: true,
        needAlphaBlending: true,
      }
    );

    grassThinShader.setTexture("textureSampler", texture);
    grassThinShader.setArray4("world0", [1, 0, 0, 0]);
    grassThinShader.setArray4("world1", [0, 1, 0, 0]);
    grassThinShader.setArray4("world2", [0, 0, 1, 0]);
    grassThinShader.setArray4("world3", [0, 0, 0, 1]);
    grassThinShader.backFaceCulling = false;
    grassThinShader.needDepthPrePass = true;

    grassThinShader.setColor3(
      "color1",
      new window.BABYLON.Color3(0.0, 0.6, 0.4)
    ); // Yellow
    grassThinShader.setColor3(
      "color2",
      new window.BABYLON.Color3(0.0, 0.2, 0.2)
    ); // Orange
    // grassThinShader.setVector4("color1", new BABYLON.Vector4(1.0, 0.7, 0.0, 0.0));  // Yellow, fully opaque
    // grassThinShader.setVector4("color2", new BABYLON.Vector4(1.0, 0.2, 0.0, 0.0));  // Orange, slightly transparent

    grassThinShader.setFloat("colorBlendFactor", 0.6);

    scene.onBeforeRenderObservable.add(() => {
      const time = performance.now() * 0.001; // Current time in seconds
      grassThinShader.setFloat("time", time);
    });

    let time = 0;
    scene.registerBeforeRender(() => {
      time += scene.getEngine().getDeltaTime() * 0.01;
      shaderMaterial.setFloat("time", time);

      // Add oscillating blend factor
      const blendFactor = (Math.sin(time * 0.1) + 1) * 0.5; // Creates a 0-1 loop
      grassThinShader.setFloat("colorBlendFactor", blendFactor);
    });

    let debug = false;
    if (debug) {
      window.BABYLON.Tools.LoadScriptAsync(
        "https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js"
      ).then(() => {
        const gui = new window.lil.GUI({ title: "RAY" });

        const params = {
          colorBlendFactor: 0.6,
          color1: [1.0, 0.7, 0.0],
          color2: [1.0, 0.2, 0.0],
        };

        gui
          .add(params, "colorBlendFactor", 0, 1, 0.01)
          .onChange((value: any) => {
            grassThinShader.setFloat("colorBlendFactor", value);
          });

        // Add color controls
        // const color1Control = gui
        //   .addColor(params, "color1")
        //   .onChange((value: any) => {
        //     grassThinShader.setColor3(
        //       "color1",
        //       window.BABYLON.Color3.FromArray(value)
        //     );
        //   });

        // const color2Control = gui
        //   .addColor(params, "color2")
        //   .onChange((value: any) => {
        //     grassThinShader.setColor3(
        //       "color2",
        //       window.BABYLON.Color3.FromArray(value)
        //     );
        //   });
      });
    }

    return grassThinShader;
  },

  //todo should go in seperate materials files
  createAutoBlendMaterial: (scene: any) => {
    const blendMaterial = new ThreeTextureBlendMaterial("blendMaterial", scene);
    blendMaterial.diffuseTexture = new window.BABYLON.Texture(
      "/assets/textures/terrain/undefined - Imgur.png",
      scene
    );
    //   blendMaterial.ambientTexture = new BABYLON.Texture("/assets/textures/terrain/undefined - Imgur.png", scene);
    //   blendMaterial.diffuseIntensity = 10.1;
    blendMaterial.diffuseTexture.level = 2.2;
    blendMaterial.specularPower = 0.0;
    blendMaterial.specularColor = new window.BABYLON.Color3(0, 0, 0);

    // Set textures
    blendMaterial.setBaseTexture(
      new window.BABYLON.Texture(
        "/assets/env/objects/castle/modular/base_stone.png",
        scene
      )
    );
    blendMaterial.setOverlayTexture1(
      new window.BABYLON.Texture(
        "/assets/env/objects/castle/modular/stone1.png",
        scene
      )
    );
    blendMaterial.setOverlayTexture2(
      new window.BABYLON.Texture(
        "/assets/textures/terrain/grass_01_dark.png",
        scene
      )
    );
    blendMaterial.setHeightMap1(
      new window.BABYLON.Texture(
        "/assets/env/objects/castle/modular/height1.png",
        scene
      )
    );
    blendMaterial.setHeightMap2(
      new window.BABYLON.Texture(
        "/assets/textures/terrain/trees/leaf card 2.png",
        scene
      )
    );

    // Set tiling
    blendMaterial.setBaseTiling(1, 1);
    blendMaterial.setOverlay1Tiling(1, 1);
    blendMaterial.setOverlay2Tiling(1, 1);

    blendMaterial.setHeightBlendStart(-750);
    blendMaterial.setHeightBlendEnd(-819);

    let heightBlendStart = -750;
    let heightBlendEnd = -819;
    let baseTiling = 1;
    let overlay1Tiling = 1;
    let overlay2Tiling = 1;
    let diffuseIntensity = 2.2;
    let heightMapStrength = 1.0;
    let heightMapStrength2 = 5.0;
    let heightMap1TilingValue = 0.7;
    let heightMap2TilingValue = 1.6;
    let heightMap1Tiling = new window.BABYLON.Vector2(
      heightMap1TilingValue,
      heightMap1TilingValue
    );
    let heightMap2Tiling = new window.BABYLON.Vector2(
      heightMap2TilingValue,
      heightMap2TilingValue
    );
    let noiseScale = 2.0; // Control noise frequency
    let noiseStrength = -0.15;
    window.AUTOBLEND_NOISE_STRENGTH = noiseStrength;
    let ambientAmount = 0.05;
    let debug = false;
    if (debug) {
      window.BABYLON.Tools.LoadScriptAsync(
        "https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js"
      ).then(() => {
        const gui = new window.lil.GUI({ title: "Height Blend" });
        gui
          .add(blendMaterial, "heightBlendStart", -1000, 1000, 1)
          .onChange((value: any) => {
            heightBlendStart = value;
          });
        gui
          .add(blendMaterial, "heightBlendEnd", -1000, 1000, 1)
          .onChange((value: any) => {
            heightBlendEnd = value;
          });
        gui
          .add({ baseTiling: baseTiling }, "baseTiling", 1, 10, 0.5)
          .onChange((value: any) => {
            blendMaterial.setBaseTiling(value, value);
          });
        gui
          .add({ overlay1Tiling: overlay1Tiling }, "overlay1Tiling", 1, 10, 1)
          .onChange((value: any) => {
            blendMaterial.setOverlay1Tiling(value, value);
          });
        gui
          .add({ overlay2Tiling: overlay2Tiling }, "overlay2Tiling", 1, 10, 1)
          .onChange((value: any) => {
            blendMaterial.setOverlay2Tiling(value, value);
          });

        gui
          .add(
            { diffuseIntensity: diffuseIntensity },
            "diffuseIntensity",
            1,
            10,
            0.1
          )
          .onChange((value: any) => {
            blendMaterial.diffuseTexture.level = value;
          });
        gui
          .add(
            { heightMapStrength: heightMapStrength },
            "heightMapStrength",
            0,
            10,
            0.1
          )
          .onChange((value: any) => {
            heightMapStrength = value;
          });
        gui
          .add(
            { heightMapStrength2: heightMapStrength2 },
            "heightMapStrength2",
            0,
            10,
            0.1
          )
          .onChange((value: any) => {
            heightMapStrength2 = value;
          });
        gui
          .add(
            { heightMap1TilingValue: heightMap1TilingValue },
            "heightMap1TilingValue",
            0,
            10,
            0.1
          )
          .onChange((value: any) => {
            heightMap1TilingValue = value;
            heightMap1Tiling = new window.BABYLON.Vector2(value, value);
          });
        gui
          .add(
            { heightMap2TilingValue: heightMap2TilingValue },
            "heightMap2TilingValue",
            0,
            10,
            0.1
          )
          .onChange((value: any) => {
            heightMap2TilingValue = value;
            heightMap2Tiling = new window.BABYLON.Vector2(value, value);
          });
        gui
          .add({ noiseScale: noiseScale }, "noiseScale", 0.1, 10, 0.5)
          .onChange((value: any) => {
            noiseScale = value;
          });

        gui
          .add({ noiseStrength: noiseStrength }, "noiseStrength", -1, 1, 0.05)
          .onChange((value: any) => {
            noiseStrength = value;
          });
        gui
          .add({ ambientAmount: ambientAmount }, "ambientAmount", 0, 1, 0.01)
          .onChange((value: any) => {
            ambientAmount = value;
          });
      });
    }

    blendMaterial.onBindObservable.add(() => {
      const effect = blendMaterial.getEffect();
      effect.setTexture("baseTexture", blendMaterial.baseTexture);
      effect.setTexture("overlayTexture1", blendMaterial.overlayTexture1);
      effect.setTexture("overlayTexture2", blendMaterial.overlayTexture2);
      effect.setTexture("heightMap1", blendMaterial.heightMap1);
      effect.setTexture("heightMap2", blendMaterial.heightMap2);
      effect.setVector2("baseTiling", blendMaterial.baseTiling);
      effect.setVector2("overlay1Tiling", blendMaterial.overlay1Tiling);
      effect.setVector2("overlay2Tiling", blendMaterial.overlay2Tiling);

      // effect.setFloat("heightBlendStart", -805);
      // effect.setFloat("heightBlendEnd", -795);
      // effect.setFloat("heightBlendStart", -900);
      // effect.setFloat("heightBlendEnd", -700);
      effect.setFloat("heightBlendStart", heightBlendStart);
      effect.setFloat("heightBlendEnd", heightBlendEnd);
      effect.setFloat("heightMapStrength", heightMapStrength);
      effect.setFloat("heightMapStrength2", heightMapStrength2);
      effect.setVector2("heightMap1Tiling", heightMap1Tiling);
      effect.setVector2("heightMap2Tiling", heightMap2Tiling);

      effect.setFloat("noiseScale", noiseScale);
      effect.setFloat("noiseStrength", window.AUTOBLEND_NOISE_STRENGTH);
      effect.setFloat("ambientAmount", ambientAmount);
      // var currentTime = (Date.now() - startTime) / 1000; // Time in seconds
      // effect.setFloat("time", currentTime);
    });
    return blendMaterial;
  },

  createDefaultMaterial: (scene: any, oldMaterial: any, name: string) => {
    let newMaterial = new window.BABYLON.StandardMaterial(name, scene);
    console.log("oldMaterial", oldMaterial);
    console.log("oldMaterial.diffuseTexture", oldMaterial.diffuseTexture);
    let oldAlbedoTexture = oldMaterial.albedoTexture;
    const emissiveTexture = oldAlbedoTexture.clone("emissiveTexture");
    if (oldMaterial) {
      oldMaterial.dispose();
    }

    newMaterial.diffuseTexture = oldAlbedoTexture;
    newMaterial.emissiveTexture = emissiveTexture;
    newMaterial.diffuseTexture.level = 0.8;
    newMaterial.emissiveTexture.level = 2.0;
    newMaterial.specularPower = 0.5;
    newMaterial.specularColor = new window.BABYLON.Color3(0.5, 0.5, 0.5);
    newMaterial.emissiveColor = new window.BABYLON.Color3(1.0, 1.0, 1.0);
    newMaterial.useVertexColors = false;
    newMaterial.ambientColor = new window.BABYLON.Color3(1, 1, 1);

    // Create a test plane with the same material
    // const testPlane = window.BABYLON.MeshBuilder.CreatePlane(
    //   "testPlane",
    //   { size: 100 },
    //   scene
    // );
    // testPlane.position.y = -700; // Position it above to make it visible
    // testPlane.material = newMaterial.clone("testMaterial");

    return newMaterial;
  },

  createLeavesMaterial: (scene: any, oldMaterial: any) => {
    const pbrCustomMat = new window.BABYLON.PBRCustomMaterial(
      "pbrWindSwayMaterial",
      scene
    );
    pbrCustomMat.albedoTexture = oldMaterial.albedoTexture;
    pbrCustomMat.emissiveTexture = oldMaterial.emissiveTexture;
    pbrCustomMat.metallic = 0.0;
    pbrCustomMat._metallicF0Factor = 0.0;
    pbrCustomMat.backFaceCulling = false; //VERY IMPORTANT WHEN FALSE, NO DIRECTIONAL LIGHT, TRUE FOR DIRESTIONAL LIGHT BUT THINER TREES
    pbrCustomMat.AddUniform("iTime", "float", 0);
    pbrCustomMat.AddUniform("swayStrength", "float", 0.2);
    pbrCustomMat.AddUniform("swaySpeed", "float", 1.5);
    pbrCustomMat.AddUniform("screenResolution", "vec2", 1.5);
    pbrCustomMat.Fragment_Before_FragColor(`
      // vec2 center = screenResolution * 0.5;
      // float r = 5000.0; //radius in pixels
      // if (length(gl_FragCoord.xy - center) > r) discard;

      // vec2 uv = gl_FragCoord.xy / screenResolution;
      // vec2 center = vec2(0.5, 0.5);
      // float dist = distance(uv, center);
      // float radius = 0.25;
      // if(dist < radius) {
      //   discard;
      // }
      // discard;
      `);
    pbrCustomMat.Vertex_Before_PositionUpdated(`
float sway = sin(position.x * 2.0 + iTime * swaySpeed) * swayStrength;
    positionUpdated = position + vec3(0.0, sway, 0.0); // Apply sway in Y-axis
`);

    const swaySpeed = 2.3;
    const swayStrength = 0.35;
    pbrCustomMat.onBindObservable.add(() => {
      const currentTime = performance.now() * 0.001; // Convert to seconds
      pbrCustomMat.getEffect().setFloat("iTime", currentTime);
      pbrCustomMat.getEffect().setFloat("swayStrength", swayStrength);
      pbrCustomMat.getEffect().setFloat("swaySpeed", swaySpeed);
      pbrCustomMat
        .getEffect()
        .setVector2(
          "screenResolution",
          new window.BABYLON.Vector2(
            scene.getEngine().getRenderWidth(),
            scene.getEngine().getRenderHeight()
          )
        );
    });

    // this.objectTemplates[templateIndex].useVertexColors = false;
    // this.objectTemplates[templateIndex].isPickable = true; // Ensures the mesh can be interacted with
    // this.objectTemplates[templateIndex].alwaysSelectAsActiveMesh = true;

    //for tree imports
    pbrCustomMat.environmentIntensity = 0.6;
    pbrCustomMat.directIntensity = 10.2;
    pbrCustomMat.transparencyMode = window.BABYLON.Material.MATERIAL_ALPHATEST;
    // Set emissive color to white
    pbrCustomMat.emissiveColor = new window.BABYLON.Color3(1, 1, 1);
    // Set emissive intensity to 0.5
    pbrCustomMat.emissiveIntensity = 0.5;
    return pbrCustomMat;
  },

  getMaterial: (material_type: string, oldMaterial: any, scene: any) => {
    // asset.material_type
    if (material_type === "lightray") {
      // Get or create the light ray material
      let material = assetManager.materialCache.get("lightray");
      if (!material) {
        material = assetManager.createLightRayMaterial(scene);
        assetManager.materialCache.set("lightray", material);
      }
      return material;
    }
    if (material_type === "autoBlend") {
      let material = assetManager.materialCache.get("autoBlend");
      if (!material) {
        material = assetManager.createAutoBlendMaterial(scene);
        assetManager.materialCache.set("autoBlend", material);
      }
      return material;
    }
    if (material_type === "leaves") {
      let material = assetManager.materialCache.get("leaves");
      if (!material) {
        material = assetManager.createLeavesMaterial(scene, oldMaterial);
        assetManager.materialCache.set("leaves", material);
      }
      return material;
    }
    if (material_type.includes("default")) {
      let material = assetManager.materialCache.get(material_type);
      if (!material) {
        material = assetManager.createDefaultMaterial(
          scene,
          oldMaterial,
          material_type
        );
        assetManager.materialCache.set(material_type, material);
      }
      return material;
    }
  },

  babylonMesh: async (asset: any, scene: any) => {
    const result = await window.BABYLON.SceneLoader.ImportMeshAsync(
      asset.mesh || null,
      null,
      asset.file_path,
      scene
    );

    console.log("asset.material_type", asset.material_type);

    // getMaterial //asset.material_type
    let materialType = asset.material_type;
    let oldMaterial = null;
    if (materialType === "default") {
      materialType = "default_" + asset.asset_id;
      console.log(
        "result.meshes[0].getChildMeshes()",
        result.meshes[0].getChildMeshes()[0].name
      );
      result.meshes[0].getChildMeshes().forEach((mesh: any) => {
        if (mesh.material) {
          oldMaterial = mesh.material;
          // console.log("oldMaterial", oldMaterial.name);
        }
      });
    }
    if (materialType === "leaves") {
      oldMaterial = result.meshes[0].getChildMeshes()[0].material;
      console.log(
        "result.meshes[0].getChildMeshes()[0]",
        result.meshes[0].getChildMeshes()[0].name
      );
    }

    let newMaterial = assetManager.getMaterial(
      materialType,
      oldMaterial,
      scene
    );
    result.meshes[0].getChildMeshes().forEach((mesh: any) => {
      mesh.material = newMaterial;
      mesh.scaling.x = 100;
      mesh.scaling.y = 100;
      mesh.scaling.z = 100;

      mesh.scaling.x = 0.1;
      mesh.scaling.y = 0.1;
      mesh.scaling.z = 0.1;
    });

    if (materialType === "leaves") {
      result.meshes[0].getChildMeshes().forEach((mesh: any) => {
        if (mesh.name === asset.mesh) {
          console.log("mesh", mesh.name);
          mesh.applyFog = false;
        }
      });
    }

    // console.log("asset.mesh", asset.mesh);
    // console.log("result", result);
    // return window.BABYLON.MeshBuilder.CreateBox(
    //   asset.name || "AssetLoaded",
    //   { size: 10 },
    //   scene
    // );
    if (asset.mesh) {
      let matchingMesh = null;
      result.meshes.forEach((mesh: any) => {
        if (mesh.name === asset.mesh) {
          console.log("matchingMesh", mesh.name);

          matchingMesh = mesh;
          if (asset.preffered_scale) {
            matchingMesh.preffered_scale = asset.preffered_scale;
          }
        }
      });
      return matchingMesh;
    }
    return result.meshes[0];
    // return BABYLON.MeshBuilder.CreateBox("template1", { size: 10 }, scene);
  },

  babylonMeshURL: async (url: string, name: string, scene: any) => {
    const result = await window.BABYLON.SceneLoader.ImportMeshAsync(
      name || null,
      null,
      url,
      scene
    );

    return result.meshes[0];
    // return BABYLON.MeshBuilder.CreateBox("template1", { size: 10 }, scene);
  },

  // Load a single asset and return its mainInstance
  load: async (asset: any, scene: any): Promise<any> => {
    try {
      // Check if asset is already loaded
      if (assetManager.loadedAssets.has(asset.asset_id)) {
        console.log(`Asset ${asset.asset_id} found in cache`);
        return assetManager.loadedAssets.get(asset.asset_id);
      }

      // Load new asset
      console.log("loading asset", asset);
      const mesh = await assetManager.babylonMesh(asset, scene);

      mesh.assetId = asset.asset_id;
      mesh.material_type = asset.material_type;
      mesh.preffered_scale = asset.preffered_scale;
      assetManager.loadedAssets.set(asset.asset_id, mesh);
      return mesh;
    } catch (error) {
      console.error(`Failed to load asset ${asset.asset_id}:`, error);
      throw error;
    }
  },

  loadCustomURL: async (
    url: string,
    name: string,
    scene: any
  ): Promise<any> => {
    try {
      // Check if asset is already loaded
      // if (assetManager.loadedAssets.has(asset.id)) {
      //   console.log(`Asset ${asset.id} found in cache`);
      //   return assetManager.loadedAssets.get(asset.id);
      // }

      // Load new asset
      //   const mesh = await assetManager.babylonMeshURL(
      //     "Trunk",
      //     "https://game.openworldbuilder.com/assets/textures/terrain/trees/newTreePacked.glb",
      //     scene
      //   );
      const mesh = await assetManager.babylonMeshURL(url, name, scene);
      mesh.assetId = url;
      assetManager.loadedAssets.set(url, mesh);
      return mesh;
    } catch (error) {
      console.error(`Failed to load asset ${url}:`, error);
      throw error;
    }
  },

  // Load multiple assets in parallel
  loadMany: async (assetIds: string[]): Promise<Map<string, any>> => {
    const results = new Map();
    await Promise.all(
      assetIds.map(async (id) => {
        try {
          //make this a promise all
          //   const mesh = await assetManager.load(id);
          //   results.set(id, mesh);
        } catch (error) {
          console.error(`Failed to load asset ${id}:`, error);
        }
      })
    );
    return results;
  },

  unload: (assetId: string) => {
    if (assetManager.loadedAssets.has(assetId)) {
      window.ASSET_MANAGER.unloadAsset(assetId);
      assetManager.loadedAssets.delete(assetId);
    }
  },

  // Optional: method to clear entire cache
  clearCache: () => {
    assetManager.loadedAssets.forEach((_, assetId) => {
      assetManager.unload(assetId);
    });
    assetManager.loadedAssets.clear();
  },
};

window.ASSET_MANAGER = assetManager;

type Props = {
  // conn: DbConnection;
  conn: any;
};

// const getObjectsInRange = (position: Position): SceneObject[] => {
//   // Replace with your logic to get objects in range
//   return [];
// };

export const Streamer: React.FC<Props> = ({ conn }) => {
  useEffect(() => {
    // expose these helpers globally
    window.STREAMER = {
      addObjectsToScene,
      // streamAssets,    // optional: if you also want to trigger streaming externally
    };

    return () => {
      // clean up on unmount
      delete window.STREAMER;
    };
  }, [addObjectsToScene]);

  const objects = new Map<string, Object>();
  const loadedObjects = useRef<Set<string>>(new Set());
  //   const lastPosition = useRef<Position | null>(null);
  const position = useRef<Position | null>(null);

  // window.STREAMER = {
  //   streamExclusionMap: new Map<string, boolean>(),
  // };

  //   window.STREAMER.streamExclusionMap = new Map<string, boolean>();

  // Helper to calculate distance
  function getDistance(a: Position, b: Position) {
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
    );
  }

  function addObjectsToScene(objects: any) {
    const scene = window.SCENE_MANAGER.activeScene;
    if (scene) {
      objects.forEach((obj: any) => {
        //find all asset Ids
        //check if need to load any asset
        // let assetIds = objects.map((obj: any) => obj.assetId);
        //if an asset id is not in the array
        // let notLoadedAssetIds = assetIds.filter(
        //   (id: any) => !loadedObjects.current.has(id)
        // );

        //load all not loaded asset ids
        // await assetManager.loadMany(notLoadedAssetIds);

        if (!loadedObjects.current.has(obj.id)) {
          // Create a box with the position from the object data
          let templateKey = obj.assetId;
          let objectPosition = new window.BABYLON.Vector3(
            obj.position.x,
            obj.position.y,
            obj.position.z
          );
          let draggedRotation = obj.rotationQuaternionX;
          let scale_x = obj.scaleX;

          console.log(
            `Adding object ${obj.id} (asset ${obj.assetId}) to scene`
          );
          window.TERRAIN_EDITOR.addObjectAtLocation(
            templateKey,
            objectPosition,
            draggedRotation,
            scale_x,
            true,
            obj.assetId
          );

          loadedObjects.current.add(obj.id);

          console.log(
            `Added object ${obj.id} (asset ${obj.assetId}) to scene. Full Call  + scale_x: ${scale_x}`
          );
        }
      });
    }
  }

  // Main streaming logic
  async function streamAssets() {
    // position.current = {
    //   x: window.dummyAggregate.body.transformNode._absolutePosition.x,
    //   y: window.dummyAggregate.body.transformNode._absolutePosition.y,
    //   z: window.dummyAggregate.body.transformNode._absolutePosition.z,
    // };
    position.current =
      window.DUMMY_AGGREGATE.body.transformNode.getAbsolutePosition();

    // console.log("window.dummyAggreg/ate", window.dummyAggregate);
    console.log("streaming assets");
    // const objectsInRange = await conn.reducers.getObjectsInRange();
    // Calculate distance for each object and filter those in range
    const STREAMING_RANGE = 500; // Define the streaming range in units

    if (!position.current) {
      console.log("No current position, skipping range calculation");
      return;
    }

    const objectsInRange = [];

    for (const [id, obj] of objects.entries()) {
      const objPosition = {
        x: obj.positionX,
        y: obj.positionY,
        z: obj.positionZ,
      };

      const distance = getDistance(position.current, objPosition);

      if (distance <= STREAMING_RANGE && !window.streamExclusionMap.has(id)) {
        objectsInRange.push({
          id: id,
          assetId: obj.assetId,
          position: objPosition,
          rotationQuaternionX: obj.rotationQuaternionX,
          scaleX: obj.scaleX,
        });
      }
    }

    console.log(
      `Found ${objectsInRange.length} objects in range of ${STREAMING_RANGE} units`
    );

    // const newObjectIds = new Set(objectsInRange.map((obj) => obj.id));

    // console.log("objectsInRange", objectsInRange);

    //     // Find assets to load
    //     const assetsToLoad = objectsInRange
    //       .filter((obj) => !loadedObjects.current.has(obj.id))
    //       .map((obj) => obj.id);

    //   // 2. Find unique assetIds to load
    //   const assetIdsToLoad = Array.from(
    //     new Set(objectsInRange.map((obj) => obj.assetId))
    //   );

    //   // 3. Load all new unique assets  into memory asynchronously
    //   if (assetIdsToLoad.length > 0) {
    //     await assetManager.load(assetIdsToLoad);
    //   }

    //   // 4. Add all objects to the scene
    addObjectsToScene(objectsInRange);

    //     // Unload assets that are no longer in range
    //     for (const objId of Array.from(loadedObjects.current)) {
    //       if (!newObjectIds.has(objId)) {
    //         assetManager.unload(objId);
    //         loadedObjects.current.delete(objId);
    //       }
    //     }
  }

  // Call streamAssets every 15 seconds if moved more than 100 units
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        // !lastPosition.current ||
        // getDistance(lastPosition.current, position.current) > 100
        true
      ) {
        // lastPosition.current = position.current;
        streamAssets();
      }
    }, 60000);
    //Run on frist load
    // streamAssets();

    setTimeout(() => {
      if (conn === null) {
        return;
      } //using streamer offline
      console.log(
        "window.SCENE_MANAGER.activeScene.CHANNEL_ID",
        window.SCENE_MANAGER.activeScene.CHANNEL_ID
      );
      conn
        .subscriptionBuilder()
        .subscribe([
          "SELECT * FROM object WHERE channel_id= '" +
            window.SCENE_MANAGER.activeScene.CHANNEL_ID +
            "'",
        ]);
      //   .onApplied((ctx) => {
      //     //   console.log("object cached" + objectid);
      //     const objs = ctx.db.object.iter();
      //     //   console.log("objs", objs);
      //     for (const obj of objs) {
      //       //   window.MULTIPLAYER.onAddObject(obj);
      //       console.log("object cached: " + obj.objectId.toString());
      //       objects.set(obj.objectId.toString(), obj);
      //     }
      //   })

      const onObjectInsert = (_ctx: EventContext, obj: Object) => {
        // Use setTimeout with 0ms delay to move this to the next event loop iteration
        // This makes the operation non-blocking
        setTimeout(() => {
          console.log("object inserted: " + obj.objectId.toString());
          objects.set(obj.objectId.toString(), obj);
        }, 0);
      };
      conn.db.object.onInsert(onObjectInsert);
    }, 2000);

    return () => clearInterval(interval);
  }, [position]);

  return null; // No UI
};
