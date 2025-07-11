import { loadHeroModel } from '../../character/hero.js';
import { setupCamera } from '../../utils/camera.js';
import { setupPhysics } from '../../utils/physics.js';
import { setupInputHandling } from '../../movement.js';
import { setupAnim } from '../../utils/anim.js';
import { setupProcedural } from '../gen/procedural/procedural.js'
import { loadingAnim } from '../../utils/loadingAnim.js'

import { loadModels } from '../../utils/load.js';

import { Health } from '../../character/health.js';
import { setupBuilderWater } from '../../utils/water.js';
import { createBuilderSettings } from '../../utils/settings/builderSettings.js';
import { setupMainPlayerMenu } from '../../character/interact/builderMenu.js';

import { createMobileControls } from '../../utils/mobile/joystick.js';
import { addGrass } from '../../utils/plants/plants.js';
import { gridTest } from '../gen/procedural/grid/grids.js';


export async function createBuilder(engine) {
    const scene = new BABYLON.Scene(engine);



    createBuilderSettings(); //Has side effects highlight outlines generated based on cell size at start

    const spawnPoint = new BABYLON.Vector3(0, 40, -20);
    const { character, dummyAggregate } = await setupPhysics(scene, spawnPoint);

    const camera = setupCamera(scene, character, engine);
    camera.collisionRadius = new BABYLON.Vector3(12.5, 12.5, 12.5);

    if (!FAST_RELOAD) {
        // load all models, make sure parallel loading for speed
        const modelUrls = [
            "env/builder/parts.glb", "env/exterior/grass/grass.glb"];
        const heroModelPromise = loadHeroModel(scene, character);
        const [heroModel, models] = await Promise.all([
            heroModelPromise,
            loadModels(scene, modelUrls)
        ]);
        const { hero, skeleton } = heroModel;
        setupMainPlayerMenu(scene);
        createMobileControls(scene, camera, character);

        let anim = setupAnim(scene, skeleton);
        setupInputHandling(scene, character, camera, hero, anim, engine, dummyAggregate);
        character.health = new Health("Hero", 100, dummyAggregate);
        character.health.rotationCheck = hero;
        character.health.rangeCheck = character;
        PLAYER = character;
        DUMMY = dummyAggregate;

        setupEnvironment(scene);
        let LEVEL_SIZE = 20000;
        camera.maxZ = LEVEL_SIZE;
        camera.upperRadiusLimit = 1800.8044;

        let skybox = createSkydome(scene, LEVEL_SIZE);

        setupPostProcessing(scene, camera);


        // let sword = addSword(scene, models["Sword2"]);
        // createTrail(scene, engine, sword, 0.2, 40, new BABYLON.Vector3(0, 0, 0.32));

        let meshes = addRoomMap(scene, models);
        hero.getChildMeshes().forEach((value) => { meshes.push(value); });


        setupLighting(scene);

        setupBuilder(scene, engine, meshes, camera);
        // gridTest(scene);

        //  disable for old editor with no grass
        // let terrain = setupTerrain(scene);
        let terrain = null;

        // setupBuilderWater(scene, GRID, engine, hero, -100, 8000, terrain); //disabled for lightrays
        // scene.fogColor = new BABYLON.Color3(135 / 255, 162 / 255, 204 / 255);
        scene.fogColor = new BABYLON.Color3(115 / 255, 162 / 255, 209 / 255);
        let vegatation = addGrass(scene, models);






        // const sphere = BABYLON.MeshBuilder.CreateSphere("Godray Sphere", { diameter: 4, segments: 32 }, scene);
        // sphere.material = new BABYLON.StandardMaterial("sphereMat", scene);
        // sphere.material.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        // sphere.material.specularColor = new BABYLON.Color3(0, 0, 0);
        // sphere.material.emissiveColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        // sphere.material.alpha = 1.0; // Make the sphere partially transparent
        // sphere.material.backFaceCulling = false;
        // sphere.position = new BABYLON.Vector3(0, 100, 100);
        // sphere.scaling = new BABYLON.Vector3(1000, 1000, 1000);

        // Create the Volumetric Light Scattering post-process (god rays)
        // const godrays = new BABYLON.VolumetricLightScatteringPostProcess("godrays", 1.0, camera, skybox, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, true);
        // godrays.exposure = 0.25;
        // godrays.decay = 0.96815;
        // godrays.weight = 0.58767;
        // godrays.density = 0.926;

        // Blue godrays
        skybox.position.y = 100;
        const godrays = new BABYLON.VolumetricLightScatteringPostProcess("godrays", 1.0, camera, skybox, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, true);
        godrays.exposure = 0.15;
        godrays.decay = 0.95815;
        godrays.weight = 0.38767;
        godrays.density = 0.926;

        // minimal flicker, still good blended godrays
        godrays.exposure = 0.012; //0.04
        godrays.decay = 0.99815;
        godrays.weight = 1.0; //0.84767;
        godrays.density = 0.044;

        godrays.exposure = 0.02; //0.04
        godrays.decay = 0.99815;
        godrays.weight = 0.98; //0.84767;
        godrays.density = 0.45;

        if (DEBUG) {
            BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
                const gui = new lil.GUI({ title: "RSM Global Illumination" });
                const godrayFolder = gui.addFolder('Godrays');

                godrayFolder.add(godrays, 'exposure', 0, 1, 0.01).name('Exposure');
                godrayFolder.add(godrays, 'decay', 0, 1, 0.00001).name('Decay');
                godrayFolder.add(godrays, 'weight', 0, 1, 0.00001).name('Weight');
                godrayFolder.add(godrays, 'density', 0, 1, 0.001).name('Density');

                // Open the folder by default
                godrayFolder.open();
            });

        }

        GODRAYS = godrays;



        // var godrays = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, camera, null, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);

        // // By default it uses a billboard to render the sun, just apply the desired texture
        // // position and scale
        // // Create a plane
        // const plane = BABYLON.MeshBuilder.CreatePlane("plane", { size: 100 }, scene);

        // // Position the plane 1000 units to the east (positive X direction)
        // plane.position = new BABYLON.Vector3(1000, 0, 0);

        // // Rotate the plane to face upright (facing along Z axis)

        // godrays.mesh.material.diffuseTexture = new BABYLON.Texture('./assets/textures/effects/sunrays.png', scene, true, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
        // godrays.mesh.material.diffuseTexture.hasAlpha = true;
        // godrays.mesh.position = new BABYLON.Vector3(-2050, 150, 150);
        // godrays.mesh.rotation = new BABYLON.Vector3(1.0, 0, 0);
        // godrays.mesh.scaling = new BABYLON.Vector3(4050, 4050, 4050);


        // var godrays2 = new BABYLON.VolumetricLightScatteringPostProcess('godrays', 1.0, camera, null, 100, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false);

        // // By default it uses a billboard to render the sun, just apply the desired texture
        // // position and scale
        // godrays2.mesh.material.diffuseTexture = new BABYLON.Texture('./assets/textures/effects/sunrays.png', scene, true, false, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
        // godrays2.mesh.material.diffuseTexture.hasAlpha = true;
        // godrays2.mesh.position = new BABYLON.Vector3(2050, 150, 150);
        // godrays2.mesh.rotation = new BABYLON.Vector3(-1.0, 0, 0);
        // godrays2.mesh.scaling = new BABYLON.Vector3(4050, 4050, 4050);



        // // advanced lighting
        // // const spotLight = setupSpotlight(scene);
        // const light = new BABYLON.DirectionalLight("directionalLight", new BABYLON.Vector3(-800, -1400, -1000), scene);
        // light.intensity = 15.7;
        // // // light.intensity = 0;
        // // // light.shadowMinZ = 1800;
        // // // light.shadowMinZ = 2100;
        // light.shadowMinZ = 1500;
        // light.shadowMaxZ = 2300;
        // light.diffuse = new BABYLON.Color3(1, 1, 1);

        // // let lights = [light, spotLight];
        // // setupGI(scene, engine, lights, meshes);

        // setupShadows(light, hero);
        // loadingAnim(scene);

        // setupWater(scene, ground, engine, dummyAggregate, -10, 2000);


        // const atmosphereManager = new AtmosphereManager(scene, camera);
        // atmosphereManager.godrays = godrays;

        // Transition to night
        // atmosphereManager.transitionTo('night', 3.0);
        // Transition to overcast
        // atmosphereManager.transitionTo('overcast', 2.0);
        // Transition to sunny
        // atmosphereManager.transitionTo('sunny', 4.0);


        addZReset(scene, dummyAggregate, spawnPoint);

    } else {

    }
    return scene;
}

