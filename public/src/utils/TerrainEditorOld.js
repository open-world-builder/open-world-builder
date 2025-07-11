export class TerrainEditor {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.mesh = null; // Single BABYLON.Mesh for entire terrain
    this.brushSize = options.brushSize || 20;
    this.strength = options.strength || 10.1;

    // Track dirty regions for optimization
    this.dirtyRegions = new Set(); // Store affected vertex indices

    const customPlane = new BABYLON.Mesh("customGrass2FacePlane", scene);

    // Half-size positions (2x2 plane split horizontally into 2)
    const PlanePositions = [
      // Top quad
      -1,
      1,
      0, // 0 - top left
      1,
      1,
      0, // 1 - top right
      -1,
      0,
      0, // 2 - middle left
      1,
      0,
      0, // 3 - middle right

      // Bottom quad
      -1,
      0,
      0, // 4 - middle left (same as 2)
      1,
      0,
      0, // 5 - middle right (same as 3)
      -1,
      -1,
      0, // 6 - bottom left
      1,
      -1,
      0, // 7 - bottom right
    ];

    const indices = [
      0,
      2,
      1, // Top left triangle
      1,
      2,
      3, // Top right triangle
      4,
      6,
      5, // Bottom left triangle
      5,
      6,
      7, // Bottom right triangle
    ];

    const uvs = [
      // Top quad
      0,
      1, // 0 - top left
      1,
      1, // 1 - top right
      0,
      0.5, // 2 - middle left
      1,
      0.5, // 3 - middle right

      // Bottom quad
      0,
      0.5, // 4 - middle left
      1,
      0.5, // 5 - middle right
      0,
      0, // 6 - bottom left
      1,
      0, // 7 - bottom right
    ];

    const vertexData2 = new BABYLON.VertexData();
    vertexData2.positions = PlanePositions;
    vertexData2.indices = indices;
    vertexData2.uvs = uvs;
    vertexData2.applyToMesh(customPlane);

    this.grassTemplate = customPlane;
    // BABYLON.MeshBuilder.CreatePlane(
    //   "grassTemplate",
    //   {
    //     width: 2,
    //     height: 2,
    //     sideOrientation: BABYLON.Mesh.DOUBLESIDE,
    //   },
    //   scene
    // );
    this.grassTemplate.useVertexColors = true;
    this.grassTemplate.setEnabled(false);
    this.grassTemplate.applyFog = false;

    const vertexData = BABYLON.VertexData.ExtractFromMesh(this.grassTemplate);
    const positions = vertexData.positions;
    const numVertices = positions.length / 3;

    // Create colors array
    const colors = [];

    for (let i = 0; i < numVertices; i++) {
      const y = positions[i * 3 + 1]; // Y coordinate
      if (y > 0.9) {
        // Only color vertices very close to the top (y=1)
        // Top vertices - red
        colors.push(1, 0, 0, 1); // RGBA
      } else {
        // All other vertices - black
        colors.push(0, 0, 0, 1); // RGBA
      }
    }
    // Assign colors and apply to mesh
    vertexData.colors = colors;
    vertexData.applyToMesh(this.grassTemplate, true);

    // Create grass material
    const grassMaterial = new BABYLON.PBRCustomMaterial("grassMat", scene);
    // grassMaterial.diffuseTexture = new BABYLON.Texture(
    //   "/assets/textures/terrain/trees/leaf card test.png",
    //   scene
    // );
    const grassTexture = new BABYLON.Texture(
      "/assets/textures/terrain/trees/leaf card test.png",
      scene
    );
    grassTexture.hasAlpha = true;
    grassMaterial.albedoTexture = grassTexture;
    grassMaterial.emissiveTexture = grassTexture;

    grassMaterial.environmentIntensity = 2;
    grassMaterial.directIntensity = 2;
    // grassMaterial.diffuseTexture.hasAlpha = true;
    grassMaterial.albedoTexture.hasAlpha = true;

    grassMaterial.metallic = 0;
    grassMaterial._metallicF0Factor = 0;
    grassMaterial.backFaceCulling = true;
    grassMaterial.useAlphaFromAlbedoTexture = true;
    grassMaterial.transparencyMode = BABYLON.Material.MATERIAL_ALPHATEST;
    grassMaterial.environmentIntensity = 0.6;
    // grassMaterial.directIntensity = 10.2;
    grassMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
    grassMaterial.emissiveIntensity = 0.5;
    grassMaterial.alpha = 0.5;

    grassMaterial.AddUniform("iTime", "float", 0);
    grassMaterial.AddUniform("swayStrength", "float", 0.1);
    grassMaterial.AddUniform("swaySpeed", "float", 1.5);
    grassMaterial.onBindObservable.add(() => {
      const currentTime = performance.now() * 0.001; // Convert to seconds
      grassMaterial.getEffect().setFloat("iTime", currentTime);
      grassMaterial.getEffect().setFloat("swayStrength", this.swayStrength);
      grassMaterial.getEffect().setFloat("swaySpeed", this.swaySpeed);
    });

    grassMaterial.Vertex_MainEnd(`
      vColor = vec4(1.0); // Set vertex color to white
  `);
    //   grassMaterial.Vertex_Begin(`
    // #include<instancesDeclaration>;
    // #include<instancesVertex>;`);

    //     grassMaterial.Fragment_Definitions(`
    //     varying vec4 vColor;
    // `);
    // grassMaterial.AddAttribute("color", "vec4", 4);
    grassMaterial.Vertex_Before_PositionUpdated(`
// vec4 color = vec4(vColor.r, vColor.g, vColor.b, 1.0);
    highp float instanceIDFloat = float(gl_InstanceID);
    
    // // Generate noise based on world position
    float noise = sin(instanceIDFloat * 10.1 + iTime * swaySpeed);
    // // Apply sway effect
    float sway = noise * swayStrength;

    if (color.r > 0.99) {
    positionUpdated = position + vec3(sway * 0.5, sway * 0.8, sway * 0.5);
} else {
    // No sway
    positionUpdated = position;
}
`);
    grassMaterial.Fragment_Before_FragColor(`
    // finalColor.rgb = vColor.rgb;
`);

    const grassMaterialStandard = new BABYLON.StandardMaterial(
      "grassMatStandard",
      scene
    );
    grassMaterialStandard.diffuseTexture = grassTexture;
    grassMaterialStandard.diffuseTexture.hasAlpha = true;
    grassMaterialStandard.emissiveTexture = grassTexture;
    grassMaterialStandard.emissiveTexture.hasAlpha = true;
    this.grassTemplate.material = grassMaterial;

    // Create parent nodes for organization
    this.previewParent = new BABYLON.TransformNode("preview", scene);
    this.placedParent = new BABYLON.TransformNode("placed", scene);
    this.grassParent = new BABYLON.TransformNode("placedGrass", scene);

    this.previewMesh = null;
    // this.previewMaterial = this.createPreviewMaterial();
    // Testing Object Templates
    // this.objectTemplates = {
    //   1: BABYLON.MeshBuilder.CreateBox("template1", { size: 10 }, scene),
    //   2: BABYLON.MeshBuilder.CreateSphere("template2", { diameter: 10 }, scene),
    //   3: BABYLON.MeshBuilder.CreateCylinder(
    //     "template3",
    //     { height: 10, diameter: 10 },
    //     scene
    //   ),
    // };
    this.objectTemplates = {
      1: BABYLON.MeshBuilder.CreateBox("template1", { size: 10 }, scene),
      2: BABYLON.MeshBuilder.CreateSphere("template2", { diameter: 10 }, scene),
      3: BABYLON.MeshBuilder.CreateCylinder(
        "template3",
        { height: 10, diameter: 10 },
        scene
      ),
    };
    // Hide templates
    Object.values(this.objectTemplates).forEach((mesh) =>
      mesh.setEnabled(false)
    );

    this.placedObjectsHistory = [];
    this.redoStack = [];
    this.maxHistoryLength = 3;

    this.isPointerDown = false;
    this.currentTool = "raise";

    // Setup all pointer events
    this.setupPointerEvents();
    window.addEventListener("resize", () => this.updateTemplatePositions());

    this.createSaveLoadButtons();
  }

  setupPointerEvents() {
    this.scene.onPointerDown = (evt) => this.handlePointerDown(evt);
    this.scene.onPointerUp = (evt) => this.handlePointerUp(evt);
    this.scene.onPointerMove = () => this.handlePointerMove();
    this.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
        const key = kbInfo.event.key;
        if (["1", "2", "3", "4", "5", "6", "7", "8", "9"].includes(key)) {
          this.showObjectPreview(key);
        }
        if (key === "Escape") {
          // this.setTerrainTool("raise");
        }
        if (key === "t") {
          this.setTerrainTool("paint");
        }
        if (key === "l") {
          this.setTerrainTool("lighting");
        }
        if (key === "n") {
          this.setTerrainTool("grass");
        }
        if (kbInfo.event.ctrlKey || kbInfo.event.metaKey) {
          if (key === "z") {
            this.undo();
          } else if (key === "y") {
            this.redo();
          }
        }
      }
    });
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        // this.paintOnTerrain();
      }
    });
  }

  handlePointerDown(evt) {
    if (evt.button !== 0) return;
    this.isPointerDown = true;

    if (!this.previewMesh) return;

    const pickInfo = this.getPickInfo();
    if (pickInfo.hit) {
      this.selectedObject = this.addObjectAtLocation(
        this.currentTool,
        pickInfo.pickedPoint
      );
      // Store initial camera distance when object is placed
      const initialDistance = BABYLON.Vector3.Distance(
        this.scene.activeCamera.position,
        pickInfo.pickedPoint
      );
      this.dragStart = {
        mouseY: this.scene.pointerY,
        mouseX: this.scene.pointerX,
        objectY: this.selectedObject.position.y,
        rotation: this.selectedObject.rotation.y,
        initialDistance: initialDistance,
      };
      this.previewMesh.setEnabled(false);
    }
  }

  handlePointerUp(evt) {
    if (evt.button !== 0) return;
    this.isPointerDown = false;
    // Add physics

    if (this.selectedObject) {
      // if this.selectedObject.hasPhysics
      // todo make this depednad on object properties save in mysql table

      new BABYLON.PhysicsAggregate(
        this.selectedObject,
        BABYLON.PhysicsShapeType.MESH,
        { mass: 0, restitution: 0.2, friction: 0.8 },
        this.scene
      );
      this.selectedObject = null;
      // this.previewMesh.setEnabled(true);
    }

    // this.updatePhysics();
  }

  handlePointerMove() {
    const pickInfo = this.getPickInfo();

    // Handle object dragging
    if (this.selectedObject && this.isPointerDown) {
      this.selectedObject.rotationQuaternion =
        this.previewMesh.rotationQuaternion;
      // Calculate current distance and ratio compared to initial distance
      const currentDistance = BABYLON.Vector3.Distance(
        this.scene.activeCamera.position,
        this.selectedObject.position
      );

      // Calculate scale ratio (1 at initial distance, <1 when closer, >1 when farther)
      const distanceRatio = currentDistance / this.dragStart.initialDistance;

      // Apply scaling - using the original mesh scale (5) as the base
      // const baseScale = 5; // old base scale for parts.glm TODO make this dynamic for each glb file
      const baseScale = 1;

      this.selectedObject.position.y =
        this.dragStart.objectY -
        (this.scene.pointerY - this.dragStart.mouseY) *
          0.1 *
          baseScale *
          distanceRatio;

      this.selectedObject.scaling = new BABYLON.Vector3(
        baseScale * distanceRatio,
        baseScale * distanceRatio,
        baseScale * distanceRatio
      );

      // Adjust rotation - calculate rotation based on mouse movement
      const rotationSpeed = 0.003;
      const rotation =
        this.dragStart.rotation +
        (this.scene.pointerX - this.dragStart.mouseX) * rotationSpeed;

      if (this.selectedObject.rotationQuaternion) {
        this.selectedObject.rotationQuaternion =
          BABYLON.Quaternion.FromEulerAngles(
            this.selectedObject.rotationQuaternion.x,
            rotation,
            this.selectedObject.rotationQuaternion.z
          );
      }

      return;
    }

    if (pickInfo.hit) {
      if (this.previewMesh) {
        // Object placement mode
        this.previewMesh.position = pickInfo.pickedPoint;
        // this.brushIndicator.setEnabled(false);
      } else {
        // Terrain editing mode
        // this.updateBrushPosition(pickInfo);
        this.updateTerrainSelector(pickInfo);
        if (this.isPointerDown) {
          this.applyCurrentTool(pickInfo);
        }
      }
    }
  }
  placeGrass(pickInfo) {
    if (!pickInfo.hit) {
      return;
    }

    // console.log("Placing grass at:", pickInfo.pickedPoint);

    // Initialize the thin instances on the first placement
    if (!this.grassTemplate.thinInstanceCount) {
      console.log("Initializing grass template");
      this.grassTemplate.setEnabled(true);
      this.grassTemplate.thinInstanceAdd(BABYLON.Matrix.Identity());
      // Initialize color buffer for first instance
      this.grassColorData = new Float32Array(4);
      // this.grassColorData.set([1.0, 1.0, 1.0, 1.0]); // White color
      // this.grassTemplate.thinInstanceSetBuffer("size", this.grassColorData, 4);

      console.log(
        "Grass template initialized with count:",
        this.grassTemplate.thinInstanceCount
      );
    }

    // Configuration for grass placement
    const numGrassToPlace = 10; // Number of grass instances to place per click
    const placementRadius = 20; // Radius around picked point to place grass
    const centerPoint = pickInfo.pickedPoint;

    const newInstanceCount =
      this.grassTemplate.thinInstanceCount + numGrassToPlace;
    const newColorData = new Float32Array(4 * newInstanceCount);
    // Copy existing color data
    if (this.grassColorData) {
      newColorData.set(this.grassColorData);
    }

    for (
      let i = this.grassTemplate.thinInstanceCount;
      i < newInstanceCount;
      i++
    ) {
      const colorIdx = i * 4;
      newColorData[colorIdx + 0] = centerPoint.x; // Random R (0-1)
      newColorData[colorIdx + 1] = centerPoint.z; // Random G (0-1)
      newColorData[colorIdx + 2] = Math.random(); // Random B (0-1)
      newColorData[colorIdx + 3] = 1.0;
    }

    this.grassColorData = newColorData;

    // Place multiple grass instances
    for (let i = 0; i < numGrassToPlace; i++) {
      // Create random offset within the radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * placementRadius;
      const offsetX = Math.cos(angle) * distance;
      const offsetZ = Math.sin(angle) * distance;

      // Create position with offset
      const position = new BABYLON.Vector3(
        centerPoint.x + offsetX,
        centerPoint.y,
        centerPoint.z + offsetZ
      );

      // Random rotation around Y axis
      const rotation = BABYLON.Quaternion.RotationAxis(
        BABYLON.Axis.Y,
        Math.random() * Math.PI * 2
      );

      // Random scale variation
      const scale = 3.8 + Math.random() * 2.4; // Random scale between 3.8 and 6.2
      const scaling = new BABYLON.Vector3(scale, scale, scale);

      // Create and add the instance
      const matrix = BABYLON.Matrix.Compose(scaling, rotation, position);
      const idx = this.grassTemplate.thinInstanceAdd(matrix);
      // const instanceIdx = this.grassTemplate.thinInstanceAdd(matrix);

      // Store position as color data
      // const colorIdx = instanceIdx * 4;
      // this.grassColorData[colorIdx + 0] = position.x; // R = x position
      // this.grassColorData[colorIdx + 1] = position.y; // G = y position
      // this.grassColorData[colorIdx + 2] = position.z; // B = z position
      // this.grassColorData[colorIdx + 3] = 1.0;
    }
    // this.grassTemplate.thinInstanceSetBuffer("size", this.grassColorData, 4);
    // this.grassTemplate.thinInstanceSetBuffer("color", this.grassColorData, 4);
    // console.log("Total grass instances:", this.grassTemplate.thinInstanceCount);
  }

  updateTerrainSelector(pickInfo) {
    var uv = pickInfo.getTextureCoordinates();

    this.selectionCenter.x = uv.x;
    this.selectionCenter.y = uv.y;
  }

  createPreviewMaterial() {
    const previewMaterial = new BABYLON.StandardMaterial(
      "previewMat",
      this.scene
    );
    // this.previewMesh.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
    previewMaterial.alpha = 0.5;
    return previewMaterial;
  }
  showObjectPreview(key) {
    if (this.previewMesh) this.previewMesh.dispose();

    this.currentTool = key;
    this.previewMesh = this.objectTemplates[key].clone("preview");
    // TODO for each glb file
    // this.previewMesh.scaling = new BABYLON.Vector3(5, 5, 5);
    this.previewMesh.scaling = new BABYLON.Vector3(1, 1, 1);

    this.previewMesh.position.x = 0;
    this.previewMesh.position.y = 0;
    this.previewMesh.position.z = 0;
    this.previewMesh.isPickable = false;
    this.previewMesh.parent = this.previewParent;
    // this.previewMesh.material = this.previewMaterial();
    this.previewMesh.setEnabled(true);
    this.handlePointerMove();

    // this.previewMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0);
  }

  getTerrain() {
    return this.mesh;
  }

  setModels(models) {
    // Clear existing templates
    Object.values(this.objectTemplates).forEach((mesh) => mesh.dispose());
    this.objectTemplates = {};

    let meshes = [];
    models.getChildMeshes().forEach((mesh) => {
      // mesh.material.metallic = 0;
      // mesh.receiveShadows = true;
      // mesh.useVertexColors = true;
      // set levels
      // per model scaling
      mesh.scaling = new BABYLON.Vector3(1, 1, 1);
      meshes.push(mesh);
    });

    // Create new templates from the provided models
    let templateIndex = 1;
    meshes.forEach((mesh) => {
      this.objectTemplates[templateIndex] = mesh.clone(
        `template_${templateIndex}`
      );
      // this.objectTemplates[templateIndex].material =
      // new BABYLON.StandardMaterial("templateMat", this.scene);
      // this.objectTemplates[templateIndex].material.diffuseColor =
      // new BABYLON.Color3(0.5, 0.5, 1);
      this.objectTemplates[templateIndex].useVertexColors = false;
      this.objectTemplates[templateIndex].applyFog = false;
      this.objectTemplates[templateIndex].material._metallicF0Factor = 0;
      this.objectTemplates[templateIndex].material.emissiveIntensity = 0.0;

      //todo have an object configuration, that can contain multiple models like trees and trunks
      // for plants
      // this.objectTemplates[templateIndex].material.environmentIntensity = 0.1;
      // this.objectTemplates[templateIndex].material.directIntensity = 5.2;

      // for objects
      this.objectTemplates[templateIndex].material.environmentIntensity = 0.15;
      this.objectTemplates[templateIndex].material.directIntensity = 6.2;
      // this.objectTemplates[templateIndex].material.environmentIntensity = 0.3;
      // this.objectTemplates[templateIndex].material.directIntensity = 50.2;

      if (templateIndex === 1 || templateIndex === 3) {
        const pbrCustomMat = new BABYLON.PBRCustomMaterial(
          "pbrWindSwayMaterial",
          this.scene
        );
        pbrCustomMat.albedoTexture =
          this.objectTemplates[templateIndex].material.albedoTexture;
        pbrCustomMat.emissiveTexture =
          this.objectTemplates[templateIndex].material.emissiveTexture;
        pbrCustomMat.metallic = 0.0;
        pbrCustomMat._metallicF0Factor = 0.0;
        pbrCustomMat.backFaceCulling = false; //VERY IMPORTANT WHEN FALSE, NO DIRECTIONAL LIGHT, TRUE FOR DIRESTIONAL LIGHT BUT THINER TREES
        pbrCustomMat.AddUniform("iTime", "float", 0);
        pbrCustomMat.AddUniform("swayStrength", "float", 0.2);
        pbrCustomMat.AddUniform("swaySpeed", "float", 1.5);
        pbrCustomMat.Vertex_Before_PositionUpdated(`
float sway = sin(position.x * 2.0 + iTime * swaySpeed) * swayStrength;
        positionUpdated = position + vec3(0.0, sway, 0.0); // Apply sway in Y-axis
    `);

        this.swaySpeed = 2.3;
        this.swayStrength = 0.35;
        pbrCustomMat.onBindObservable.add(() => {
          const currentTime = performance.now() * 0.001; // Convert to seconds
          pbrCustomMat.getEffect().setFloat("iTime", currentTime);
          pbrCustomMat.getEffect().setFloat("swayStrength", this.swayStrength);
          pbrCustomMat.getEffect().setFloat("swaySpeed", this.swaySpeed);
        });
        this.objectTemplates[templateIndex].material = pbrCustomMat;

        // const testMesh = BABYLON.MeshBuilder.CreatePlane(
        //   "testPlane",
        //   { size: 20 },
        //   this.scene
        // );
        // // Set position to spawn point from terrain patch scene
        // const spawnPoint = new BABYLON.Vector3(1716.683, -775, 1277.427);
        // testMesh.position = spawnPoint;
        // testMesh.material = pbrCustomMat;
        this.pbrCustomMat = pbrCustomMat;
        //   const container = document.createElement("div");
        //   container.style.cssText = `
        //   position: absolute;
        //   top: 40%;
        //   left: 40%;
        //   transform: translate(-50%, -50%);
        //   z-index: 1000;
        //   cursor: move;
        //   user-select: none;
        //   translate: (100px, 100px);
        // `;
        //   document.body.appendChild(container);

        //   const PARAMS = {
        //     selectionRadius: 0.043,
        //     edgeSoftness: 0.1,
        //     selectionColor: { r: 1, g: 0, b: 0 },
        //     // Add new sway parameters
        //     swayStrength: 0.2,
        //     swaySpeed: 1.5,
        //   };

        //   const pane = new Tweakpane.Pane({
        //     title: "Post Processing 2",
        //     expanded: true,
        //     container: container,
        //   });

        //   const swayFolder = pane.addFolder({
        //     title: "Vegetation Sway",
        //   });

        //   swayFolder
        //     .addInput(PARAMS, "swayStrength", {
        //       label: "Strength",
        //       min: 0,
        //       max: 1,
        //       step: 0.01,
        //     })
        //     .on("change", ({ value }) => {
        //       // Update shader for templates 1 and 3
        //       this.swayStrength = value;
        //     });

        //   swayFolder
        //     .addInput(PARAMS, "swaySpeed", {
        //       label: "Speed",
        //       min: 0,
        //       max: 5,
        //       step: 0.1,
        //     })
        //     .on("change", ({ value }) => {
        //       this.swaySpeed = value;
        //     });

        this.objectTemplates[templateIndex].useVertexColors = false;
        this.objectTemplates[templateIndex].isPickable = true; // Ensures the mesh can be interacted with
        this.objectTemplates[templateIndex].alwaysSelectAsActiveMesh = true;

        //for tree imports
        this.objectTemplates[templateIndex].material.environmentIntensity = 0.6;
        this.objectTemplates[templateIndex].material.directIntensity = 10.2;
        this.objectTemplates[templateIndex].material.transparencyMode =
          BABYLON.Material.MATERIAL_ALPHATEST;
        // Set emissive color to white
        this.objectTemplates[templateIndex].material.emissiveColor =
          new BABYLON.Color3(1, 1, 1);
        // Set emissive intensity to 0.5
        this.objectTemplates[templateIndex].material.emissiveIntensity = 0.5;
      }

      if (templateIndex === 2) {
        //for tree imports
        this.objectTemplates[
          templateIndex
        ].material.environmentIntensity = 0.25;
        this.objectTemplates[templateIndex].material.directIntensity = 10.2;
        // this.objectTemplates[templateIndex].material.transparencyMode =
        //   BABYLON.Material.MATERIAL_ALPHATEST;
        // // Set emissive color to white
        // this.objectTemplates[templateIndex].material.emissiveColor =
        //   new BABYLON.Color3(1, 1, 1);
        // // Set emissive intensity to 0.5
        // this.objectTemplates[templateIndex].material.emissiveIntensity = 0.5;

        // standard for fog
        const albedoTexture =
          this.objectTemplates[templateIndex].material.albedoTexture;

        const emissiveTexture = albedoTexture.clone("emissiveTexture");

        // Create new StandardMaterial
        const standardMat = new BABYLON.StandardMaterial(
          "templateMat",
          this.scene
        );

        // Copy the albedo texture to diffuse
        standardMat.diffuseTexture = albedoTexture;
        // standardMat.emissiveTexture = emissiveTexture;
        standardMat.ambientTexture = emissiveTexture;
        // Set lighting properties
        standardMat.diffuseTexture.level = 10.25;
        // standardMat.emissiveTexture.level = 1.25;
        standardMat.ambientTexture.level = 1.25;

        // Additional standard material properties
        // standardMat.useAlphaFromDiffuseTexture = true;
        standardMat.specularColor = new BABYLON.Color3(0, 0, 0); // Reduce specular reflection
        standardMat.emissiveColor = new BABYLON.Color3(0, 0, 0);

        standardMat.useVertexColors = false;

        // Apply the material and fog
        this.objectTemplates[templateIndex].material = standardMat;
        this.objectTemplates[templateIndex].useVertexColors = false;
        this.objectTemplates[templateIndex].hasVertexAlpha = false;
        this.objectTemplates[templateIndex].applyFog = true;
      }

      this.objectTemplates[
        templateIndex
      ].material.useAlphaFromDiffuseTexture = true;
      templateIndex++;
    });

    this.setupTemplatePreview();
    this.showObjectPreview("1");

    // if (this.objectTemplates[4]) {
    //   // Dispose of old grass template if it exists
    //   if (this.grassTemplate) {
    //     this.grassTemplate.dispose();
    //   }

    //   // Clone the grass model and set it up
    //   this.grassTemplate = this.objectTemplates[4];
    //   this.grassTemplate.setEnabled(false); // Start disabled
    //   this.grassTemplate.parent = this.grassParent;
    //   this.grassTemplate.isPickable = false;
    //   console.log("Grass template initialized from model");
    // } else {
    //   console.warn("No grass model found in template 4, using default plane");
    //   // Keep the existing plane-based grass template
    // }
    // this.grassTemplate = this.objectTemplates[4].clone("grassTemplate");
    // this.grassTemplate.setEnabled(true);
    // this.grassTemplate.scaling = new BABYLON.Vector3(5, 5, 5);
    // this.grassTemplate.parent = this.grassParent;
    // this.grassTemplate.isPickable = false;
  }

  // Add method to switch back to terrain editing
  setTerrainTool(tool) {
    if (this.previewMesh) {
      this.previewMesh.dispose();
      this.previewMesh = null;
      this.selectedObject = null;
    }
    if (tool === "paint") {
      this.circleColor = new BABYLON.Vector3(0.0, 1.0, 0.42);
    }
    if (tool === "lighting") {
      this.circleColor = new BABYLON.Vector3(0.5, 0.5, 0.5);
    }
    if (tool === "grass") {
      this.circleColor = new BABYLON.Vector3(0.0, 0.5, 0.06);
    }
    this.currentTool = tool; // 'raise', 'lower', or 'flatten'
  }

  setShadowGenerator(shadowGenerator) {
    this.shadowGenerator = shadowGenerator;
  }

  addObjectAtLocation(templateKey, position) {
    if (!this.objectTemplates[templateKey]) return;

    const instance = this.objectTemplates[templateKey].createInstance(
      `object_${Date.now()}`
    );
    // Get the bounding box info and adjust Y position
    instance.position = position.clone();
    // instance.scaling = new BABYLON.Vector3(5, 5, 5); // get scale for each object
    instance.scaling = new BABYLON.Vector3(1, 1, 1); // get scale for each object
    instance.rotationQuaternion.x = this.previewMesh.rotationQuaternion.x;

    // const boundingInfo = instance.getBoundingInfo();
    // const height =
    //   boundingInfo.boundingBox.maximumWorld.y -
    //   boundingInfo.boundingBox.minimumWorld.y;
    // instance.position.y += height / 2;

    instance.parent = this.placedParent;

    instance.isPickable = false;

    if (this.shadowGenerator) {
      this.shadowGenerator.addShadowCaster(instance);
    }

    if (instance) {
      // Clear redo stack when new action is performed
      this.redoStack = [];

      // Add to history
      this.placedObjectsHistory.push(instance);

      // Keep only last 3 objects in history
      if (this.placedObjectsHistory.length > this.maxHistoryLength) {
        this.placedObjectsHistory.shift();
      }
    }

    return instance;
  }

  getPickInfo() {
    return this.scene.pick(
      this.scene.pointerX,
      this.scene.pointerY,
      (mesh) => mesh === this.mesh
    );
  }

  applyCurrentTool(pickInfo) {
    const tools = {
      raise: this.raise,
      lower: this.lower,
      flatten: this.flatten,
      paint: this.paintOnTerrain,
      lighting: this.paintOnTerrainLighting,
      grass: this.placeGrass,
    };

    tools[this.currentTool].call(this, pickInfo);
  }

  initialize(width, depth, subdivisions) {
    // Create single ground mesh
    this.mesh = BABYLON.MeshBuilder.CreateGround(
      "terrain",
      {
        width: width,
        height: depth,
        subdivisions: subdivisions,
      },
      this.scene
    );
    let gridConfig = {
      gridSize: 19,
    };

    // Initialize vertex colors - set default color for all vertices
    const positions = this.mesh.getVerticesData(
      BABYLON.VertexBuffer.PositionKind
    );
    const vertexCount = positions.length / 3;
    const colors = new Array(vertexCount * 4);

    for (let i = 0; i < vertexCount; i++) {
      const colorIndex = i * 4;
      colors[colorIndex] = 0.7; // R
      colors[colorIndex + 1] = 0.7; // G
      colors[colorIndex + 2] = 0.7; // B
      colors[colorIndex + 3] = 1.0; // A
    }

    this.mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colors);

    // Setup shader material
    const terrainMaterial = new BABYLON.ShaderMaterial(
      "terrain",
      this.scene,
      {
        vertex: "/shaders/env/terrain/slope_blender_terrain",
        fragment: "/shaders/env/terrain/slope_blender_terrain",
      },
      {
        attributes: ["position", "normal", "uv", "color"],
        uniforms: [
          "world",
          "worldView",
          "worldViewProjection",
          "view",
          "projection",
          "time",
          "viewProjection",
        ],
      }
    );

    // Setup textures
    terrainMaterial.setTexture(
      "grassTexture",
      new BABYLON.Texture("/assets/textures/terrain/darkgrass.png", this.scene)
    );
    terrainMaterial.setTexture(
      "rockTexture",
      new BABYLON.Texture("assets/textures/terrain/rock.png", this.scene)
    );
    // terrainMaterial.setTexture(
    //   "pathTexture",
    //   new BABYLON.Texture("assets/textures/terrain/floor.png", this.scene)
    // );
    terrainMaterial.setTexture(
      "transitionTexture",
      new BABYLON.Texture("assets/textures/terrain/terrainMask.png", this.scene)
    );
    terrainMaterial.setFloat("slopeThreshold", 0.05);
    terrainMaterial.setFloat("transitionSmoothness", 0.9);
    terrainMaterial.setFloat("transitionExtent", 0.1);
    terrainMaterial.setVector2(
      "grassScale",
      new BABYLON.Vector2(
        (7 * gridConfig.gridSize) / 19,
        (7 * gridConfig.gridSize) / 19
      )
    );
    terrainMaterial.setVector2(
      "rockScale",
      new BABYLON.Vector2(
        (6 * gridConfig.gridSize) / 19,
        (6 * gridConfig.gridSize) / 19
      )
    );
    terrainMaterial.setVector2(
      "transitionScale",
      new BABYLON.Vector2(
        (19 * gridConfig.gridSize) / 19,
        (19 * gridConfig.gridSize) / 19
      )
    );

    const terrainMaterial2 = new BABYLON.StandardMaterial(
      "terrainMaterial",
      this.scene
    );
    terrainMaterial2.diffuseTexture = new BABYLON.Texture(
      "/assets/textures/terrain/floor.png",
      this.scene
    );

    // Optional but recommended settings for terrain textures
    terrainMaterial2.diffuseTexture.uScale = 300; // Adjust the texture tiling in U direction
    terrainMaterial2.diffuseTexture.vScale = 300; // Adjust the texture tiling in V direction
    terrainMaterial2.specularColor = new BABYLON.Color3(0.0, 0.0, 0.0); // Reduce specular highlights
    terrainMaterial2.backFaceCulling = false; // E
    terrainMaterial2.specularPower = 128;
    terrainMaterial2.diffuseIntensity = 3;
    this.mesh.receiveShadows = true;

    this.fromHeightMap();

    this.initializeSplatmapCanvas();
    this.currentSplatColor = "rgba(255, 0, 0, 0.5)";
    this.textureBrushRadius = 0.5; // brush size in pixels

    // this.mesh.material = terrainMaterial2;
    this.updatePhysics(); // Add physics after initialization
    this.scene.physicsEnabled = true;

    // Create surrounding terrain copies
  }

  createSurroundingTerrain(width, depth) {
    // Positions for 8 surrounding terrain pieces (relative to center)
    const positions = [
      [-1, -1],
      [0, -1],
      [1, -1], // Top row
      [-1, 0],
      [1, 0], // Middle row
      [-1, 1],
      [0, 1],
      [1, 1], // Bottom row
    ];

    this.surroundingTerrain = positions.map((pos, index) => {
      const terrainCopy = this.mesh.clone(`terrain_copy_${index}`);

      // Position the terrain copy
      terrainCopy.position.x = pos[0] * width;
      terrainCopy.position.z = pos[1] * depth;
      terrainCopy.position.y = -1110.05;
      terrainCopy.computeWorldMatrix(true);
      terrainCopy.refreshBoundingInfo();
      terrainCopy.backFaceCulling = false;

      // Apply the same material as the main terrain
      terrainCopy.material = this.mesh.material;
      terrainCopy.alwaysSelectAsActiveMesh = true;
      // this.scene.activeCamera.maxZ = 500000;
      // terrainCopy.ignoreCameraMaxZ = true;

      // Add physics to the copy if needed
      new BABYLON.PhysicsAggregate(
        terrainCopy,
        BABYLON.PhysicsShapeType.MESH,
        { mass: 0, restitution: 0.0, friction: 1000000000.8 },
        this.scene
      );

      return terrainCopy;
    });
  }

  getMesh() {
    return this.mesh;
  }

  fromHeightMap() {
    BABYLON.MeshBuilder.CreateGroundFromHeightMap(
      "ground",
      "assets/textures/terrain/hieghtMap.png",
      {
        width: 10000,
        height: 10000,
        subdivisions: 100,
        minHeight: 0,
        maxHeight: 1000,
        onReady: (ground) => {
          ground.position.y = -1010.05;
          ground.material = this.mesh.material;
          ground.receiveShadows = true;

          // Update the mesh reference to use this ground
          if (this.mesh) {
            this.mesh.dispose();
          }
          this.mesh = ground;
          this.mesh.material = this.splatmapToMaterial;
          // Add physics
          this.updatePhysics();

          this.createSurroundingTerrain(10000, 10000);
        },
      },
      this.scene
    );
  }

  // Core editing function
  modifyTerrain(pickInfo, operation) {
    if (!pickInfo.hit) return;

    const positions = this.mesh.getVerticesData(
      BABYLON.VertexBuffer.PositionKind
    );
    const vertexCount = positions.length / 3;
    const currentPoint = pickInfo.pickedPoint;

    // Clear previous dirty regions
    this.dirtyRegions.clear();

    // Modify vertices within brush radius
    for (let i = 0; i < vertexCount; i++) {
      const vertexPosition = new BABYLON.Vector3(
        positions[i * 3],
        positions[i * 3 + 1],
        positions[i * 3 + 2]
      );

      const distance = BABYLON.Vector3.Distance(vertexPosition, currentPoint);
      if (distance < this.brushSize) {
        operation(positions, i);
        this.dirtyRegions.add(i);
      }
    }

    // Update mesh data
    this.updateMesh(positions);
  }

  // Update mesh with new data
  updateMesh(positions) {
    // Compute new normals
    const normals = [];
    BABYLON.VertexData.ComputeNormals(
      positions,
      this.mesh.getIndices(),
      normals,
      { useRightHandedSystem: true }
    );

    // Update mesh data
    this.mesh.updateVerticesData(
      BABYLON.VertexBuffer.PositionKind,
      positions,
      true
    );
    this.mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    this.mesh.refreshBoundingInfo();
    this.mesh.convertToFlatShadedMesh();
    this.mesh.refreshBoundingInfo();
    this.mesh.markAsDirty();
  }

  // Editing operations
  raise(pickInfo) {
    this.modifyTerrain(pickInfo, (positions, i) => {
      positions[i * 3 + 1] += this.strength;
    });
    this.updateBrushPosition(pickInfo);
  }

  lower(pickInfo) {
    this.modifyTerrain(pickInfo, (positions, i) => {
      positions[i * 3 + 1] -= this.strength;
    });
    this.updateBrushPosition(pickInfo);
  }

  flatten(pickInfo) {
    const targetHeight = pickInfo.pickedPoint.y;
    this.modifyTerrain(pickInfo, (positions, i) => {
      positions[i * 3 + 1] = targetHeight;
    });
    this.updateBrushPosition(pickInfo);
  }

  // Data handling
  serialize() {
    return {
      positions: this.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),
      colors: this.mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind),
      metadata: {
        width: this.mesh.width,
        height: this.mesh.height,
        subdivisions: this.mesh.subdivisions,
      },
    };
  }

  deserialize(data) {
    this.mesh.updateVerticesData(
      BABYLON.VertexBuffer.PositionKind,
      data.positions
    );
    if (data.colors) {
      this.mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, data.colors);
    }
    this.updateMesh(data.positions);
    this.updatePhysics(); // Add physics after loading
  }

  // Storage methods
  saveToLocalStorage(name) {
    localStorage.setItem(name, JSON.stringify(this.serialize()));
  }

  loadFromLocalStorage(name) {
    const data = JSON.parse(localStorage.getItem(name));
    if (data) this.deserialize(data);
  }

  exportToFile(filename = "terrain.json") {
    const blob = new Blob([JSON.stringify(this.serialize())], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async importFromFile(file) {
    const text = await file.text();
    this.deserialize(JSON.parse(text));
  }

  updatePhysics() {
    // Dispose of existing physics aggregate if it exists
    if (this.physicsAggregate) {
      this.physicsAggregate.dispose();
    }

    // Create new physics aggregate
    this.physicsAggregate = new BABYLON.PhysicsAggregate(
      this.mesh,
      BABYLON.PhysicsShapeType.MESH,
      { mass: 0, restitution: 0.0, friction: 1000000000.8 },
      this.scene
    );
  }

  // Add this method to update brush position
  updateBrushPosition(pickInfo) {
    if (!pickInfo.hit) {
      // this.brushIndicator.setEnabled(false);
      return;
    }

    this.brushIndicator.setEnabled(true);
    this.brushIndicator.position = pickInfo.pickedPoint;
    this.brushIndicator.position.y += 0.5; // Small offset to prevent z-fighting
  }

  undo() {
    if (this.placedObjectsHistory.length > 0) {
      const lastObject = this.placedObjectsHistory.pop();

      // Clean up physics before hiding the object
      if (lastObject.physicsBody) {
        lastObject.physicsBody.dispose();
      }
      this.redoStack.push(lastObject);
      lastObject.setEnabled(false); // Hide the object instead of disposing
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const objectToRestore = this.redoStack.pop();
      this.placedObjectsHistory.push(objectToRestore);
      objectToRestore.setEnabled(true); // Show the object again
    }
  }

  updateTemplatePositions() {
    const templateKeys = Object.keys(this.objectTemplates);
    const canvasWidth = this.scene.getEngine().getRenderWidth();
    const spacing = canvasWidth * 0.001;

    templateKeys.forEach((key, index) => {
      const template = this.objectTemplates[key];
      // Only update the x position
      const xOffset = (index - (templateKeys.length - 1) / 2) * spacing;
      template.position.x = xOffset;
    });
  }

  dispose() {
    window.removeEventListener("resize", () => this.updateTemplatePositions());
  }

  setupTemplatePreview() {
    const camera = this.scene.activeCamera;
    const templateKeys = Object.keys(this.objectTemplates);
    const canvasWidth = this.scene.getEngine().getRenderWidth();
    const spacing = canvasWidth * 0.001;
    const bottomOffset = -4; // Distance below camera
    // const templateScale = 0.1; // Scale for the template previews - for smaller
    const templateScale = 0.02; // Scale for the template previews - alrger

    templateKeys.forEach((key, index) => {
      const template = this.objectTemplates[key];
      template.setEnabled(true);
      template.isPickable = false;

      // Position relative to center
      const xOffset = (index - (templateKeys.length - 1) / 2) * spacing;
      template.position = new BABYLON.Vector3(xOffset, bottomOffset, 12);

      // Scale down the template
      template.scaling = new BABYLON.Vector3(
        templateScale,
        templateScale,
        templateScale
      );

      // Parent to camera
      template.parent = camera;
    });
  }

  createSaveLoadButtons() {
    // Create container for buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.position = "absolute";
    buttonContainer.style.bottom = "10px";
    buttonContainer.style.left = "10px";
    buttonContainer.style.zIndex = "1000";

    // Create Save button
    const saveButton = document.createElement("button");
    saveButton.textContent = "Save Scene";
    saveButton.style.marginRight = "10px";
    saveButton.style.padding = "8px 16px";
    saveButton.style.cursor = "pointer";
    saveButton.onclick = () => this.saveScene();

    // Create Load button
    const loadButton = document.createElement("button");
    loadButton.textContent = "Load Scene";
    loadButton.style.padding = "8px 16px";
    loadButton.style.cursor = "pointer";
    loadButton.onclick = () => this.loadScene();

    // Add buttons to container
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(loadButton);

    // Add container to document
    document.body.appendChild(buttonContainer);
  }

  saveScene() {
    const sceneData = {
      objects: this.placedParent.getChildMeshes().map((mesh) => ({
        // Extract template key from the instance name
        // Change this line to properly extract the template number
        templateKey: mesh.name.split("template_")[1]?.split("_")[0] || "1",
        position: {
          x: mesh.position.x,
          y: mesh.position.y,
          z: mesh.position.z,
        },
        rotation: {
          x: mesh.rotation.x,
          y: mesh.rotation.y,
          z: mesh.rotation.z,
        },
        scaling: {
          x: mesh.scaling.x,
          y: mesh.scaling.y,
          z: mesh.scaling.z,
        },
      })),
    };

    const blob = new Blob([JSON.stringify(sceneData)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  loadScene() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const sceneData = JSON.parse(e.target.result);
          this.loadSceneData(sceneData);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }

  loadSceneData(sceneData) {
    // Clear existing objects
    this.placedParent.getChildMeshes().forEach((mesh) => mesh.dispose());
    this.placedObjectsHistory = [];
    this.redoStack = [];

    // Recreate objects from saved data
    sceneData.objects.forEach((objData) => {
      // Convert templateKey to number and ensure it exists in objectTemplates
      const templateKey = parseInt(objData.templateKey);
      if (!this.objectTemplates[templateKey]) {
        console.warn(`Template ${templateKey} not found, skipping object`);
        return;
      }

      const instance = this.objectTemplates[templateKey].createInstance(
        `template_${templateKey}_${Date.now()}`
      );

      instance.position = new BABYLON.Vector3(
        objData.position.x,
        objData.position.y,
        objData.position.z
      );
      instance.rotation = new BABYLON.Vector3(
        objData.rotation.x,
        objData.rotation.y,
        objData.rotation.z
      );
      instance.scaling = new BABYLON.Vector3(
        objData.scaling.x,
        objData.scaling.y,
        objData.scaling.z
      );

      instance.parent = this.placedParent;
      instance.isPickable = false;

      if (this.shadowGenerator) {
        this.shadowGenerator.addShadowCaster(instance);
      }

      this.placedObjectsHistory.push(instance);
      if (this.placedObjectsHistory.length > this.maxHistoryLength) {
        this.placedObjectsHistory.shift();
      }
    });
  }

  createSplatmapControls() {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "80px";
    container.style.right = "10px";
    container.style.background = "rgba(0, 0, 0, 0.7)";
    container.style.padding = "10px";
    container.style.borderRadius = "8px";
    container.style.color = "white";
    container.style.zIndex = "1000";
    container.style.fontFamily = "Arial, sans-serif";

    const title = document.createElement("div");
    title.textContent = "Splatmap Texture";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "8px";
    container.appendChild(title);

    const textures = ["grass", "rock", "path"];
    textures.forEach((texture) => {
      const button = document.createElement("button");
      button.textContent = texture.charAt(0).toUpperCase() + texture.slice(1);
      button.style.margin = "4px";
      button.style.padding = "6px 12px";
      button.style.cursor = "pointer";
      button.style.border = "none";
      button.style.borderRadius = "4px";
      button.style.background = "#555";
      button.style.color = "white";

      button.onclick = () => {
        this.setBrushTexture(texture); // You can define what each tool does in setTerrainTool
      };

      container.appendChild(button);
    });

    document.body.appendChild(container);
  }

  setBrushTexture(tool) {
    // Update splatmap paint color according to selected tool
    switch (tool) {
      case "grass":
        this.currentSplatColor = "rgba(0, 255, 0, 0.5)";
        break;
      case "rock":
        this.currentSplatColor = "rgba(255, 0, 0, 0.5)";
        break;
      case "path":
        this.currentSplatColor = "rgba(0, 0, 255, 0.5)";
        break;
      default:
        this.currentSplatColor = "rgba(255, 0, 0, 0.5)";
    }
  }

  // Move to new file
  createSplatmapShader() {
    // Vertex shader (splatmapVertexShader)
    BABYLON.Effect.ShadersStore["splatmapVertexShader"] = `
    precision highp float;
    
    // Attributes from the mesh
    attribute vec3 position;
    attribute vec2 uv;
    
    // Uniform for transforming positions
    uniform mat4 worldViewProjection;
    
    // Varying to pass UV coordinates to the fragment shader
    varying vec2 vUV;
    
    void main(void) {
        vUV = uv;
        gl_Position = worldViewProjection * vec4(position, 1.0);
    }
`;

    // Fragment shader (splatmapFragmentShader)
    BABYLON.Effect.ShadersStore["splatmapFragmentShader"] = `
precision highp float;

// UV coordinates passed from the vertex shader
varying vec2 vUV;

// Sampler uniforms for the splatmap and textures
uniform sampler2D splatTexture;
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform sampler2D texture3;

// UV scale uniforms for each texture
uniform vec2 texture1Scale;
uniform vec2 texture2Scale;
uniform vec2 texture3Scale;

void main(void) {
    // Sample the splatmap; each channel controls a texture's weight
    vec4 splat = texture2D(splatTexture, vUV);
    
    // Sample each texture with its own UV scale
    vec4 tex1 = texture2D(texture1, vUV * texture1Scale);
    vec4 tex2 = texture2D(texture2, vUV * texture2Scale);
    vec4 tex3 = texture2D(texture3, vUV * texture3Scale);
    
    // Blend the textures based on the splatmap's red, green, and blue channels
    vec4 finalColor = tex1 * splat.r + tex2 * splat.g + tex3 * splat.b;
    
    gl_FragColor = finalColor;
}
`;

    var shaderMaterial = new BABYLON.ShaderMaterial(
      "splatmapMaterial",
      this.scene,
      {
        vertex: "splatmap",
        fragment: "splatmap",
      },
      {
        attributes: ["position", "uv"],
        uniforms: ["worldViewProjection"],
      }
    );

    // Set the textures used by the shader
    // Replace the paths with the URLs or file paths to your textures
    this.dynamicSplatTexture = new BABYLON.DynamicTexture(
      "splatTexture",
      this.splatmapCanvas,
      this.scene,
      false
    );
    // shaderMaterial.setTexture("splatTexture", this.dynamicSplatTexture);
    // shaderMaterial.setTexture("splatTexture", new BABYLON.Texture("path_to_your_splatmap.png", scene));
    shaderMaterial.setTexture(
      "texture1",
      new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene)
    );
    shaderMaterial.setTexture(
      "texture2",
      new BABYLON.Texture("/assets/textures/terrain/grass.png", this.scene)
    );
    shaderMaterial.setTexture(
      "texture3",
      new BABYLON.Texture("/assets/textures/terrain/floor.png", this.scene)
    );

    // Set UV scale factors (modify these vectors to achieve your desired tiling)
    shaderMaterial.setVector2(
      "texture1Scale",
      new BABYLON.Vector2(100.0, 100.0)
    );
    shaderMaterial.setVector2(
      "texture2Scale",
      new BABYLON.Vector2(100.0, 100.0)
    );
    shaderMaterial.setVector2(
      "texture3Scale",
      new BABYLON.Vector2(100.0, 100.0)
    );

    // Apply the shader material to your terrain mesh
    // this.splatmapToMaterial = shaderMaterial;

    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.value = "#ffffff"; // Default color
    colorPicker.style.position = "absolute";
    colorPicker.style.top = "10px";
    colorPicker.style.left = "10px";
    colorPicker.style.zIndex = "100";
    colorPicker.addEventListener("input", (e) => {
      const hex = e.target.value;
      const rgba = hexToRgba(hex, 1); // Alpha = 1 (fully opaque)
      this.currentLightColor = rgba;
    });
    this.currentLightColor = "rgba(0, 0, 0, 1)";
    function hexToRgba(hex, alpha = 1) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    document.body.appendChild(colorPicker);
    this.dynamicLightTexture = new BABYLON.DynamicTexture(
      "lightmapTexture",
      this.lightmapCanvas,
      this.scene,
      false
    );
    this.fillRandomAmbientMap();

    const splatMat = new SplatMapMaterial("splatMat", this.scene);
    splatMat.diffuseTexture = new BABYLON.Texture(
      "/assets/textures/terrain/undefined - Imgur.png",
      this.scene
    );
    // splatMat.ambientTexture = this.dynamicSplatTexture;
    // splatMat.lightmapTexture = this.dynamicLightTexture;
    splatMat.ambientTexture = this.dynamicLightTexture;
    splatMat.splatTexture = this.dynamicSplatTexture;

    splatMat.diffuseTexture.level = 5.0;
    splatMat.specularPower = 0.0;
    splatMat.specularColor = new BABYLON.Color3(0, 0, 0);

    const rockTex = new BABYLON.Texture(
      "/assets/textures/terrain/rock.png",
      this.scene
    );
    const grassTex = new BABYLON.Texture(
      "/assets/textures/terrain/grass_01.png",
      this.scene
    );
    const floorTex = new BABYLON.Texture(
      "/assets/textures/terrain/floor.png",
      this.scene
    );
    const symbolsTex = new BABYLON.Texture(
      "/assets/textures/terrain/symbols.png",
      this.scene
    );
    var startTime = Date.now();

    // this.AddUniform("selectionCenter", "vec2", selectionCenter);
    // this.AddUniform("selectionRadius", "float", 500.0);
    // this.AddUniform("edgeSoftness", "float", 0.1);
    // this.AddUniform("circleColor", "vec3", circleColor);
    this.circleColor = new BABYLON.Vector3(0.0, 1.0, 0.42);
    this.selectionCenter = new BABYLON.Vector2(0.7, 0.7);
    let selectionRadius = 0.0043;
    let edgeSoftness = 0.0073;
    const textureScale1 = new BABYLON.Vector2(100.0, 100.0);
    const textureScaleGrass = new BABYLON.Vector2(150.0, 150.0);
    splatMat.onBindObservable.add(() => {
      const effect = splatMat.getEffect();
      effect.setTexture("texture1", rockTex);
      effect.setTexture("texture2", grassTex);
      effect.setTexture("texture3", floorTex);
      effect.setTexture("uSymbolsTexture", symbolsTex);
      effect.setVector2("texture1Scale", textureScale1);
      effect.setVector2("texture2Scale", textureScaleGrass);
      effect.setVector2("texture3Scale", textureScale1);
      splatMat.getEffect().setTexture("splatmapSampler", splatMat.splatTexture);

      effect.setVector2("selectionCenter", this.selectionCenter);
      effect.setFloat("selectionRadius", selectionRadius);
      effect.setFloat("edgeSoftness", edgeSoftness);
      effect.setVector3("circleColor", this.circleColor);

      var currentTime = (Date.now() - startTime) / 1000; // Time in seconds
      effect.setFloat("time", currentTime);
    });

    //   // Create and style a container div for Tweakpane
    //   const container = document.createElement("div");
    //   container.style.cssText = `
    //   position: absolute;
    //   top: 50%;
    //   left: 50%;
    //   transform: translate(-50%, -50%);
    //   z-index: 1000;
    //   cursor: move;
    //   user-select: none;
    //   translate: (100px, 100px);
    // `;
    //   document.body.appendChild(container);

    //   // Create Tweakpane inside the container
    //   const pane = new Tweakpane.Pane({
    //     title: "Post Processing",
    //     expanded: true,
    //     container: container,
    //   });

    //   // Make the panel draggable
    //   let isDragging = false;
    //   let currentX;
    //   let currentY;
    //   let initialX;
    //   let initialY;
    //   let xOffset = 0;
    //   let yOffset = 0;

    //   container.addEventListener("mousedown", dragStart);
    //   document.addEventListener("mousemove", drag);
    //   document.addEventListener("mouseup", dragEnd);

    //   function dragStart(e) {
    //     if (e.target.classList.contains("tp-rotv_t")) {
    //       // Only drag from title bar
    //       initialX = e.clientX - xOffset;
    //       initialY = e.clientY - yOffset;
    //       isDragging = true;
    //     }
    //   }

    //   function drag(e) {
    //     if (isDragging) {
    //       e.preventDefault();
    //       currentX = e.clientX - initialX;
    //       currentY = e.clientY - initialY;
    //       xOffset = currentX;
    //       yOffset = currentY;

    //       container.style.transform = `translate(${currentX}px, ${currentY}px)`;
    //     }
    //   }

    //   function dragEnd() {
    //     isDragging = false;
    //   }

    //   // Rest of your Tweakpane setup code...
    //   const PARAMS = {
    //     selectionRadius: 0.043,
    //     edgeSoftness: 0.1,
    //     selectionColor: { r: 1, g: 0, b: 0 },
    //   };

    //   const lutFolder = pane.addFolder({
    //     title: "Selection",
    //   });

    //   lutFolder
    //     .addInput(PARAMS, "selectionRadius", {
    //       label: "selectionRadius",
    //       min: 0,
    //       max: 0.1,
    //       format: (v) => v.toFixed(4),
    //     })
    //     .on("change", ({ value }) => {
    //       selectionRadius = value;
    //     });

    //   lutFolder
    //     .addInput(PARAMS, "edgeSoftness", {
    //       label: "edgeSoftness",
    //       min: 0,
    //       max: 0.015,
    //       format: (v) => v.toFixed(4),
    //     })
    //     .on("change", ({ value }) => {
    //       edgeSoftness = value;
    //     });

    //   lutFolder
    //     .addInput(PARAMS, "selectionColor", {
    //       label: "Selection Color",
    //       color: { type: "float" }, // Use float type for 0-1 range
    //     })
    //     .on("change", ({ value }) => {
    //       circleColor = new BABYLON.Vector3(value.r, value.g, value.b);
    //     });

    // this.fillRandomSplatmap();
    // this.dynamicSplatTexture.update();
    // this.splatMat.getEffect().setTexture("splatTexture", this.dynamicSplatTexture);

    // // this.dynamicSplatTexture = new BABYLON.DynamicTexture("splatTexture", this.splatmapCanvas, this.scene, false);
    // splatMat.setSplatTexture(this.dynamicSplatTexture);
    // splatMat.setTexture1(new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene));
    // splatMat.setTexture2(new BABYLON.Texture("/assets/textures/terrain/grass.png", this.scene));
    // splatMat.setTexture3(new BABYLON.Texture("/assets/textures/terrain/floor.png", this.scene));

    // // Optionally, adjust the UV scale
    // splatMat.setTexture1Scale(new BABYLON.Vector2(100, 100));
    // splatMat.setTexture2Scale(new BABYLON.Vector2(100, 100));
    // splatMat.setTexture3Scale(new BABYLON.Vector2(100, 100));
    //set specular power 0.5 and specolar color grey

    this.splatmapToMaterial = splatMat;

    // const splatMat2 = new SplatmapMaterial2("splatMat", this.scene);
    // splatMat2.setTexture("splatTexture", this.dynamicSplatTexture);
    // splatMat2.SetTexture
    // splatMat.setTexture1(new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene));
    // this.splatmapToMaterial = splatMat2;

    // var pbr = new BABYLON.PBRMaterial("pbr", this.scene);
    // pbr.albedoColor = new BABYLON.Color3(1, 1, 1);

    // // Attach the splat map plugin to the material
    // var splatPlugin = new SplatMapMaterialPlugin(pbr, "splat bpc plugin", 10, this.scene);

    // // Make sure the plugin’s code is activated by adding a define
    // pbr.getEffect().getDefines().push("#define SPLATMAP_PLUGIN");

    // // Finally, assign the material to a mesh
    // this.splatmapToMaterial = pbr;
  }
  initializeSplatmapCanvas() {
    // Create the canvas element
    this.splatmapCanvas = document.createElement("canvas");
    this.splatmapCanvas.id = "paintingCanvas";
    this.splatmapCanvas.width = 200; // Set desired width
    this.splatmapCanvas.height = 200; // Set desired height

    // Style the canvas for positioning
    this.splatmapCanvas.style.position = "absolute";
    this.splatmapCanvas.style.top = "200px";
    this.splatmapCanvas.style.right = "10px";
    this.splatmapCanvas.style.border = "1px solid #000";
    this.splatmapCanvas.style.zIndex = "1000"; // Ensure it's above other elements
    this.splatmapCanvas.style.display = "none";
    // Append the canvas to the body or a specific container
    document.body.appendChild(this.splatmapCanvas);

    this.lightmapCanvas = document.createElement("canvas");
    this.lightmapCanvas.id = "lightmapCanvas";
    this.lightmapCanvas.width = 200; // Set desired width
    this.lightmapCanvas.height = 200; // Set desired height

    // Style the canvas for positioning
    this.lightmapCanvas.style.position = "absolute";
    this.lightmapCanvas.style.top = "400px";
    this.lightmapCanvas.style.right = "10px";
    this.lightmapCanvas.style.border = "1px solid #000";
    this.lightmapCanvas.style.zIndex = "1000"; // Ensure it's above other elements
    this.lightmapCanvas.style.display = "none";
    this.lightmapCtx = this.lightmapCanvas.getContext("2d");
    document.body.appendChild(this.lightmapCanvas);

    this.createSplatmapShader();

    this.splatmapCtx = this.splatmapCanvas.getContext("2d");
    this.fillRandomSplatmap();

    // Set up painting event listeners
    this.isPainting = false;

    this.splatmapCanvas.addEventListener("mousedown", (e) => {
      this.isPainting = true;
      this.paint(e);
      this.updateSplatmapTexture();
    });

    this.splatmapCanvas.addEventListener("mousemove", (e) => {
      if (this.isPainting) {
        this.paint(e);
        this.updateSplatmapTexture();
      }
    });

    this.splatmapCanvas.addEventListener("mouseup", () => {
      this.isPainting = false;
      this.updateSplatmapTexture();
    });

    this.splatmapCanvas.addEventListener("mouseleave", () => {
      this.isPainting = false;
    });

    this.createSplatmapControls();
  }

  paint(event) {
    const rect = this.splatmapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const brushSize = 10; // Adjust brush size as needed

    this.splatmapCtx.fillStyle = this.currentSplatColor;
    this.splatmapCtx.beginPath();
    this.splatmapCtx.arc(x, y, brushSize, 0, 2 * Math.PI);
    this.splatmapCtx.fill();
  }

  createSplatmapTexture() {
    const width = this.splatmapCanvas.width;
    const height = this.splatmapCanvas.height;
    const textureData = new Uint8Array(width * height * 4);

    // Initialize texture data (e.g., fill with transparent pixels)
    for (let i = 0; i < textureData.length; i += 4) {
      textureData[i] = 0; // R
      textureData[i + 1] = 0; // G
      textureData[i + 2] = 0; // B
      textureData[i + 3] = 0; // A
    }

    this.splatmapTexture = new BABYLON.RawTexture(
      textureData,
      width,
      height,
      BABYLON.Engine.TEXTUREFORMAT_RGBA,
      this.scene,
      false,
      false,
      BABYLON.Texture.NEAREST_SAMPLINGMODE,
      BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT
    );

    // Apply the splatmap texture to your terrain material
    this.applySplatmapToMaterial();
  }

  paintOnTerrain(pickInfo) {
    // Use pick info to get intersection data on the terrain mesh
    // var pickInfo = this.getPickInfo();

    // Ensure we hit the terrain and have valid UV coordinates
    if (pickInfo.hit && pickInfo.getTextureCoordinates()) {
      var uv = pickInfo.getTextureCoordinates();

      // this.selectionCenter.x = uv.x;
      // this.selectionCenter.y = uv.y;

      // Convert UV (range 0-1) to canvas coordinates
      var canvasX = uv.x * this.splatmapCanvas.width;
      // Flip Y coordinate: canvas origin is top-left, but UV origin is bottom-left
      var canvasY = (1 - uv.y) * this.splatmapCanvas.height;

      // Define your brush properties
      this.splatmapCtx.beginPath();
      this.splatmapCtx.arc(
        canvasX,
        canvasY,
        this.textureBrushRadius,
        0,
        Math.PI * 2
      );
      // Choose a fill color; for example, red with some transparency
      this.splatmapCtx.fillStyle = this.currentSplatColor;
      this.splatmapCtx.fill();

      // Update the dynamic texture so the shader sees the new paint
      this.dynamicSplatTexture.update();
      // this.splatMat.getEffect().setTexture("splatTexture", this.dynamicSplatTexture);
    }
  }

  paintOnTerrainLighting(pickInfo) {
    if (pickInfo.hit && pickInfo.getTextureCoordinates()) {
      var uv = pickInfo.getTextureCoordinates();
      // Convert UV (range 0-1) to canvas coordinates
      var canvasX = uv.x * this.lightmapCanvas.width;
      // Flip Y coordinate: canvas origin is top-left, but UV origin is bottom-left
      var canvasY = (1 - uv.y) * this.lightmapCanvas.height;

      // Define your brush properties
      this.lightmapCtx.beginPath();
      this.lightmapCtx.arc(
        canvasX,
        canvasY,
        this.textureBrushRadius,
        0,
        Math.PI * 2
      );
      // Choose a fill color; for example, red with some transparency
      this.lightmapCtx.fillStyle = this.currentLightColor;
      this.lightmapCtx.fill();

      // Update the dynamic texture so the shader sees the new paint
      this.dynamicLightTexture.update();
      // this.splatMat.getEffect().setTexture("splatTexture", this.dynamicSplatTexture);
    }
  }
  fillRandomSplatmap() {
    const width = this.splatmapCanvas.width;
    const height = this.splatmapCanvas.height;
    let imageData = this.splatmapCtx.createImageData(width, height);
    let data = imageData.data;

    let base = 80;
    // Loop over each pixel and assign random colors
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.floor(Math.random() * 125); // Red
      data[i + 1] = Math.floor(Math.random() * 125); // Green
      data[i + 2] = Math.floor(Math.random() * 125); // Blue
      data[i + 3] = 255; // Alpha (fully opaque)
      if (data[i] < base && data[i] < base && data[i] < base) {
        data[i] = 125;
      }
    }

    // Update the canvas with the random image data
    this.splatmapCtx.putImageData(imageData, 0, 0);
    this.dynamicSplatTexture.update();
  }

  fillRandomAmbientMap() {
    const width = this.lightmapCanvas.width;
    const height = this.lightmapCanvas.height;
    let imageData = this.lightmapCtx.createImageData(width, height);
    let data = imageData.data;
    let base = 100;
    // Loop over each pixel and assign random colors
    for (let i = 0; i < data.length; i += 4) {
      let val = Math.floor((Math.random() / 3) * 256 + base);
      data[i] = val; // Red
      data[i + 1] = val; // Green
      data[i + 2] = val; // Blue
      data[i + 3] = 255; // Alpha (fully opaque)
    }

    // Update the canvas with the random image data
    this.lightmapCtx.putImageData(imageData, 0, 0);
    this.dynamicLightTexture.update();
  }

  updateSplatmapTexture() {
    this.dynamicSplatTexture.update();
  }
}

class SplatMapMaterial extends BABYLON.CustomMaterial {
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
