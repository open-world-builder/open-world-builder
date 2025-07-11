import { attachHealthBar } from "./damagePopup.js";
import { Health } from "./health.js";

export function setupEnemies(scene, player, terrain, amount, mesh, hpbar) {
  let enemies = [];

  let enemyAttackDistance = 12;
  for (let i = 0; i < amount; i++) {
    let enemy = createEnemy(scene, mesh, hpbar);
    enemies.push(enemy);
    addRandomMovement(enemy, scene, terrain);
    attackIfClose(scene, enemy, player, enemyAttackDistance);
    // setTimeout(() => {
    //     attachHealthBar(enemy);
    // }, 1000);
  }

  // addEnemyOutline(scene, player);
  addEnemyOutlineCamera(scene, player);
  // setTimeout(() => {
  //     attachHealthBar(enemies[0]);
  // }, 1000);
  return enemies;
}

export function setupEnemy(scene, player, mesh, hpbar) {
  let enemies = [];
  let enemy = createEnemy(scene, mesh, hpbar);
  enemies.push(enemy);
  addEnemyOutlineCamera(scene, player);
  return enemy;
}

export function setupEnemySimple(scene, player, mesh, hpbar) {
  let enemies = [];
  let enemy = createEnemySimple(scene, mesh, hpbar);
  enemies.push(enemy);
  // addEnemyOutlineCamera(scene, player);
  return enemy;
}

// use for barrels, breakable
export function createEnemyWithPosition(mesh, startingHealth, position, scene) {
  let enemy = mesh.clone("enemyClone");
  enemy.setEnabled(true);
  enemy.position = position.clone();
  enemy.name = "enemy";
  enemy.isPickable = false;
  BABYLON.Tags.EnableFor(enemy);
  enemy.addTags("health");

  if (mesh.break) {
    let enemyAggregate = new BABYLON.PhysicsAggregate(enemy, BABYLON.PhysicsShapeType.CONVEX_HULL, { mass: 0, restitution: 0.0, friction: 0.5 }, scene);
    enemy.enemyAggregate = enemyAggregate;

    enemy.break = (amount) => {
      enemy.enemyAggregate.dispose();
      enemy.dispose();
      mesh.breakBarrel(mesh, mesh.fracturedPrefabRoot, scene, position, amount);
    };
  }
  // let enemy = BABYLON.MeshBuilder.CreateSphereq("enemy", {segments: 3, diameter: 14}, scene);
  // enemy.position = new BABYLON.Vector3(Math.random() * 100 - 50, 1, Math.random() * 100 - 50);
  // enemy.scaling.scaleInPlace(5.7);
  // hero.position.y = -11;
  let health = new Health("EnemySimple", startingHealth, enemy);
  enemy.health = health;
  // enemy.isTargetable = true;

  return enemy;
}

export function addEnemyToMesh(mesh, startingHealth) {
  let health = new Health("EnemySimple", startingHealth, mesh);
  mesh.health = health;
  return mesh;
}

function createEnemySimple(mesh, startingHealth) {
  let enemy = mesh.clone("enemyClone");
  enemy.name = "enemySimple";
  // let enemy = BABYLON.MeshBuilder.CreateSphereq("enemy", {segments: 3, diameter: 14}, scene);
  // enemy.position = new BABYLON.Vector3(Math.random() * 100 - 50, 1, Math.random() * 100 - 50);
  // enemy.scaling.scaleInPlace(5.7);
  // hero.position.y = -11;
  let health = new Health("EnemySimple", startingHealth, enemy);
  enemy.health = health;
  return enemy;
}

export function createEnemySimpleNoClone(mesh, startingHealth) {
  // let enemy = mesh.clone("enemyClone");
  // enemy.name = "enemySimple";
  // let enemy = BABYLON.MeshBuilder.CreateSphere("enemy", {segments: 3, diameter: 14}, scene);
  // enemy.position = new BABYLON.Vector3(Math.random() * 100 - 50, 1, Math.random() * 100 - 50);
  // enemy.scaling.scaleInPlace(5.7);
  // hero.position.y = -11;
  let health = new Health(mesh.name, startingHealth, mesh);
  mesh.health = health;
  return mesh;
}

