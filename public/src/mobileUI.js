export function createMobileUI() {
  if (window.innerWidth > 768) return; // Only show on mobile

  const container = document.createElement("div");
  container.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
    `;

  const mainButton = document.createElement("button");
  mainButton.innerHTML = "☰";
  mainButton.style.cssText = `
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #2196F3;
        border: none;
        color: white;
        font-size: 24px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        cursor: pointer;
    `;

  const menuItems = [
    { text: "Object", action: () => console.log("Object clicked") },
    { text: "Terrain", action: () => console.log("Terrain clicked") },
    { text: "Grass", action: () => console.log("Grass clicked") },
    { text: "Movement", action: () => console.log("Movement clicked") },
  ];

  const menuContainer = document.createElement("div");
  menuContainer.style.cssText = `
        position: absolute;
        bottom: 70px;
        right: 0;
        display: none;
        flex-direction: column;
        gap: 10px;
    `;

  menuItems.forEach((item) => {
    const button = document.createElement("button");
    button.textContent = item.text;
    button.style.cssText = `
            padding: 10px 20px;
            background: #1976D2;
            border: none;
            border-radius: 20px;
            color: white;
            cursor: pointer;
            white-space: nowrap;
        `;
    button.onclick = item.action;
    menuContainer.appendChild(button);
  });

  let isOpen = false;
  mainButton.onclick = () => {
    isOpen = !isOpen;
    menuContainer.style.display = isOpen ? "flex" : "none";
    mainButton.innerHTML = isOpen ? "×" : "☰";
  };

  container.appendChild(menuContainer);
  container.appendChild(mainButton);
  document.body.appendChild(container);
}
