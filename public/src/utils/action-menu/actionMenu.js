// this will have the default actions for all scenes.

//this will include look, multiplayer, options, chat
//this will include jump and roll.

//Add a space for new icons to be added, depending on scene

export class ActionMenu {
  constructor() {
    // Create container for jump and roll icons
    const actionContainer = document.createElement("div");
    actionContainer.style.position = "fixed";
    actionContainer.style.bottom = "20px";
    actionContainer.style.right = "100px"; // Position to the left of main FAB
    actionContainer.style.display = "flex";
    actionContainer.style.gap = "10px";
    actionContainer.style.zIndex = "1001";

    // Create jump button
    const jumpButton = this.createActionButton("/assets/textures/terrain/icons/jump.png", "Jump");
    jumpButton.onclick = () => {
      // Handle jump action
      window.JUMP_ACTION?.();
    };

    // Create roll button
    const rollButton = this.createActionButton("/assets/textures/terrain/icons/roll.png", "Roll");
    rollButton.onclick = () => {
      // Handle roll action
      window.ROLL_ACTION?.();
    };

    actionContainer.appendChild(jumpButton);
    actionContainer.appendChild(rollButton);
    document.body.appendChild(actionContainer);
  }

  createActionButton(iconPath, label) {
    const button = document.createElement("button");
    button.style.width = "50px";
    button.style.height = "50px";
    button.style.borderRadius = "10px";
    button.style.border = "none";
    button.style.backgroundImage = `url(${iconPath})`;
    button.style.backgroundSize = "86%";
    button.style.backgroundPosition = "center";
    button.style.cursor = "pointer";
    button.style.transition = "all 0.2s ease";
    button.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
    button.title = label;

    button.addEventListener("mouseenter", () => {
      button.style.transform = "scale(1.1)";
      button.style.filter = "brightness(1.2)";
    });

    button.addEventListener("mouseleave", () => {
      button.style.transform = "scale(1)";
      button.style.filter = "brightness(1)";
    });

    return button;
  }
}
