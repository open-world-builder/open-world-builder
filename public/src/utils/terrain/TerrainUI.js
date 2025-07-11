export class TerrainUI {
  constructor(editor) {
    this.editor = editor;
    this.dragStart = null;
  }

  setupEvents() {
    this.setupPointerEvents();
    this.setupKeyboardEvents();
    // this.setupControlPanel();
    this.createSaveLoadButtons();

    window.addEventListener("resize", () => this.updateTemplatePositions());
  }

  setupPointerEvents() {
    this.editor.scene.onPointerDown = (evt) => {
      if (evt.button !== 0) return;
      this.editor.isPointerDown = true;

      const pickInfo = this.getPickInfo();
      if (!pickInfo.hit) return;

      if (this.editor.previewMesh) {
        this.handleObjectPlacement(pickInfo);
      } else {
        this.editor.update(pickInfo);
      }
    };

    this.editor.scene.onPointerUp = (evt) => {
      if (evt.button !== 0) return;
      this.editor.isPointerDown = false;

      if (this.editor.selectedObject) {
        this.finalizeObjectPlacement();
      }
    };

    this.editor.scene.onPointerMove = () => {
      const pickInfo = this.getPickInfo();

      if (this.editor.selectedObject && this.editor.isPointerDown) {
        this.handleObjectDragging(pickInfo);
      } else if (pickInfo.hit) {
        this.handlePointerMove(pickInfo);
      }
    };
  }

  handlePointerMove(pickInfo) {
    if (this.editor.previewMesh) {
      this.editor.previewMesh.position = pickInfo.pickedPoint;
    } else {
      this.editor.updateTerrainSelector(pickInfo);
      if (this.editor.isPointerDown) {
        this.handleTerrainEdit(pickInfo);
      }
    }
  }

  setupKeyboardEvents() {
    this.editor.scene.onKeyboardObservable.add((kbInfo) => {
      if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
        this.handleKeyPress(kbInfo.event);
      }
    });
  }

  handleKeyPress(event) {
    const toolMap = {
      t: "paint",
      l: "lighting",
      n: "grass",
    };

    if (toolMap[event.key]) {
      this.editor.currentTool = toolMap[event.key];
    } else if (/[1-9]/.test(event.key)) {
      this.showObjectPreview(event.key);
    } else if (event.key === "Escape") {
      this.clearPreview();
    } else if (event.ctrlKey || event.metaKey) {
      if (event.key === "z") this.editor.tools.undo();
      if (event.key === "y") this.editor.tools.redo();
    }
  }

  handleObjectPlacement(pickInfo) {
    this.editor.selectedObject = this.editor.tools.addObjectAtLocation(this.editor.currentTool, pickInfo.pickedPoint);

    this.dragStart = {
      mouseY: this.editor.scene.pointerY,
      mouseX: this.editor.scene.pointerX,
      objectY: this.editor.selectedObject.position.y,
      rotation: this.editor.selectedObject.rotation.y,
      initialDistance: BABYLON.Vector3.Distance(this.editor.scene.activeCamera.position, pickInfo.pickedPoint),
    };

    this.editor.previewMesh.setEnabled(false);
  }

  handleObjectDragging(pickInfo) {
    if (!this.dragStart) return;

    const currentDistance = BABYLON.Vector3.Distance(this.editor.scene.activeCamera.position, this.editor.selectedObject.position);

    const distanceRatio = currentDistance / this.dragStart.initialDistance;
    const baseScale = 1;

    // Update position
    this.editor.selectedObject.position.y = this.dragStart.objectY - (this.editor.scene.pointerY - this.dragStart.mouseY) * 0.1 * baseScale * distanceRatio;

    // Update scale
    this.editor.selectedObject.scaling = new BABYLON.Vector3(baseScale * distanceRatio, baseScale * distanceRatio, baseScale * distanceRatio);

    // Update rotation
    const rotation = this.dragStart.rotation + (this.editor.scene.pointerX - this.dragStart.mouseX) * 0.003;

    if (this.editor.selectedObject.rotationQuaternion) {
      this.editor.selectedObject.rotationQuaternion = BABYLON.Quaternion.FromEulerAngles(this.editor.selectedObject.rotationQuaternion.x, rotation, this.editor.selectedObject.rotationQuaternion.z);
    }
  }

  finalizeObjectPlacement() {
    if (this.editor.selectedObject) {
      new BABYLON.PhysicsAggregate(this.editor.selectedObject, BABYLON.PhysicsShapeType.MESH, { mass: 0, restitution: 0.2, friction: 0.8 }, this.editor.scene);
      this.editor.selectedObject = null;
    }
  }

  createSaveLoadButtons() {
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.bottom = "10px";
    container.style.left = "10px";
    container.style.zIndex = "1000";

    const saveButton = this.createButton("Save Scene", () => this.saveScene());
    const loadButton = this.createButton("Load Scene", () => this.loadScene());

    container.appendChild(saveButton);
    container.appendChild(loadButton);
    document.body.appendChild(container);
  }

  createButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.style.marginRight = "10px";
    button.style.padding = "8px 16px";
    button.style.cursor = "pointer";
    button.onclick = onClick;
    return button;
  }

  getPickInfo() {
    return this.editor.scene.pick(this.editor.scene.pointerX, this.editor.scene.pointerY, (mesh) => mesh === this.editor.mesh);
  }

  dispose() {
    window.removeEventListener("resize", () => this.updateTemplatePositions());
  }
}
