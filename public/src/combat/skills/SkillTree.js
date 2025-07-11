export class SkillTree {
  constructor() {
    // Create wrapper for skill tree
    this.skillTreeWrapper = document.createElement("div");
    this.skillTreeWrapper.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      height: 80%;
      display: none;
      z-index: 1000;
    `;

    this.skillTreeIframe = document.createElement("iframe");
    this.skillTreeIframe.src = "https://www.rpgskilltreegenerator.com";
    this.skillTreeIframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 15px;
      box-shadow: rgb(0, 0, 0) 0px 0px 10px;
    `;

    const skillTreeCloseBtn = this.createCloseButton();
    this.skillTreeWrapper.appendChild(this.skillTreeIframe);
    this.skillTreeWrapper.appendChild(skillTreeCloseBtn);
    document.body.appendChild(this.skillTreeWrapper);

    // Create wrapper for skill editor
    this.skillEditorWrapper = document.createElement("div");
    this.skillEditorWrapper.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      height: 80%;
      display: none;
      z-index: 1000;
      
    `;

    this.skillEditorIframe = document.createElement("iframe");
    this.skillEditorIframe.src = "/editors/skill_editor.html";
    this.skillEditorIframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 15px;
      box-shadow: rgb(0, 0, 0) 0px 0px 10px;
    `;

    const skillEditorCloseBtn = this.createCloseButton();
    this.skillEditorWrapper.appendChild(this.skillEditorIframe);
    this.skillEditorWrapper.appendChild(skillEditorCloseBtn);
    document.body.appendChild(this.skillEditorWrapper);

    // Create wrapper for map
    this.mapWrapper = document.createElement("div");
    this.mapWrapper.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      height: 80%;
      display: none;
      z-index: 1000;
    `;

    this.mapIframe = document.createElement("iframe");
    this.mapIframe.src = "/editors/map.html"; // Update this URL to your map page
    this.mapIframe.style.cssText = `
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 15px;
      box-shadow: rgb(0, 0, 0) 0px 0px 10px;
    `;

    const mapCloseBtn = this.createCloseButton();
    this.mapWrapper.appendChild(this.mapIframe);
    this.mapWrapper.appendChild(mapCloseBtn);
    document.body.appendChild(this.mapWrapper);

    this.handleKeyPress = this.handleKeyPress.bind(this);
    document.addEventListener("keydown", this.handleKeyPress);

    OPTIONS.onOptionChange("exit", () => {
      // Handle exit
    });

    OPTIONS.onOptionChange("skill-editor", () => {
      this.handleKeyPress({ key: "k" });
    });

    OPTIONS.onOptionChange("skill-tree-maker", () => {
      this.handleKeyPress({ key: "n" });
    });

    OPTIONS.onOptionChange("map", () => {
      this.handleKeyPress({ key: "m" });
    });
  }

  toggleSkillMaker() {
    this.handleKeyPress({ key: "k" });
  }

  toggleSkillTree() {
    this.handleKeyPress({ key: "n" });
  }

  createCloseButton() {
    const closeBtn = document.createElement("button");
    // closeBtn.innerHTML = "×";
    closeBtn.style.cssText = `
      position: absolute;
      top: -14px;
      right: -24px;
      width: 55px;
      height: 30px;
    //   border-radius: 50%;
    //   background: #ff4444;
    background-size: contain;
      background-position:
center;
background-size: 65px 40px;
      background-image: url("/assets/textures/terrain/icons/xbutton.png");
      color: white;
      border: none;
      font-size: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      line-height: 1;
      box-shadow: rgb(0, 0, 0) 0px 0px 10px;
      transition: filter 0.2s ease;
      filter: brightness(1.2);
    `;
    closeBtn.addEventListener("click", () => {
      closeBtn.parentElement.style.display = "none";
    });
    closeBtn.addEventListener("mouseover", () => {
      closeBtn.style.filter = "brightness(1.4)";
    });
    closeBtn.addEventListener("mouseout", () => {
      closeBtn.style.filter = "brightness(1.2)";
    });
    return closeBtn;
  }

  handleKeyPress(event) {
    if (event.key.toLowerCase() === "n") {
      this.skillTreeWrapper.style.display = this.skillTreeWrapper.style.display === "none" ? "block" : "none";
      if (this.skillTreeWrapper.style.display === "block") {
        this.skillEditorWrapper.style.display = "none";
        this.mapWrapper.style.display = "none";
      }
    }
    if (event.key.toLowerCase() === "k") {
      this.skillEditorWrapper.style.display = this.skillEditorWrapper.style.display === "none" ? "block" : "none";
      if (this.skillEditorWrapper.style.display === "block") {
        this.skillTreeWrapper.style.display = "none";
        this.mapWrapper.style.display = "none";
      }
    }
    if (event.key.toLowerCase() === "m") {
      this.mapWrapper.style.display = this.mapWrapper.style.display === "none" ? "block" : "none";
      if (this.mapWrapper.style.display === "block") {
        this.skillTreeWrapper.style.display = "none";
        this.skillEditorWrapper.style.display = "none";
      }
    }
  }

  destroy() {
    document.removeEventListener("keydown", this.handleKeyPress);
    if (this.skillTreeWrapper && this.skillTreeWrapper.parentNode) {
      this.skillTreeWrapper.parentNode.removeChild(this.skillTreeWrapper);
    }
    if (this.skillEditorWrapper && this.skillEditorWrapper.parentNode) {
      this.skillEditorWrapper.parentNode.removeChild(this.skillEditorWrapper);
    }
    if (this.mapWrapper && this.mapWrapper.parentNode) {
      this.mapWrapper.parentNode.removeChild(this.mapWrapper);
    }
  }
}
