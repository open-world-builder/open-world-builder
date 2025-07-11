import { TerrainTools } from "./TerrainTools.js";
import { TerrainMaterial } from "./TerrainMaterial/TerrainMaterial.js";
import { TerrainUI } from "./TerrainUI.js";

export class TerrainEditor {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.mesh = null;
    this.tools = new TerrainTools(this);
    this.material = new TerrainMaterial(scene);
    this.ui = new TerrainUI(this);

    // Core properties
    this.currentTool = "raise";
    this.isPointerDown = false;
    this.selectedObject = null;
    this.previewMesh = null;

    // Parent nodes
    this.previewParent = new BABYLON.TransformNode("preview", scene);
    this.placedParent = new BABYLON.TransformNode("placed", scene);
    this.grassParent = new BABYLON.TransformNode("placedGrass", scene);

    this.initialize(options);
  }

  initialize(options = {}) {
    this.createTerrain(options);
    this.setupPhysics();
    this.material.initialize();
    this.ui.setupEvents();
  }

  getTerrain() {
    return this.mesh;
  }

  setShadowGenerator(shadowGenerator) {
    this.shadowGenerator = shadowGenerator;
  }

  createTerrain(options) {
    BABYLON.MeshBuilder.CreateGroundFromHeightMap(
      "terrain",
      "assets/textures/terrain/hieghtMap.png",
      {
        width: options.width || 10000,
        height: options.height || 10000,
        subdivisions: options.subdivisions || 100,
        minHeight: 0,
        maxHeight: 1000,
        onReady: (ground) => {
          ground.position.y = -1010.05;
          this.mesh = ground;
          this.mesh.material = this.material.create();
          this.setupPhysics();
          //   this.createSurroundingTerrain();
          //
        },
      },
      this.scene
    );
  }

  setupPhysics() {
    if (this.mesh) {
      new BABYLON.PhysicsAggregate(this.mesh, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1000000000.8 }, this.scene);
    }
  }

  createSurroundingTerrain() {
    const positions = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
    ];

    this.surroundingTerrain = positions.map((pos, index) => {
      const terrainCopy = this.mesh.clone(`terrain_copy_${index}`);
      terrainCopy.position.x = pos[0] * 10000;
      terrainCopy.position.z = pos[1] * 10000;
      terrainCopy.position.y = -1110.05;
      terrainCopy.material = this.mesh.material;

      new BABYLON.PhysicsAggregate(terrainCopy, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.0, friction: 1000000000.8 }, this.scene);

      return terrainCopy;
    });
  }

  update(pickInfo) {
    if (!pickInfo?.hit) return;
    this.tools.apply(this.currentTool, pickInfo);
  }

  setModels(models) {
    this.tools.setObjectTemplates(models);
  }

  dispose() {
    this.ui.dispose();
    this.material.dispose();
    this.tools.dispose();
  }
}