function addZReset(scene, dummyAggregate) {
    scene.onBeforeRenderObservable.add(() => {
        if (dummyAggregate.body.transformNode._absolutePosition.y < -180) {
            dummyAggregate.resetToSpawn();
        }
    });
}

function setupBuilder(scene, engine, meshes, camera) {
    // standard setup for different themes
    // console.log(meshes);
    const fm = name => meshes.find(mesh => mesh.name === name);
    let assignedMeshes = {
        'floor': fm('Floor'),
        'wall': [fm('1_WallWindow'), fm('2_WallWood')],
        'clutter': [fm('0Barrel'), fm('1ChairGood'), fm('2Rug')],
        'door': [fm('Door'), fm('2_WallWood')],
        'base': [fm('StoneBase')],
        'roof': {
            'Roof_Left_Flat_Right_Flat': [fm('Roof_Left_Flat_Right_Flat')],
            'Roof_Left_Flat_Right_Inset': [fm('Roof_Left_Flat_Right_Inset')],
            'Roof_Left_Flat_Right_Outset': [fm('Roof_Left_Flat_Right_Outset')],

            'Roof_Left_Inset_Right_Flat': [fm('Roof_Left_Inset_Right_Flat')],
            'Roof_Left_Inset_Right_Inset': [fm('Roof_Left_Inset_Right_Inset')],
            'Roof_Left_Inset_Right_Outset': [fm('Roof_Left_Inset_Right_Outset')],

            'Roof_Left_Outset_Right_Flat': [fm('Roof_Left_Outset_Right_Flat')],
            'Roof_Left_Outset_Right_Inset': [fm('Roof_Left_Outset_Right_Inset')],
            'Roof_Left_Outset_Right_Outset': [fm('Roof_Left_Outset_Right_Outset')]
        }
    }
    assignedMeshes['clutter'][0].border = 10;
    assignedMeshes['clutter'][1].border = 10;
    assignedMeshes['clutter'][2].border = 10;
    setupProcedural(scene, engine, assignedMeshes);
}


