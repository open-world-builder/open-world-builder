import { SKILLS } from "./SkillData.js";

// Create and manage the spellbook UI
export class Spellbook {
  constructor() {
    this.isOpen = false;
    this.spells = SKILLS;
    this.createSpellbookUI();
    this.bindEvents();
  }

  createSpellbookUI() {
    // Create spellbook container
    const style = document.createElement("style");
    style.textContent = `
            .spellbook {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 600px;
                height: 400px;
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #666;
                border-radius: 8px;
                display: none;
                z-index: 1000;
                font-family: Verdana, "Open Sans", Arial, "Helvetica Neue", Helvetica, sans-serif;
                color: white;
                padding: 20px;
                box-shadow: 0px 0px 50px 20px rgba(0, 0, 0, 0.25);
                flex-direction: column;
            }

            .spellbook.open {
                display: block;
            }

            .spellbook-title {
                text-align: center;
                font-size: 24px;
                margin-bottom: 20px;
                    color: #ffc75b;
    text-shadow: 0 0 10px #000000;
            }

            .spell-grid {
                display: grid;
                // grid-template-columns: repeat(4, 1fr);
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                padding: 10px;
                overflow-y: auto;
                flex: 1;
                margin-bottom: 60px;
                height: 263px;

            }

            .spell-item {
            // width: 50px;
                width: 200px;
                height: 50px;
              
                // background: rgba(0, 0, 0, 0.3);
                cursor: grab;
                position: relative;
                transition: all 0.2s ease;
                display: flex;
            }

             .spell-item:not(.spell-item-locked):hover  {
                border-color: #999;
                // background: rgba(0, 0, 0, 0.4);
                filter: brightness(1.7);
            }

            .spell-item img {
                // width: 100%;
                width: 50px;
                height: 50px;
                // height: 100%;
                object-fit: contain;
                pointer-events: none;
                  // border: 2px solid #666;
                      // border: 2px solid #d1c49d;
                      border: 2px solid #d1c49db3;
                border-radius: 5px;
                box-shadow: 0px 0px 50px 20px rgba(0, 0, 0, 0.25);
            }

            .spell-tooltip {
                display: none;
                position: fixed;
                bottom: 20px;
                bottom: 100%;
                left: 50%;
                transform: translateX(-50%);
                width: 200px;
                padding: 10px;
                background: rgba(0, 0, 0, 0.9);
                border: 2px solid #666;
                border-radius: 4px;
                pointer-events: none;
                margin-bottom: 10px;
                z-index: 1100;
                transition: none;
            }

            .spell-item:hover .spell-tooltip {
                display: block;
            }
                
            .spellbook-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            }


            .spellbook-button {
            background-color: #00000000;
            color: rgb(245, 202, 86);
                border-top: 1px solid #ffcd5721;
                border-bottom: 1px solid #ffcd5721;
            text-shadow: 0px 1px 11px #000000;
            }

            .spellbook {
                border: 1px solid #89671d80;
                }

            .spell-name {
                margin-left: 10px;
                color: white;
                    text-shadow: 0px 1px 11px #000000;
                    color: #ffdfa2;
            }

            /* Mobile responsive layout */
            @media screen and (max-width: 768px) {
                .spellbook {
                    width: 90%;
                    height: 70vh;
                    // margin-bottom: 260px;
                }

                .spell-grid {
                    grid-template-columns: repeat(2, 1fr);  /* 2 columns on mobile */
                }

                .spell-item {
                    width: auto;  /* Let items fill the column */
                }
            }

            .spell-item-locked {
    // opacity: 0.8;
    filter: grayscale(100%);
    cursor: not-allowed;
    filter: brightness(0.5);
}
    .tooltip-level {
        font-size: 12px;
        // color: #ff4444;
    }



        `;
    document.head.appendChild(style);

    // Create spellbook HTML
    const spellbook = document.createElement("div");
    spellbook.className = "spellbook";
    spellbook.innerHTML = `
            <div class="spellbook-title">Spellbook</div>
            <div class="spell-grid">
                ${this.createSpellItems()}
            </div>

                ${
                  !window.location.href.includes("skill_editor.html")
                    ? `
    <div class="spellbook-buttons">
        <button class="spellbook-button" id="openSkillMaker" title="Visually make your own skills by mixing animations, sounds, particles, and effects.">Open Skill Maker</button>
        <button class="spellbook-button" id="openSkillTree" title="Make custom skill trees for your own class. ">Open Skill Tree</button>
    </div>
    `
                    : ""
                }


        `;
    document.body.appendChild(spellbook);
    this.spellbookElement = spellbook;
    let closeBtn = createCloseButton();
    this.spellbookElement.appendChild(closeBtn);

    if (!window.location.href.includes("skill_editor.html")) {
      // Add button event listeners
      this.spellbookElement.querySelector("#openSkillMaker").addEventListener("click", () => {
        // console.log("Opening Skill Maker...");
        SKILL_TREE.toggleSkillMaker();
        // alert("Skill Maker is coming soon! You'll be able to visually make your own skills by mixing animations, sounds, particles, and effects.");
      });

      this.spellbookElement.querySelector("#openSkillTree").addEventListener("click", () => {
        console.log("Opening Skill Tree...");
        // SKILL_TREE.toggleSkillTree();
        alert("Skill Tree Maker is coming soon! You'll be able to make custom skill trees for your own class. Try out the not yet integrated demo at www.rpgskilltreegenerator.com");
      });
    }
    closeBtn.addEventListener("click", () => {
      this.toggleSpellbook();
      window.TERRAIN_EDITOR.canvas.focus();
    });

    // this.spellbookElement.querySelector("#closeSkillTree").addEventListener("click", () => {
    //   // TODO: Implement skill tree closing logic
    //   console.log("Closing Skill Tree...");
    // });

    function createCloseButton() {
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

      closeBtn.addEventListener("mouseover", () => {
        closeBtn.style.filter = "brightness(1.4)";
      });
      closeBtn.addEventListener("mouseout", () => {
        closeBtn.style.filter = "brightness(1.2)";
      });
      return closeBtn;
    }

    this.spellGrid = this.spellbookElement.querySelector(".spell-grid");
  }
  updateSpellItems() {
    const spellGrid = this.spellbookElement.querySelector(".spell-grid");
    spellGrid.innerHTML = this.createSpellItems();
    this.bindEvents(); // Rebind events for the new spell items
  }

