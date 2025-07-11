import { loadHeroModel } from '../../character/hero.js';
import { setupCamera } from '../../utils/camera.js';
import { setupPhysics } from '../../utils/physics.js';
import { setupInputHandling } from '../../movement.js';
import { setupAnim } from '../../utils/anim.js';

export async function createTerrain(engine) {
    const scene = new BABYLON.Scene(engine);

    const spawnPoint = new BABYLON.Vector3(0, 100, 0);
    const { character, dummyAggregate } = await setupPhysics(scene, spawnPoint);

    const camera = setupCamera(scene, character, engine);
    camera.collisionRadius = new BABYLON.Vector3(12.5, 12.5, 12.5);

        //    this gets 900ms speed up 
        setTimeout(async () => {
        const { hero, skeleton } = await loadHeroModel(scene, character);
        let anim = setupAnim(scene, skeleton);
        setupInputHandling(scene, character, camera, hero, anim, engine, dummyAggregate);
        
        const terrain = setupTerrain(scene);
        
        setupEnvironment(scene);
        createSkydome(scene);
    }, 10);




    return scene;
}

function setupEnvironment(scene) {
    scene.clearColor = new BABYLON.Color3.White();
    const environmentURL = "/assets/textures/lighting/environment.env";
    const environmentMap = BABYLON.CubeTexture.CreateFromPrefilteredData(environmentURL, scene);
    // scene.environmentTexture = environmentMap;
    // scene.environmentIntensity = 1.0;

    scene.imageProcessingConfiguration.contrast = 1.3;
    scene.imageProcessingConfiguration.exposure = 2.5;
    scene.imageProcessingConfiguration.toneMappingEnabled = true;
    // scene.imageProcessingConfiguration.toneMappingType = BABYLON.ImageProcessingConfiguration.K;
  
    
    // Add ambient light
    const ambientLight = new BABYLON.HemisphericLight(
        "ambientLight",
        new BABYLON.Vector3(0, 1, 0),
        scene
    );
    ambientLight.intensity = 0.5; // Adjust this value between 0 and 1 to control brightness
    ambientLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.2); // Adjust ground reflection color
}


function createSkydome(scene) {
    var skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 8000.0 }, scene);
    var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("/assets/textures/lighting/skybox", scene);
    skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
    skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    skybox.material = skyboxMaterial;

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
        width: 1000,
        height: 1000,
        subdivisions: 100,
        minHeight: 0,
        maxHeight: 100,
        onReady: function (ground) {
            ground.position.y = -10.05;
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

    return ground;
}