function createSkydome(scene) {
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 8000.0 }, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("./assets/textures/lighting/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

    // scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    // scene.fogStart = 600.0; // Where the fog starts
    // scene.fogEnd = 6000.0;   // Where the fog completely obscures everything
    // scene.fogColor = new BABYLON.Color3(0.769, 0.86, 1); // Light grey fog

    var rotationSpeed = 0.0005;
    scene.onBeforeRenderObservable.add(function () {
        skybox.rotation.y += rotationSpeed;
    });


    return skybox;
}

function setupTerrain(scene) {
    const terrainMaterial = new BABYLON.TerrainMaterial("terrainMaterial", scene);
    terrainMaterial.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    terrainMaterial.specularPower = 64;
    terrainMaterial.mixTexture = new BABYLON.Texture("assets/textures/terrain/mixMap.png", scene);
    terrainMaterial.diffuseTexture1 = new BABYLON.Texture("assets/textures/terrain/floor.png", scene);
    terrainMaterial.diffuseTexture2 = new BABYLON.Texture("assets/textures/terrain/rock.png", scene);
    terrainMaterial.diffuseTexture3 = new BABYLON.Texture("assets/textures/terrain/grass.png", scene);

    terrainMaterial.diffuseTexture1.uScale = terrainMaterial.diffuseTexture1.vScale = 15;
    terrainMaterial.diffuseTexture2.uScale = terrainMaterial.diffuseTexture2.vScale = 8;
    terrainMaterial.diffuseTexture3.uScale = terrainMaterial.diffuseTexture3.vScale = 23;
    const ground = BABYLON.MeshBuilder.CreateGroundFromHeightMap("ground", "assets/textures/terrain/hieghtMap.png", {
        width: 10000,
        height: 10000,
        subdivisions: 100,
        minHeight: 0,
        maxHeight: 50,
        onReady: function (ground) {
            ground.position.y = -160.05;
            ground.material = terrainMaterial;
            ground.receiveShadows = true;
            // ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.HeightmapImpostor, { mass: 0, restitution: 0.0, friction: 100.8 }, scene);
            // setTimeout(() => scene.physicsEnabled = true, 1000); // Enable physics after the ground is ready
            var groundAggregate;
            groundAggregate = new BABYLON.PhysicsAggregate(ground, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1000000000.8 }, scene);
            setTimeout(() => {
                scene.physicsEnabled = true;
            }, 10);
        }
    }, scene);
    ground.material = terrainMaterial;

    return ground;
}




