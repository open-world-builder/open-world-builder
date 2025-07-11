import { attachHealthBar, createDamagePopup, attachHealthBarToCamera } from "./damagePopup.js";

export class Health {
  constructor(name, health, parent) {
    this.name = name;
    this.health = health;
    this.maxHealth = health;
    this.parent = parent;
    this.isAlive = true;
    this.healthBar = null;
    this.originScale = parent.scaling;

    if (name !== "Hero") {
      setTimeout(() => {
        this.healthBar = attachHealthBar(parent);
      }, 2000);
      this.setupTimeout();
    } else {
      // setTimeout(() => {
      //   this.uiHealthBar = attachHealthBarToCamera(parent);
      // }, 10000);
    }
  }

  takeDamage(amount) {
    if (!this.isAlive) {
      return;
    }

    if (this.health === this.maxHealth) {
      if (this.parent.NPC !== undefined) {
        if (!this.parent.NPC.isInCombat) {
          this.parent.NPC.startCombat();
        }
      }
    }

    this.health -= amount;
    if (this.name !== "Hero") {
      createDamagePopup(amount, this.parent.position);
    } else {
      createDamagePopup(amount, this.rangeCheck.position);
    }

    console.log("takeDamage", amount);

    // createDamagePopup(amount, damagePopupPosition);
    if (this.health <= 0) {
      this.health = 0;
      this.isAlive = false;
      this.die(amount);
    }
    if (this.healthBar !== null) {
      this.healthBar.update(this.health, this.maxHealth);
    }
    if (this.name === "Hero" && this.uiHealthBar) {
      // this.uiHealthBar.update(this.health, this.maxHealth);
    }
    if (this.name === "Hero") {
      SKILL_BAR.updateHealthBar(this.health, this.maxHealth);
    }

    if (this.name !== "Hero") {
      // this.parent.scaling.y = 3.55;
      // this.setupTimeout();
    }
  }

  setMaxHealth(health) {
    this.maxHealth = health;
    this.health = health;
    this.healthBar.update(this.health, this.maxHealth);
  }

  setupTimeout() {
    setTimeout(() => {
      this.parent.scaling.y = this.originScale.y;
      // console.log(this.originScale.y);
    }, 50);
  }

  die(amount) {
    console.log(`${this.name} has died.`);
    // Additional death logic
    // if should
    if (this.parent.shrink !== undefined) {
      this.parent.shrink();
    }

    //play shatter animation
    if (this.parent.break !== undefined) {
      this.parent.setEnabled(false);
      this.parent.break(amount);
    }

    // play death animation on npc
    if (this.parent.NPC !== undefined) {
      this.parent.NPC.die();
      SKILL_BAR.addXP(this.parent.NPC.xp);
      setTimeout(() => {
        this.parent.dispose();
      }, 20000);
    }

    //player death
    if (this.name === "Hero") {
      DUMMY_AGGREGATE.resetToSpawn();
      // full health
      setTimeout(() => {
        this.health = this.maxHealth;
        this.isAlive = true;
        SKILL_BAR.updateHealthBar(this.health, this.maxHealth);
      }, 1000);
    }
  }

  update() {
    // Update logic for each frame (animations, etc.)
  }
}
