export class Options {
  constructor(terrainEditor = false) {
    this.isOpen = false;
    this.panel = this.createPanel();
    this.isTerrainEditor = terrainEditor;
    if (!this.isTerrainEditor) {
      this.menuBar = this.createMenuBar();
    }
    this.bindEvents();
    this.callbacks = new Map(); // Store callbacks for option changes
  }

  createPanel() {
    const panel = document.createElement("div");
    panel.className = "options-panel";
    panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0,0,0,0.2);
            display: none;
            z-index: 1005;
                    background-color: rgba(0, 0, 0, 0.9);
        border: 1px solid #666;
        // box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        color: #fff;
        font-family: Verdana, "Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif;
        `;

    // Graphics settings section
    panel.innerHTML = `
            <h2>Graphics Options</h2>
            <div class="graphics-section">
                   <div class="option-item">
                    <label>Resolution Scale</label>
                    <div class="slider-container" style="margin-left: 10px; margin-right: 5px;">
                        <input type="range" id="resolution-scale" 
                               min="25" max="200" value="100" step="5">
                        <span id="resolution-scale-value" style="position: relative; top: -9px;">100%</span>
                    </div>
                </div>
                <div class="option-item">
                    <label>Enable Shadows</label>
                    <input type="checkbox" id="enable-shadows" checked>
                </div>
                <div class="option-item">
                    <label>Enable SSAO</label>
                    <input type="checkbox" id="enable-ssao" checked>
                </div>
               
                <div class="option-item">
                    <label>SSAO Quality</label>
                    <select id="ssao-samples">
                        <option value="4" >Low (4 samples)</option>
                        <option value="16" selected >Medium (16 samples)</option>
                        <option value="32">High (32 samples)</option>
                        <option value="64">Ultra (64 samples)</option>
                    </select>
                </div>
                <div class="option-item">
                    <label>High Quality Blur</label>
                    <input type="checkbox" id="expensive-blur" checked>
                </div>
            </div>
 <h2>Sound Options</h2>
            <div class="graphics-section">
                <!-- <div class="option-item">
                    <label>Master Volume</label>
                    <div class="slider-container" style="margin-left: 10px; margin-right: 5px;">
                        <input type="range" id="master-volume" 
                               min="0" max="100" value="100" step="1">
                        <span id="master-volume-value" style="position: relative; top: -9px;">100%</span>
                    </div>
                </div> -->
                <div class="option-item">
                    <label>Music Volume</label>
                    <div class="slider-container" style="margin-left: 10px; margin-right: 5px;">
                        <input type="range" id="music-volume" 
                               min="0" max="100" value="30" step="1">
                        <span id="music-volume-value" style="position: relative; top: -9px;">30%</span>
                    </div>
                </div>
                <div class="option-item">
                    <label>SFX Volume</label>
                    <div class="slider-container" style="margin-left: 10px; margin-right: 5px;">
                        <input type="range" id="sfx-volume" 
                               min="0" max="100" value="100" step="1">
                        <span id="sfx-volume-value" style="position: relative; top: -9px;">100%</span>
                    </div>
                </div>
                <div class="option-item">
                    <label>Ambience Volume</label>
                    <div class="slider-container" style="margin-left: 10px; margin-right: 5px;">
                        <input type="range" id="ambience-volume" 
                               min="0" max="100" value="100" step="1">
                        <span id="ambience-volume-value" style="position: relative; top: -9px;">100%</span>
                    </div>
                </div>
                </div>
            <button id="close-options">Close</button>
            <button id="unstuck-me">Unstuck Me</button>
        `;

    document.body.appendChild(panel);
    return panel;
  }

  createMenuBar() {
    const menuBar = document.createElement("div");
    menuBar.className = "menu-bar";
    menuBar.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
    //   transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      padding: 10px 20px;
      border-radius: 8px;
      display: flex;
      gap: 10px;
      z-index: 1000;
    `;

    const buttons = [
      { text: "Skill Maker", id: "menu-skill-editor" },
      { text: "Talent Tree Maker", id: "menu-skill-tree-maker" },
      { text: "Map", id: "menu-map" },
      //   { text: "Wiki", id: "menu-wiki" },
      { text: "Options", id: "menu-options" },
      //   { text: "Help", id: "menu-help" },
      //   { text: "Exit", id: "menu-exit" },
    ];

    buttons.forEach((btn) => {
      const button = document.createElement("button");
      button.id = btn.id;
      button.textContent = btn.text;
      button.style.cssText = `
        padding: 8px 16px;
        background-color: #333;
        color: white;
        border: 1px solid #666;
        border-radius: 4px;
        cursor: pointer;
        font-family: Verdana, sans-serif;
        transition: background-color 0.2s;
      `;
      button.addEventListener("mouseover", () => {
        button.style.backgroundColor = "#444";
      });
      button.addEventListener("mouseout", () => {
        button.style.backgroundColor = "#333";
      });
      menuBar.appendChild(button);
    });

