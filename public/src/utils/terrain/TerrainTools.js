export class TerrainTools {
  constructor(editor) {
    this.editor = editor;
    this.brushSize = 20;
    this.strength = 10.1;
    this.objectTemplates = {};
    this.grassTemplate = null;

    // History management
    this.placedObjectsHistory = [];
    this.redoStack = [];
    this.maxHistoryLength = 3;
  }

  apply(tool, pickInfo) {
    const tools = {
      raise: this.raise.bind(this),
      lower: this.lower.bind(this),
      paint: this.paint.bind(this),
      grass: this.placeGrass.bind(this),
      lighting: this.paintLighting.bind(this),
    };

    if (tools[tool]) {
      tools[tool](pickInfo);
    }
  }

  modifyTerrain(pickInfo, operation) {
    const positions = this.editor.mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const point = pickInfo.pickedPoint;

    for (let i = 0; i < positions.length; i += 3) {
      const vertex = new BABYLON.Vector3(positions[i], positions[i + 1], positions[i + 2]);

      if (BABYLON.Vector3.Distance(vertex, point) < this.brushSize) {
        positions[i + 1] = operation(positions[i + 1]);
      }
    }

    this.editor.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    this.updateMesh(positions);
  }

  raise(pickInfo) {
    this.modifyTerrain(pickInfo, (y) => y + this.strength);
  }

  lower(pickInfo) {
    this.modifyTerrain(pickInfo, (y) => y - this.strength);
  }

  paint(pickInfo) {
    const uv = pickInfo.getTextureCoordinates();
    this.editor.material.paint(uv.x, uv.y);
  }

  paintLighting(pickInfo) {
    const uv = pickInfo.getTextureCoordinates();
    this.editor.material.paintLighting(uv.x, uv.y);
  }

  placeGrass(pickInfo) {
    if (!this.grassTemplate) return;

    const numGrassToPlace = 10;
    const placementRadius = 20;
    const centerPoint = pickInfo.pickedPoint;

    for (let i = 0; i < numGrassToPlace; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * placementRadius;
      const position = new BABYLON.Vector3(centerPoint.x + Math.cos(angle) * distance, centerPoint.y, centerPoint.z + Math.sin(angle) * distance);

      const matrix = BABYLON.Matrix.Compose(new BABYLON.Vector3(3.8 + Math.random() * 2.4), BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, Math.random() * Math.PI * 2), position);

      this.grassTemplate.thinInstanceAdd(matrix);
    }
  }

  setObjectTemplates(models) {
    // Implementation of setting object templates
    // This would include the existing template setup logic
  }

  // Add this method
  addObjectAtLocation(templateKey, position) {
    if (!this.objectTemplates[templateKey]) return;

    const instance = this.objectTemplates[templateKey].createInstance(`object_${Date.now()}`);

    // Set transform
    instance.position = position.clone();
    instance.scaling = new BABYLON.Vector3(1, 1, 1);

    // Copy rotation from preview if available
    if (this.editor.previewMesh?.rotationQuaternion) {
      instance.rotationQuaternion = this.editor.previewMesh.rotationQuaternion.clone();
    }

    // Setup instance properties
    instance.parent = this.editor.placedParent;
    instance.isPickable = false;

    // Add shadows if available
    if (this.editor.shadowGenerator) {
      this.editor.shadowGenerator.addShadowCaster(instance);
    }

    // Handle history
    if (instance) {
      this.redoStack = [];
      this.placedObjectsHistory.push(instance);

      if (this.placedObjectsHistory.length > this.maxHistoryLength) {
        this.placedObjectsHistory.shift();
      }
    }

    return instance;
  }

  updateMesh(positions) {
    const normals = [];
    BABYLON.VertexData.ComputeNormals(positions, this.editor.mesh.getIndices(), normals);

    this.editor.mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    this.editor.mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    this.editor.mesh.refreshBoundingInfo();
  }

  // History management methods
  undo() {
    if (this.placedObjectsHistory.length > 0) {
      const lastObject = this.placedObjectsHistory.pop();
      if (lastObject.physicsBody) {
        lastObject.physicsBody.dispose();
      }
      this.redoStack.push(lastObject);
      lastObject.setEnabled(false);
    }
  }

  redo() {
    if (this.redoStack.length > 0) {
      const objectToRestore = this.redoStack.pop();
      this.placedObjectsHistory.push(objectToRestore);
      objectToRestore.setEnabled(true);
    }
  }
}