  createSpellItems() {
    return Object.values(this.spells)
      .map((spell) => {
        const isLocked = spell.minLevel && PLAYER_DATA.level < spell.minLevel;
        return `
            <div class="spell-item ${isLocked ? "spell-item-locked" : ""}"  draggable="${!isLocked}"  data-spell-id="${spell.id}">
                <img src="${spell.icon}" alt="${spell.name}">
                <span class="spell-name">${spell.name}</span>
                <div class="spell-tooltip">
                    <div class="tooltip-header">${spell.name}</div>
                        ${spell.minLevel ? `<div class="tooltip-level" style="color: ${isLocked ? "#ff4444" : "#44ff44"}">Required Level: ${spell.minLevel}</div>` : ""}
                    <div class="tooltip-cost">
                        ${spell.manaCost ? `<span class="mana-cost">${spell.manaCost} Mana</span>` : ""}
                        ${spell.staminaCost ? `<span class="stamina-cost">${spell.staminaCost} Energy</span>` : ""}
                    </div>
                    <div class="tooltip-cooldown">Cooldown: ${spell.cooldown / 1000}s</div>
                    <div class="tooltip-description">${spell.description}</div>
                </div>
            </div>
        `;
      })
      .join("");
  }

  bindEvents() {
    // Toggle spellbook with 'P' key
    window.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "p") {
        this.toggleSpellbook();
      }
    });

    // Setup drag and drop
    const spellItems = this.spellbookElement.querySelectorAll(".spell-item");
    const skillSlots = document.querySelectorAll(".skill-slot");

    spellItems.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.spellId);

        // Create a clone of the spell icon for dragging
        const img = item.querySelector("img");
        const dragIcon = img.cloneNode(true);
        dragIcon.className = "dragIcon";
        dragIcon.style.width = "50px";
        dragIcon.style.height = "50px";

        // Hide the clone element
        dragIcon.style.position = "absolute";
        dragIcon.style.top = "-1000px";
        document.body.appendChild(dragIcon);

        // Set the custom drag image
        e.dataTransfer.setDragImage(dragIcon, 60, 60);

        // Remove the clone after dragging starts
        setTimeout(() => document.body.removeChild(dragIcon), 0);
      });
    });

    skillSlots.forEach((slot) => {
      slot.addEventListener("dragover", (e) => e.preventDefault());
      slot.addEventListener("drop", (e) => {
        e.preventDefault();
        const spellId = e.dataTransfer.getData("text/plain");
        const slotNumber = slot.dataset.slot;
        SKILL_BAR.setSkill(Number(slotNumber), spellId);
        SKILL_BAR.updateUI();
      });
    });
  }

  toggleSpellbook() {
    this.isOpen = !this.isOpen;
    this.spellbookElement.classList.toggle("open");
  }
  openSpellbook() {
    this.isOpen = true;
    this.spellbookElement.classList.add("open");
    this.jumpToBottom();
  }
  jumpToSkill(skillId) {
    const spellGrid = this.spellbookElement.querySelector(".spell-grid");
    const skillItem = spellGrid.querySelector(`[data-spell-id="${skillId}"]`);
    if (skillItem) {
      skillItem.scrollIntoView({ behavior: "smooth" });
    }
  }
  jumpToBottom() {
    this.spellGrid.scrollTop = this.spellGrid.scrollHeight;
  }
}

// export const spellbook = new Spellbook();