    document.body.appendChild(menuBar);
    return menuBar;
  }

  bindEvents() {
    // Listen for escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        let templateMenu = document.querySelector("#templateMenu");
        if (typeof templateMenu !== "undefined") {
          if (templateMenu.style.display === "block") {
            return;
          }
        }
        this.togglePanel();
      }
    });

    // Close button handler
    const closeButton = this.panel.querySelector("#close-options");
    closeButton.addEventListener("click", () => {
      this.closePanel();
    });

    const unstuckMeButton = this.panel.querySelector("#unstuck-me");
    unstuckMeButton.addEventListener("click", () => {
      DUMMY_AGGREGATE.resetToSpawn();
      this.triggerCallback("unstuckMe", true);
    });

    // Add event listeners for graphics options
    const ssaoToggle = this.panel.querySelector("#enable-ssao");
    const ssaoSamples = this.panel.querySelector("#ssao-samples");
    const expensiveBlur = this.panel.querySelector("#expensive-blur");
    const shadowToggle = this.panel.querySelector("#enable-shadows");
    shadowToggle.addEventListener("change", (e) => {
      if (SHADOW_GENERATOR) {
        console.log("shadowToggle", "test");

        SHADOW_GENERATOR.toggleShadows(e.target.checked);
        this.triggerCallback("shadowToggle", e.target.checked);
      }
    });

    ssaoToggle.addEventListener("change", (e) => {
      SSAO_GLOBAL.setEnabled(e.target.checked);
      this.triggerCallback("ssaoToggle", e.target.checked);
    });

    ssaoSamples.addEventListener("change", (e) => {
      SSAO_GLOBAL.samples = parseInt(e.target.value);
      this.triggerCallback("ssaoSamples", parseInt(e.target.value));
    });

    expensiveBlur.addEventListener("change", (e) => {
      SSAO_GLOBAL.expensiveBlur = e.target.checked;
      this.triggerCallback("expensiveBlur", e.target.checked);
    });

    const resolutionScale = this.panel.querySelector("#resolution-scale");
    const resolutionScaleValue = this.panel.querySelector("#resolution-scale-value");

    resolutionScale.addEventListener("input", (e) => {
      const value = e.target.value;
      resolutionScaleValue.textContent = `${value}%`;
      this.triggerCallback("resolutionScale", value / 100); // Convert to decimal for Babylon.js
    });

    // Add menu bar button handlers
    if (!this.isTerrainEditor) {
      const optionsButton = document.querySelector("#menu-options");
      optionsButton.addEventListener("click", () => {
        this.togglePanel();
      });
    }

    const channels = ["music", "sfx", "ambience"]; //"master", "voice"

    channels.forEach((channel) => {
      const volumeSlider = this.panel.querySelector(`#${channel}-volume`);
      const volumeValue = this.panel.querySelector(`#${channel}-volume-value`);

      volumeSlider.addEventListener("input", (e) => {
        const value = e.target.value;
        volumeValue.textContent = `${value}%`;
        this.triggerCallback(`${channel}Volume`, value / 100); // Convert to decimal
      });
    });

    // const exitButton = document.querySelector("#menu-exit");
    // exitButton.addEventListener("click", () => {
    //   // You can implement exit functionality here
    //   this.triggerCallback("exit", true);
    // });
    if (!this.isTerrainEditor) {
      // Add other button handlers as needed
      ["map", "skill-editor", "skill-tree-maker"].forEach((item) => {
        const button = document.querySelector(`#menu-${item}`);
        button.addEventListener("click", () => {
          this.triggerCallback(item, true);
        });
      });
    }
  }

  togglePanel() {
    this.isOpen = !this.isOpen;
    this.panel.style.display = this.isOpen ? "block" : "none";
    if (this.isOpen) {
      document.body.style.cursor = "default";
    } else {
      // document.body.style.cursor = "default";
    }
  }

  closePanel() {
    this.isOpen = false;
    this.panel.style.display = "none";
  }

  // Method to add new options dynamically
  addOption(label, type = "checkbox", id) {
    const optionItem = document.createElement("div");
    optionItem.className = "option-item";
    optionItem.innerHTML = `
            <label>${label}</label>
            <input type="${type}" id="${id}">
        `;

    // Insert before the close button
    const closeButton = this.panel.querySelector("#close-options");
    this.panel.insertBefore(optionItem, closeButton);
  }

  // Method to register callbacks for option changes
  onOptionChange(optionName, callback) {
    this.callbacks.set(optionName, callback);
  }

  // Method to trigger callbacks
  triggerCallback(optionName, value) {
    const callback = this.callbacks.get(optionName);
    if (callback) {
      callback(value);
    }
  }
}

export function setupOptions(scene, engine) {
  OPTIONS = new Options(true);
  OPTIONS.onOptionChange("resolutionScale", (value) => {
    // Apply hardware scaling inversely (higher value = lower scaling)
    // This creates a linear relationship where 1 = 1, 2 = 0.5, 1.5 = 0.67, etc.
    engine.setHardwareScalingLevel(1 / value);
  });
  // scene.performancePriority = BABYLON.ScenePerformancePriority.Aggressive;
  // document.addEventListener("keydown", function (event) {
  //   if (event.key === "Escape") {
  //   }
  // });
  OPTIONS.onOptionChange("unstuckMe", () => {
    // console.log("unstuckMe");
    scene.activeCamera.preferredZoom = 100;
  });

  OPTIONS.onOptionChange("masterVolume", (value) => {
    // Handle master volume - you might need to implement this in SoundManager
    // scene.activeCamera.sound.setChannelVolume("master", value);
  });

  OPTIONS.onOptionChange("musicVolume", (value) => {
    scene.activeCamera.sound.music.volume = value;
  });

  OPTIONS.onOptionChange("sfxVolume", (value) => {
    scene.activeCamera.sound.setChannelVolume("sfx", value);
  });

  OPTIONS.onOptionChange("ambienceVolume", (value) => {
    scene.activeCamera.sound.ambience.volume = value;
    // scene.activeCamera.sound.setChannelVolume("voice", value);
  });
}