function createEnemy(scene, mesh) {
  let enemy = mesh.clone("enemyClone");
  enemy.name = "enemy";
  // let enemy = BABYLON.MeshBuilder.CreateSphere("enemy", {segments: 3, diameter: 14}, scene);
  enemy.position = new BABYLON.Vector3(Math.random() * 100 - 50, 1, Math.random() * 100 - 50);
  enemy.scaling.scaleInPlace(5.7);
  // hero.position.y = -11;
  let health = new Health("Enemy", 50, enemy);
  enemy.health = health;
  enemy.isPickable = false;
  if (enemy.getChildMeshes) {
    enemy.getChildMeshes().forEach((childMesh) => {
      childMesh.isPickable = false;
    });
  }

  return enemy;
}

function addRandomMovement(enemy, scene, terrain) {
  let targetPosition = enemy.position.clone();

  let randomMoveTime = Math.random() * 6000 - 3000;
  // Update the target position every second
  enemy.interval = setInterval(() => {
    if (!enemy.health.isAlive) {
      clearTimeout(enemy.interval);
      return;
    }

    let randomX = Math.random() * 100 - 50;
    let randomZ = Math.random() * 100 - 50;

    // Calculate new target position
    targetPosition = enemy.position.add(new BABYLON.Vector3(randomX, 0, randomZ));

    // Get the terrain height at the new target position
    // let terrainHeight = terrain.getHeightAtCoordinates(targetPosition.x, targetPosition.z);
    let terrainHeight = getHeightAtCoordinates(terrain, targetPosition.x, targetPosition.z);

    // Update the target's Y position to match the terrain height
    targetPosition.y = terrainHeight + 2;

    // set target facing

    var forwardTarget = targetPosition.subtract(enemy.position).normalize();
    forwardTarget.y = 0; // Ensure the player only moves horizontally
    var forwardAngleTarget = Math.atan2(forwardTarget.x, forwardTarget.z);
    enemy.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngleTarget, 0, 0);
    var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
    enemy.rotationQuaternion = rotationQuaternion.multiply(enemy.rotationQuaternion);
  }, 3000);

  // Smoothly move enemy towards target position
  scene.onBeforeRenderObservable.add(() => {
    if (enemy.health.isAlive) {
      // Interpolate towards the target position
      enemy.position = BABYLON.Vector3.Lerp(enemy.position, targetPosition, 0.003);

      // Check for collisions if necessary, or adjust using moveWithCollisions
      // This is useful if the terrain or other objects have collision enabled
      if (enemy.moveWithCollisions) {
        let moveDirection = targetPosition.subtract(enemy.position).normalize().scale(0.1);
        enemy.moveWithCollisions(moveDirection);
      }
    }
  });
}

function getHeightAtCoordinates(object, x, z) {
  // if         // raycast instead getHeight(object,x ,z);
  return 40;
  // Assuming 'terrain' is your heightmap mesh
  return terrain.getHeightAtCoordinates(x, z);
}

function attackIfClose(scene, enemy, player, enemyAttackDistance) {
  scene.registerBeforeRender(() => {
    if (!enemy.isAlive) return;
    if (BABYLON.Vector3.Distance(enemy.position, player.position) < enemyAttackDistance) {
      console.log("Enemy is attacking!");
      // Implement attack logic here
    }
  });
}