function addRoomMap(scene, models) {
    let meshes = [];
    let parts = models["parts"];
    // let town_map = models["inn_map_procedural_individual"];
    parts.name = "parts";
    // parts.position.y = 10;

    parts.scaling = new BABYLON.Vector3(5, 5, 5);

    parts.position.y = -100;

    parts.getChildMeshes().forEach(mesh => {
        mesh.material.metallic = 0;
        mesh.receiveShadows = true;
        // set levels
        meshes.push(mesh);

        if (mesh.name === "Floor") {
            mesh.position.y = 100 / 5 + 0.023;
        }
        if (mesh.name === "2Rug") {
            mesh.position.y = 100 / 5 + 0.03;
        }
        if (mesh.name === "1ChairGood") {
            mesh.position.y = 100 / 5 + 0.023;
            mesh.position.x = 5;
            mesh.position.z = 3;
            mesh.rotation = new BABYLON.Vector3(0, -1.3, 0);
        }


        let town_mapCollision = new BABYLON.PhysicsAggregate(mesh, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1.0 }, scene);

    });

    scene.physicsEnabled = true;



    return meshes;
}

function setupEnvironment(scene) {
    scene.clearColor = new BABYLON.Color3.Black();
    const environmentURL = "./assets/textures/lighting/environment.env";
    const environmentMap = BABYLON.CubeTexture.CreateFromPrefilteredData(environmentURL, scene);
    scene.environmentTexture = environmentMap;
    scene.environmentIntensity = 1.0;
    scene.environmentIntensity = 0.0;
}

async function LoadLiLGUI() {
    return BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js");
}



function setupSpotlight(scene) {
    // Create a spotlight
    var spotlight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(0, 40, 80), new BABYLON.Vector3(0, -1, 0), Math.PI / 3, 2, scene);
    spotlight.diffuse = new BABYLON.Color3(1, 1, 1); // White light
    spotlight.specular = new BABYLON.Color3(1, 1, 1);
    // Mixed GI and normal
    // spotlight.intensity = 1000000;
    // spotlight.intensity = 1000000;
    // GI Only
    spotlight.intensity = 10000.0000;
    // spotlight.angle = 166.1005;
    spotlight.angle = 140.1005;

    var frameRate = 30;
    var animation = new BABYLON.Animation("spotlightAnimation", "direction", frameRate, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);

    var keyFrames = [];
    var radius = 1; // Radius of the circular path
    var yPosition = -1; // Y position to keep the light pointing downwards

    for (var i = 0; i <= frameRate; i++) {
        var angle = (i / frameRate) * 2 * Math.PI; // Full circle in one second
        keyFrames.push({
            frame: i,
            value: new BABYLON.Vector3(Math.sin(angle) * radius, yPosition, Math.cos(angle) * radius)
        });
    }

    animation.setKeys(keyFrames);
    spotlight.animations.push(animation);

    scene.beginAnimation(spotlight, 0, frameRate, true, 0.2);

    return spotlight;

}

