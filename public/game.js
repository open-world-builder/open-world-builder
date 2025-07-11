import SceneManager from "./src/scene/SceneManager.js";

import { setSceneManager } from "./src/character/damagePopup.js";

window.addEventListener("DOMContentLoaded", async function () {
  SCENE_MANAGER = new SceneManager("renderCanvas");
  window.SCENE_MANAGER = SCENE_MANAGER;
  await SCENE_MANAGER.start();

  setSceneManager(SCENE_MANAGER);

  BABYLON.ParticleHelper.BaseAssetsUrl = "/assets/util/particles";
  // SKILL_BAR = skillBar;
  // window.SPELLBOOK = spellbook;

  const stats = new Stats();
  stats.dom.style.display = "none"; // Hide initially

  // todo only show on debug, remove this for performance
  document.body.appendChild(stats.dom);

  for (let i = 1; i < 3; i++) {
    const newPanel = stats.dom.children[0].cloneNode(true);
    stats.showPanel(i); // switch to panel i so it's rendered into the clone
    stats.dom.appendChild(newPanel);
  }
  stats.showPanel(0);
  window.addEventListener("keydown", (event) => {
    if (event.key === ";") {
      stats.dom.style.display = stats.dom.style.display === "none" ? "block" : "none";
    }
  });

  SCENE_MANAGER.activeScene.onBeforeRenderObservable.add(() => {
    stats.begin();
  });

  SCENE_MANAGER.activeScene.onAfterRenderObservable.add(() => {
    stats.end();
  });
});
