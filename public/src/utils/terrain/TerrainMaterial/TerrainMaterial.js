import { SplatMapMaterial } from "./Custom/SplatMapMaterial.js";

export class TerrainMaterial {
  constructor(scene) {
    this.scene = scene;

    // Canvas setup
    this.splatmap = this.createCanvas(200);
    this.lightmap = this.createCanvas(200);

    // Material properties
    this.swaySpeed = 2.3;
    this.swayStrength = 0.35;
    this.circleColor = new BABYLON.Vector3(0.0, 1.0, 0.42);
    this.selectionCenter = new BABYLON.Vector2(0.7, 0.7);
  }

  initialize() {
    this.setupCanvasUI();
    this.fillRandomSplatmap();
    this.fillRandomAmbientMap();
  }

  create() {
    const material = new SplatMapMaterial("splatMat", this.scene);

    // Setup textures
    material.diffuseTexture = new BABYLON.Texture("/assets/textures/terrain/undefined - Imgur.png", this.scene);
    material.ambientTexture = this.lightmap.texture;
    material.splatTexture = this.splatmap.texture;

    // Configure material properties
    material.diffuseTexture.level = 5.0;
    material.specularPower = 0.0;
    material.specularColor = new BABYLON.Color3(0, 0, 0);

    this.setupShaderTextures(material);
    this.setupShaderBindings(material);

    return material;
  }

  setupShaderTextures(material) {
    const textures = {
      rock: new BABYLON.Texture("/assets/textures/terrain/rock.png", this.scene),
      grass: new BABYLON.Texture("/assets/textures/terrain/grass_01.png", this.scene),
      floor: new BABYLON.Texture("/assets/textures/terrain/floor.png", this.scene),
      symbols: new BABYLON.Texture("/assets/textures/terrain/symbols.png", this.scene),
    };

    this.textures = textures;
  }

  setupShaderBindings(material) {
    const startTime = Date.now();

    material.onBindObservable.add(() => {
      const effect = material.getEffect();

      // Bind textures
      effect.setTexture("texture1", this.textures.rock);
      effect.setTexture("texture2", this.textures.grass);
      effect.setTexture("texture3", this.textures.floor);
      effect.setTexture("uSymbolsTexture", this.textures.symbols);

      // Set scaling
      effect.setVector2("texture1Scale", new BABYLON.Vector2(100.0, 100.0));
      effect.setVector2("texture2Scale", new BABYLON.Vector2(150.0, 150.0));
      effect.setVector2("texture3Scale", new BABYLON.Vector2(100.0, 100.0));

      // Set selection properties
      effect.setVector2("selectionCenter", this.selectionCenter);
      effect.setFloat("selectionRadius", 0.0043);
      effect.setFloat("edgeSoftness", 0.0073);
      effect.setVector3("circleColor", this.circleColor);

      // Update time
      effect.setFloat("time", (Date.now() - startTime) / 1000);
    });
  }

  createCanvas(size) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = size;
    canvas.style.position = "absolute";
    canvas.style.border = "1px solid #000";
    canvas.style.zIndex = "1000";
    canvas.style.display = "none";

    return {
      element: canvas,
      context: canvas.getContext("2d"),
      texture: new BABYLON.DynamicTexture(`map_${Date.now()}`, size, this.scene),
    };
  }

  paint(x, y) {
    const ctx = this.splatmap.context;
    ctx.beginPath();
    ctx.arc(x * this.splatmap.element.width, y * this.splatmap.element.height, 10, 0, Math.PI * 2);
    ctx.fillStyle = this.currentSplatColor;
    ctx.fill();
    this.splatmap.texture.update();
  }

  paintLighting(x, y) {
    const ctx = this.lightmap.context;
    ctx.beginPath();
    ctx.arc(x * this.lightmap.element.width, y * this.lightmap.element.height, 10, 0, Math.PI * 2);
    ctx.fillStyle = this.currentLightColor;
    ctx.fill();
    this.lightmap.texture.update();
  }

  fillRandomSplatmap() {
    const ctx = this.splatmap.context;
    const imageData = ctx.createImageData(this.splatmap.element.width, this.splatmap.element.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const base = 80;
      imageData.data[i] = Math.floor(Math.random() * 125);
      imageData.data[i + 1] = Math.floor(Math.random() * 125);
      imageData.data[i + 2] = Math.floor(Math.random() * 125);
      imageData.data[i + 3] = 255;

      if (imageData.data[i] < base) {
        imageData.data[i] = 125;
      }
    }

    ctx.putImageData(imageData, 0, 0);
    this.splatmap.texture.update();
  }

  fillRandomAmbientMap() {
    const ctx = this.lightmap.context;
    const imageData = ctx.createImageData(this.lightmap.element.width, this.lightmap.element.height);

    for (let i = 0; i < imageData.data.length; i += 4) {
      const val = Math.floor((Math.random() / 3) * 256 + 100);
      imageData.data[i] = val;
      imageData.data[i + 1] = val;
      imageData.data[i + 2] = val;
      imageData.data[i + 3] = 255;
    }

    ctx.putImageData(imageData, 0, 0);
    this.lightmap.texture.update();
  }

  dispose() {
    Object.values(this.textures).forEach((texture) => texture.dispose());
    this.splatmap.texture.dispose();
    this.lightmap.texture.dispose();
  }

  setupCanvasUI() {
    // Create splatmap canvas
    this.splatmap = this.createCanvas(200);
    this.splatmap.element.style.top = "200px";
    this.splatmap.element.style.right = "10px";
    document.body.appendChild(this.splatmap.element);

    // Create lightmap canvas
    this.lightmap = this.createCanvas(200);
    this.lightmap.element.style.top = "400px";
    this.lightmap.element.style.right = "10px";
    document.body.appendChild(this.lightmap.element);

    // Fill initial textures
    this.fillRandomSplatmap();
    this.fillRandomAmbientMap();

    // Create color picker for lighting
    const colorPicker = document.createElement("input");
    colorPicker.type = "color";
    colorPicker.value = "#ffffff";
    colorPicker.style.position = "absolute";
    colorPicker.style.top = "10px";
    colorPicker.style.left = "10px";
    colorPicker.style.zIndex = "100";
    colorPicker.addEventListener("input", (e) => {
      const hex = e.target.value;
      this.currentLightColor = hexToRgba(hex, 1);
    });
    document.body.appendChild(colorPicker);

    // Helper function for color conversion
    function hexToRgba(hex, alpha = 1) {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Set default colors
    this.currentSplatColor = "rgba(255, 0, 0, 0.5)";
    this.currentLightColor = "rgba(255, 255, 255, 1)";
  }
}