function setupLighting(scene) {


    // var light = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
    // light.intensity = 1.7;

    // light.diffuse = new BABYLON.Color3(1, 1, 1);
    // light.specular = new BABYLON.Color3(0, 1, 0);
    // light.groundColor = new BABYLON.Color3(0, 0.5, 1);

    // light.visible = true;

    var hemisphericLight = new BABYLON.HemisphericLight("hemisphericLight", new BABYLON.Vector3(0, 1, 0), scene);
    hemisphericLight.intensity = 1.15; // Adjust intensity of the light
    hemisphericLight.diffuse = new BABYLON.Color3(1, 183 / 255, 124 / 255); // White light
    hemisphericLight.specular = new BABYLON.Color3(0.0, 0.0, 0.0); // Gray specular highlight
    hemisphericLight.groundColor = new BABYLON.Color3(52 / 255, 63 / 255, 112 / 255); // Dark ground color


    return hemisphericLight;
}

function setupShadows(light, shadowCaster) {

    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    // shadowGenerator.useExponentialShadowMap = false;
    shadowGenerator.darkness = 0.3;
    // shadowGenerator.darkness = 0.6;
    // shadowGenerator.darkness = 1;
    shadowGenerator.usePoissonSampling = true;
    shadowGenerator.nearPlane = 1621.2952;
    shadowGenerator.farPlane = 2007.0404;
    // shadowGenerator.minZ = -1000;
    shadowGenerator.addShadowCaster(shadowCaster);
}

function setupPostProcessing(scene, camera) {
    // scene.fogMode = BABYLON.Scene.FOGMODE_EXP;
    const pipeline = new BABYLON.DefaultRenderingPipeline(
        "default", // The name of the pipeline
        true,     // Do you want HDR textures?
        scene,    // The scene linked to
        [camera]  // The list of cameras to be attached to
    );

    // Configure effects
    pipeline.samples = 4;  // MSAA anti-aliasing
    pipeline.fxaaEnabled = true;   // Enable FXAA

    pipeline.bloomEnabled = true;  // Enable bloom
    pipeline.bloomThreshold = 1.8500;//only affect sun not clouds
    pipeline.bloomThreshold = 0.2;//only affect sun not clouds

    const imgProc = pipeline.imageProcessing;

    // Apply contrast and exposure adjustments
    imgProc.contrast = 2.0;
    imgProc.exposure = 1.8;

    // imgProc.contrast = 2.3;
    imgProc.contrast = 2.6;
    imgProc.exposure = 2.6;

    imgProc.contrast = 2.4;
    imgProc.exposure = 2.4;


    // Enable tone mapping
    imgProc.toneMappingEnabled = true;
    imgProc.toneMappingType = BABYLON.ImageProcessingConfiguration.TONEMAPPING_ACES;

    // Apply vignette effect
    imgProc.vignetteEnabled = true;
    imgProc.vignetteWeight = 3.8;
    imgProc.vignetteColor = new BABYLON.Color4(0, 0, 0, 1);
    imgProc.vignetteBlendMode = BABYLON.ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY;
    imgProc.vignetteWeight = 2.3;

    // var sharpen = new BABYLON.SharpenPostProcess("sharpen", 1.0, camera);
    // sharpen.edgeAmount = 0.6;  // Increase or decrease for more or less sharpening
    // sharpen.colorAmount = 1.0;

    console.log(imgProc);   
    imgProc.sharpenEnabled = true;
    // imgProc.sharpen.edgeAmount = 0.6;  // Increase or decrease for more or less sharpening
    // imgProc.sharpen.colorAmount = 1.0;

    // turns out when setting bloom or fxaa, godrays are more consistently rendered after toggle. 

    // setupDitheringEffect(scene, camera);


}