//todo make faster this seems to slow down
export function addEnemyOutlineCamera(scene, player) {
  scene.registerBeforeRender(() => {
    let closestEnemy = null;
    let minDistance = Infinity;
    // const meshes = scene.getMeshesByTags("health");
    // console.log("meshes", meshes);
    // meshes.forEach((mesh) => {
    // let health = null;
    // if (mesh.name === "enemy") {
    // dont get parent for health
    // health = mesh.health;
    // } else {
    // console.log("mesh", mesh.name);
    // console.log("mesh parent", mesh.parent.name);
    // console.log("mesh health", mesh.parent.health);
    // health = mesh.parent.health;
    // }
    // if (health !== undefined && health.isAlive) {
    scene.meshes.forEach((mesh) => {
      if (mesh.name === "enemy" && mesh.health.isAlive) {
        // console.log("mesh", mesh.name + " " + mesh.matchesTagsQuery("health"));
        // if (mesh.name === "enemy" && mesh.health.isAlive) {
        // todo move to shared method range and facing check
        let distance = BABYLON.Vector3.Distance(mesh.getAbsolutePosition(), player.position);
        // let distance = BABYLON.Vector3.Distance(mesh.position, player.position);

        let directionToTarget = mesh.getAbsolutePosition().subtract(player.position);
        // let directionToTarget = mesh.position.subtract(player.position);

        directionToTarget.normalize();

        // Check if the caster is facing the target
        var forward = scene.activeCamera.getFrontPosition(1).subtract(scene.activeCamera.position).normalize();
        // forward.y = 0;  // Ensure the player only moves horizontally
        // var forwardAngle = Math.atan2(forward.x, forward.z);

        let dotProduct = BABYLON.Vector3.Dot(forward, directionToTarget);
        // console.log(caster.rotationCheck.forward);
        if (dotProduct < 0.5) {
          // console.log("Caster is not facing the target.");
          return false;
        }

        if (distance < minDistance) {
          minDistance = distance;
          closestEnemy = mesh;
        }
      }
    });

    // meshes.forEach((mesh) => {
    scene.meshes.forEach((mesh) => {
      if (mesh.name === "enemy") {
        mesh.renderOutline = false;
        mesh.renderOverlay = false;
        if (mesh.getChildMeshes) {
          mesh.getChildMeshes().forEach((child) => {
            child.renderOutline = false;
            child.renderOverlay = false;
          });
        }
      }
    });

    // console.log(closestEnemy);
    // console.log("closestEnemy", closestEnemy);

    if (closestEnemy) {
      // console.log("closestEnemy: ", closestEnemy.position);
      // applyOutlineToMeshAndChildren(closestEnemy, 0.5);
      // if (closestEnemy.name === "enemy") {
      player.target = closestEnemy;
      // } else {
      // player.target = closestEnemy.parent;
      // }
    }
  });
}

function addEnemyOutline(scene, player) {
  scene.registerBeforeRender(() => {
    let closestEnemy = null;
    let minDistance = Infinity;
    scene.meshes.forEach((mesh) => {
      if (mesh.name === "enemy" && mesh.health.isAlive) {
        // todo move to shared method range and facing check
        let distance = BABYLON.Vector3.Distance(mesh.position, player.position);
        let directionToTarget = mesh.position.subtract(player.position);
        directionToTarget.normalize();

        // Check if the caster is facing the target
        let dotProduct = BABYLON.Vector3.Dot(player.health.rotationCheck.forward, directionToTarget);
        // console.log(caster.rotationCheck.forward);
        if (dotProduct < 0.5) {
          // console.log("Caster is not facing the target.");
          return false;
        }

        if (distance < minDistance) {
          minDistance = distance;
          closestEnemy = mesh;
        }
      }
    });

    //no idea why this causes shader error, wonder if outlines are being set to false somehwere else
    scene.meshes.forEach((mesh) => {
      if (mesh.name === "enemy") {
        // mesh.renderOutline = false;
        // mesh.renderOverlay = false;
        if (mesh.getChildren) {
          mesh.getChildren().forEach((child) => {
            // child.renderOutline = false;
            // child.renderOverlay = false;
          });
        }
      }
    });

    if (closestEnemy) {
      applyOutlineToMeshAndChildren(closestEnemy, 0.02, BABYLON.Color3.Red());
      player.target = closestEnemy;
    }
  });
}

const OVERLAY_COLOR = new BABYLON.Color3(0.05, 0.05, 0.05);
const OUTLINE_COLOR = new BABYLON.Color3(10000.05, 10000.05, 10000.05);
function applyOutlineToMeshAndChildren(mesh, outlineWidth) {
  // mesh.renderOutline = false;
  mesh.overlayColor = OVERLAY_COLOR;
  mesh.renderOverlay = true;
  // mesh.outlineWidth = outlineWidth;
  // mesh.outlineColor = OUTLINE_COLOR;

  if (mesh.getChildMeshes) {
    mesh.getChildMeshes().forEach((child) => {
      child.renderOverlay = true;
      // child.renderOutline = false;
      // child.outlineWidth = outlineWidth;
      // child.outlineColor = OUTLINE_COLOR;
      child.overlayColor = OVERLAY_COLOR;
      // console.log("child: ", child.name);
    });
  }
}