class DitheringPostProcess extends BABYLON.PostProcess {
    constructor(name, options = {}, camera, samplingMode, engine, reusable) {
        // Bayer matrix 8x8 pattern
        const bayer8x8 = [
            0, 32, 8, 40, 2, 34, 10, 42,
            48, 16, 56, 24, 50, 18, 58, 26,
            12, 44, 4, 36, 14, 46, 6, 38,
            60, 28, 52, 20, 62, 30, 54, 22,
            3, 35, 11, 43, 1, 33, 9, 41,
            51, 19, 59, 27, 49, 17, 57, 25,
            15, 47, 7, 39, 13, 45, 5, 37,
            63, 31, 55, 23, 61, 29, 53, 21
        ];

        // Fragment shader code
        const fragmentShader = `
            precision highp float;

            varying vec2 vUV;
            uniform sampler2D textureSampler;
            uniform vec2 screenSize;
            uniform float bayerMatrix[64];
            uniform float colorLevels;

            float getBayerValue(vec2 pixel) {
                int x = int(mod(pixel.x, 8.0));
                int y = int(mod(pixel.y, 8.0));
                return bayerMatrix[x + y * 8] / 64.0;
            }

            void main() {
                vec4 color = texture2D(textureSampler, vUV);
                vec2 pixel = gl_FragCoord.xy;
                
                float bayerValue = getBayerValue(pixel);
                vec3 rgbColor = color.rgb;
                
                float stepSize = 1.0 / (colorLevels - 1.0);
                vec3 quantized;
                quantized.r = floor(rgbColor.r / stepSize + bayerValue) * stepSize;
                quantized.g = floor(rgbColor.g / stepSize + bayerValue) * stepSize;
                quantized.b = floor(rgbColor.b / stepSize + bayerValue) * stepSize;
                
                gl_FragColor = vec4(quantized, color.a);
            }
        `;

        // Call parent constructor with correct parameters
        super(
            name,                                          // Name of the post-process
            "dithering",                                   // Shader name
            ["screenSize", "bayerMatrix", "colorLevels"],  // Uniforms
            ["textureSampler"],                           // Samplers
            1.0,                                          // Ratio
            camera,                                       // Camera
            samplingMode || BABYLON.Texture.NEAREST_SAMPLINGMODE,  // Sampling mode
            engine,                                       // Engine
            reusable,                                     // Reusable
            null,                                         // Fragment source (we'll set it after)
            fragmentShader                                // Fragment source
        );

        // Store parameters
        this.colorLevels = options.colorLevels || 4;

        // Update shader on every frame
        this.onApply = (effect) => {
            effect.setFloat2("screenSize", this.width, this.height);
            effect.setArray("bayerMatrix", bayer8x8);
            effect.setFloat("colorLevels", this.colorLevels);
        };
    }
}

// Example usage:
function setupDitheringEffect(scene, camera) {
    // Make sure you have a camera and scene
    if (!scene || !camera) {
        console.error("Scene and camera are required for dithering effect");
        return null;
    }

    try {
        const dithering = new DitheringPostProcess(
            "dithering",
            {
                colorLevels: 12
            },
            camera,
            BABYLON.Texture.NEAREST_SAMPLINGMODE,
            scene.getEngine()
        );

        return dithering;
    } catch (error) {
        console.error("Error setting up dithering effect:", error);
        return null;
    }
}

// class AtmospherePreset {
//     constructor(name, settings) {
//         this.name = name;
//         this.fog = {
//             mode: settings.fog.mode || BABYLON.Scene.FOGMODE_LINEAR,
//             start: settings.fog.start || 600.0,
//             end: settings.fog.end || 6000.0,
//             density: settings.fog.density || 0.0003,
//             color: settings.fog.color || new BABYLON.Color3(0.769, 0.86, 1)
//         };
        
//         this.postProcess = {
//             bloom: {
//                 enabled: settings.postProcess.bloom?.enabled ?? true,
//                 threshold: settings.postProcess.bloom?.threshold ?? 1.85
//             },
//             imageProcessing: {
//                 contrast: settings.postProcess.imageProcessing?.contrast ?? 1.6,
//                 exposure: settings.postProcess.imageProcessing?.exposure ?? 1.8,
//                 toneMappingEnabled: settings.postProcess.imageProcessing?.toneMappingEnabled ?? false,
//                 vignetteWeight: settings.postProcess.imageProcessing?.vignetteWeight ?? 2.6,
//                 vignetteColor: settings.postProcess.imageProcessing?.vignetteColor ?? new BABYLON.Color4(0, 0, 0, 1)
//             },
//             godrays: {
//                 enabled: settings.postProcess.godrays?.enabled ?? true,
//                 exposure: settings.postProcess.godrays?.exposure ?? 0.02,
//                 decay: settings.postProcess.godrays?.decay ?? 0.99815,
//                 weight: settings.postProcess.godrays?.weight ?? 0.98,
//                 density: settings.postProcess.godrays?.density ?? 0.45
//             }
//         };
//     }
// }

// class AtmosphereManager {
//     constructor(scene, camera) {
//         this.scene = scene;
//         this.camera = camera;
//         this.currentPreset = null;
//         this.targetPreset = null;
//         this.transitionTime = 0;
//         this.transitionDuration = 0;
        
//         // Initialize post-processing pipeline
//         this.pipeline = new BABYLON.DefaultRenderingPipeline(
//             "atmosphere", 
//             true, 
//             scene, 
//             [camera]
//         );
        
//         // Configure base settings
//         this.pipeline.samples = 4;
//         this.pipeline.fxaaEnabled = true;
        
//         // Create preset library
//         this.presets = {
//             sunny: new AtmospherePreset("sunny", {
//                 fog: { // exp2 0.0010 163 140 88
//                     mode: BABYLON.Scene.FOGMODE_LINEAR,
//                     start: 600.0,
//                     end: 6000.0,
//                     color: new BABYLON.Color3(0.769, 0.86, 1)
//                 },
//                 postProcess: {
//                     bloom: { threshold: 0.2 },
//                     imageProcessing: {
//                         contrast: 2.4,
//                         exposure: 1.5,
//                         vignetteWeight: 2.6
//                     }
//                 },
//                 godrays: {
//                     exposure: 0.05,
//                     decay: 0.99815,
//                     weight: 0.69269,
//                     density: 0.45
//                 }
//             }),
            
//             night: new AtmospherePreset("night", {
//                 fog: {
//                     mode: BABYLON.Scene.FOGMODE_EXP2,
//                     density: 0.0004,
//                     color: new BABYLON.Color3(0, 0.18, 0.23)
//                 },
//                 postProcess: {
//                     bloom: { threshold: 0.2 },
//                     imageProcessing: {
//                         contrast: 2.4,
//                         exposure: 2.4,
//                         toneMappingEnabled: true,
//                         vignetteWeight: 2.3
//                     }
//                 }, 
//                 godrays: {
//                     exposure: 0.012,
//                     decay: 0.99815,
//                     weight: 1.0,
//                     density: 0.044
//                 }
                
//             }),
            
//             overcast: new AtmospherePreset("overcast", {
//                 fog: {
//                     mode: BABYLON.Scene.FOGMODE_EXP,
//                     density: 0.0008,
//                     color: new BABYLON.Color3(0.6, 0.6, 0.6)
//                 },
//                 postProcess: {
//                     bloom: { enabled: false },
//                     imageProcessing: {
//                         contrast: 1.3,
//                         exposure: 1.4,
//                         vignetteWeight: 1.8
//                     }
//                 },
//                 godrays: {
//                     exposure: 0.012,
//                     decay: 0.99815,
//                     weight: 1.0,
//                     density: 0.044
//                 }
//             })
//         };
//     }

//     lerp(start, end, alpha) {
//         if (start instanceof BABYLON.Color3 || start instanceof BABYLON.Color4) {
//             return BABYLON.Color3.Lerp(start, end, alpha);
//         }
//         return start + (end - start) * alpha;
//     }

//     applyPreset(preset) {
//         // Apply fog settings
//         this.scene.fogMode = preset.fog.mode;
//         this.scene.fogStart = preset.fog.start;
//         this.scene.fogEnd = preset.fog.end;
//         this.scene.fogDensity = preset.fog.density;
//         this.scene.fogColor = preset.fog.color;

//         // Apply post-processing settings
//         this.pipeline.bloomEnabled = preset.postProcess.bloom.enabled;
//         this.pipeline.bloomThreshold = preset.postProcess.bloom.threshold;

//         const imgProc = this.pipeline.imageProcessing;
//         imgProc.contrast = preset.postProcess.imageProcessing.contrast;
//         imgProc.exposure = preset.postProcess.imageProcessing.exposure;
//         imgProc.toneMappingEnabled = preset.postProcess.imageProcessing.toneMappingEnabled;
//         imgProc.vignetteWeight = preset.postProcess.imageProcessing.vignetteWeight;
//         imgProc.vignetteColor = preset.postProcess.imageProcessing.vignetteColor;
//         if (this.godrays) {
//             this.godrays.exposure = preset.postProcess.godrays.exposure;
//             this.godrays.decay = preset.postProcess.godrays.decay;
//             this.godrays.weight = preset.postProcess.godrays.weight;
//             this.godrays.density = preset.postProcess.godrays.density;
//         }
//     }

//     transitionTo(presetName, duration = 2.0) {
//         const targetPreset = this.presets[presetName];
//         if (!targetPreset) {
//             console.error(`Preset '${presetName}' not found`);
//             return;
//         }

//         this.currentPreset = this.currentPreset || targetPreset;
//         this.targetPreset = targetPreset;
//         this.transitionTime = 0;
//         this.transitionDuration = duration;

//         // Start the transition update
//         this.scene.onBeforeRenderObservable.add(this._updateTransition);
//     }

//     _updateTransition = () => {
//         if (!this.targetPreset || !this.currentPreset) return;

//         this.transitionTime += this.scene.getEngine().getDeltaTime() / 1000;
//         const alpha = Math.min(this.transitionTime / this.transitionDuration, 1);

//         // Interpolate between current and target settings
//         const interpolatedPreset = new AtmospherePreset("interpolated", {
//             fog: {
//                 mode: this.targetPreset.fog.mode, // Mode doesn't interpolate
//                 start: this.lerp(this.currentPreset.fog.start, this.targetPreset.fog.start, alpha),
//                 end: this.lerp(this.currentPreset.fog.end, this.targetPreset.fog.end, alpha),
//                 density: this.lerp(this.currentPreset.fog.density, this.targetPreset.fog.density, alpha),
//                 color: this.lerp(this.currentPreset.fog.color, this.targetPreset.fog.color, alpha)
//             },
//             postProcess: {
//                 bloom: {
//                     enabled: alpha > 0.5 ? this.targetPreset.postProcess.bloom.enabled : this.currentPreset.postProcess.bloom.enabled,
//                     threshold: this.lerp(this.currentPreset.postProcess.bloom.threshold, this.targetPreset.postProcess.bloom.threshold, alpha)
//                 },
//                 imageProcessing: {
//                     contrast: this.lerp(this.currentPreset.postProcess.imageProcessing.contrast, this.targetPreset.postProcess.imageProcessing.contrast, alpha),
//                     exposure: this.lerp(this.currentPreset.postProcess.imageProcessing.exposure, this.targetPreset.postProcess.imageProcessing.exposure, alpha),
//                     toneMappingEnabled: alpha > 0.5 ? this.targetPreset.postProcess.imageProcessing.toneMappingEnabled : this.currentPreset.postProcess.imageProcessing.toneMappingEnabled,
//                     vignetteWeight: this.lerp(this.currentPreset.postProcess.imageProcessing.vignetteWeight, this.targetPreset.postProcess.imageProcessing.vignetteWeight, alpha)
//                 },
//                 godrays: {
//                     enabled: true,
//                     exposure: this.lerp(this.currentPreset.postProcess.godrays.exposure, this.targetPreset.postProcess.godrays.exposure, alpha),
//                     decay: this.lerp(this.currentPreset.postProcess.godrays.decay, this.targetPreset.postProcess.godrays.decay, alpha),
//                     weight: this.lerp(this.currentPreset.postProcess.godrays.weight, this.targetPreset.postProcess.godrays.weight, alpha),
//                     density: this.lerp(this.currentPreset.postProcess.godrays.density, this.targetPreset.postProcess.godrays.density, alpha)
//                 }
//             }
//         });

//         this.applyPreset(interpolatedPreset);

//         if (alpha >= 1) {
//             this.currentPreset = this.targetPreset;
//             this.targetPreset = null;
//             this.scene.onBeforeRenderObservable.remove(this._updateTransition);
//         }
//     }
// }