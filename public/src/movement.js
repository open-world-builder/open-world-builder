import { SPELLS } from "./combat/SPELLS.js";

export function setupInputHandling(scene, character, camera, hero, anim, engine, dummyAggregate) {
  inputMap = {};
  scene.actionManager = new BABYLON.ActionManager(scene);
  scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
      var key = evt.sourceEvent.key;
      inputMap[key.match(/[a-zA-Z]/) ? key.toLowerCase() : key] = evt.sourceEvent.type === "keydown";
    })
  );
  scene.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
      // inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
      var key = evt.sourceEvent.key;
      inputMap[key.match(/[a-zA-Z]/) ? key.toLowerCase() : key] = evt.sourceEvent.type === "keydown";
      // console.log(evt.sourceEvent.key);
    })
  );
  scene.onBeforeRenderObservable.add(() => handleCharacterMovement(inputMap, character, camera, hero, anim, engine, dummyAggregate));

  // Clear all held keypresses when window loses focus
  window.addEventListener("blur", () => {
    // Clear all keys in inputMap
    for (let key in inputMap) {
      inputMap[key] = false;
    }

    // Also clear any movement-related state variables
    SPRINTING = false;
    isWalking = false;
    speed = normalSpeed;
    mobileMoving = false;
    mouseIsActive = false;
    thirdAttack = false;
    canTryThirdCombo = false;

    // Clear any touch targets
    if (character && character.touchTarget) {
      character.touchTarget = null;
    }
  });

  //
  //   camera.inputs.add(new BABYLON.ArcRotateCameraGamepadInput());
  // camera.inputs.attached.gamepad.gamepadAngularSensibility = 10;
  // camera.inputs.addGamepad();
  // const cameraSlow = 0.001;
  // camera.inputs.attached.gamepad.checkInputs = function () {
  //   if (this.gamepad) {
  //     const camera = this.camera;
  //     const rsValues = this.gamepad.rightStick;

  //     if (rsValues) {
  //       // Apply deadzone
  //       const normalizedRX = Math.abs(rsValues.x) > DEADZONE ? rsValues.x : 0;
  //       const normalizedRY = Math.abs(rsValues.y) > DEADZONE ? rsValues.y : 0;

  //       // Apply sensitivity with cameraSlow
  //       // camera.inertialAlphaOffset -=
  //       //   (normalizedRX * cameraSlow) / this.gamepadAngularSensibility;
  //       // camera.inertialBetaOffset -=
  //       //   ((normalizedRY * cameraSlow) / this.gamepadAngularSensibility) *
  //       //   this._yAxisScale;
  //     }
  //   }
  // };

  const customGamepadInput = new CustomArcRotateCameraGamepadInput();
  camera.inputs.add(customGamepadInput);

  // camera.inputs.addGamepad();
  // var gamepadInput = camera.inputs.attached.gamepad;
  // gamepadInput.gamepadMoveSensibility = 1000;
  // gamepadInput.angularSpeed = 0.0;

  // // camera.inputs.attached.gamepad.gamepadRotationSensibility = 199.01;
  // // camera.inputs.attached.gamepad.gamepadRotationSensibility = 199.01;
  // camera.inputs.attached.gamepad.gamepadAngularSensibility = 5000;
  // // camera.inputs.attached.gamepad.gamepadMoveSensibility = 100.01;
  // // camera.inputs.attached.gamepad.angularSpeed = 0.0;
  // //   //   gamepadInput.gamepadAngularSensibility =
  // //   // -gamepadInput.gamepadAngularSensibility;
  // //   //   gamepadInput.gamepadMoveSensibility = 1; // Adjust this value as needed
  // //   //   gamepadInput.gamepadRotationSensibility = -170;
  // //   gamepadInput.gamepadRotationSensibility = 70;
  // //   gamepadInput._yAxisScale = 0.4;
  // //   gamepadInput._xAxisScale = -0.3;
  // console.log(gamepadInput);

  //   camera.inputs.attached.gamepad = gamepadInput;
  addGamepad();
  function addGamepad() {
    const gamepadManager = new BABYLON.GamepadManager();
    gamepadManager.onGamepadConnectedObservable.add((gamepad) => {
      if (gamepad instanceof BABYLON.Xbox360Pad) {
        // Xbox controller connected
        console.log("Xbox Controller connected:", gamepad.id);
        setupXboxController(gamepad);
      } else {
        // Handle other gamepad types if necessary
        console.log("Non-Xbox Controller connected:", gamepad.id);
      }
    });
  }
  function setupXboxController(gamepad) {
    // Use standard keyboard event keys
    const keyMap = {
      [BABYLON.Xbox360Button.A]: " ", // space
      [BABYLON.Xbox360Button.Y]: "c", // forward
      [BABYLON.Xbox360Button.X]: "h",
      [BABYLON.Xbox360Button.B]: "shift", // backward
      [BABYLON.Xbox360Button.RB]: "j", // for combo attacks
      [BABYLON.Xbox360Button.LB]: "h", // for heavy attacks
      [BABYLON.Xbox360Button.RSB]: "r", // for spells/abilities
      // Add more button mappings as needed
    };

    function simulateKeyEvent(key, type) {
      // Convert the key to match the inputMap format
      const processedKey = key.match(/[a-zA-Z]/) ? key.toLowerCase() : key;

      const event = new KeyboardEvent(type, {
        key: key,
        code: key.length === 1 ? `Key${key.toUpperCase()}` : key,
        keyCode: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 32,
        which: key.length === 1 ? key.toUpperCase().charCodeAt(0) : 32,
        bubbles: true,
        cancelable: true,
        composed: true,
        isTrusted: true, // This helps some event systems recognize it as a "real" event
        view: window, // Required for some event handlers
        type: type, // Explicitly set the type to match what the action manager checks
      });

      // Update the inputMap directly to ensure consistency
      if (typeof inputMap !== "undefined") {
        inputMap[processedKey] = type === "keydown";
      }

      // Dispatch the event for any other listeners
      window.dispatchEvent(event);
    }
    // Button handlers
    gamepad.onButtonDownObservable.add((button) => {
      if (keyMap[button]) {
        simulateKeyEvent(keyMap[button], "keydown");
      }
    });

    gamepad.onButtonUpObservable.add((button) => {
      if (keyMap[button]) {
        simulateKeyEvent(keyMap[button], "keyup");
      }
    });

    // Define zoom levels2
    const ZOOM_LEVELS = [
      150, // Far
      70, // Medium
      20, // Close
    ];

    // Add button handlers for right stick press
    gamepad.onPadDownObservable.add((button) => {
      if (button === BABYLON.Xbox360Dpad.Up) {
        // Find current zoom index and get next zoom level
        const currentIndex = ZOOM_LEVELS.indexOf(camera.preferredZoom);
        const nextIndex = (currentIndex + 1) % ZOOM_LEVELS.length;

        camera.preferredZoom = ZOOM_LEVELS[nextIndex];
        camera.shouldPrefferedZoom = true;
      }
    });

    // WASD mapping using key values
    const wasdMap = {
      up: "w",
      down: "s",
      left: "a",
      right: "d",
    };

    const deadZoneX = 0.3;
    const deadZoneY = 0.1;
    gamepad.onleftstickchanged((values) => {
      // Vertical movement
      if (values.y < -deadZoneY) simulateKeyEvent(wasdMap.up, "keydown");
      else simulateKeyEvent(wasdMap.up, "keyup");

      if (values.y > deadZoneY) simulateKeyEvent(wasdMap.down, "keydown");
      else simulateKeyEvent(wasdMap.down, "keyup");

      // Horizontal movement
      if (values.x < -deadZoneX) simulateKeyEvent(wasdMap.left, "keydown");
      else simulateKeyEvent(wasdMap.left, "keyup");

      if (values.x > deadZoneX) simulateKeyEvent(wasdMap.right, "keydown");
      else simulateKeyEvent(wasdMap.right, "keyup");
    });
  }

  // todo move to own function

  // Function to get canvas-relative touch position
  const canvas = document.getElementById("renderCanvas");
  function getCanvasRelativePosition(event) {
    const rect = canvas.getBoundingClientRect();
    const touch = event.touches[0]; // Get the first touch
    const xPos = touch.clientX - rect.left;
    const yPos = touch.clientY - rect.top;
    return new BABYLON.Vector2(xPos, yPos);
  }

  // Function to move character towards a point

  function pickTerrain(scene, x, y) {
    // Convert screen coordinates to a ray in world space
    var ray = scene.createPickingRay(x, y, BABYLON.Matrix.Identity(), scene.activeCamera);

    // Predicate function to identify the terrain
    var predicate = function (mesh) {
      return mesh.isPickable && mesh.isEnabled() && mesh.name === "ground"; // Ensure it's the terrain
    };

    // Execute raycasting with the predicate to ensure only terrain is considered
    var hit = scene.pickWithRay(ray, predicate);

    if (hit.hit) {
      // console.log("Terrain was hit at:", hit.pickedPoint);
      // Additional logic can be added here, e.g., moving an object to the hit location
    } else {
      // console.log("No terrain was hit");
    }
    return hit;
  }

  function pickEnemy(scene, x, y) {
    // Convert screen coordinates to a ray in world space
    var ray = scene.createPickingRay(x, y, BABYLON.Matrix.Identity(), scene.activeCamera);

    // Predicate function to identify the terrain
    var predicate = function (mesh) {
      return mesh.isPickable && mesh.isEnabled() && mesh.name === "enemyClone.Sphere"; // Ensure it's the terrain
    };

    // Execute raycasting with the predicate to ensure only terrain is considered
    var hit = scene.pickWithRay(ray, predicate);

    if (hit.hit) {
      console.log("enemy was hit");
      return true;
      // Additional logic can be added here, e.g., moving an object to the hit location
    } else {
      return false;
      console.log("enemy was hit");
      // console.log("No terrain was hit");
    }
    return hit;
  }

  function moveCharacterToPoint(point, character, scene) {
    // const pickResult = scene.pick(point.x, point.y);
    // if hit an enemy, don't move just attack
    const hitEnemy = pickEnemy(scene, point.x, point.y);
    const pickResult = pickTerrain(scene, point.x, point.y);
    if (pickResult.hit && !hitEnemy) {
      const distanceToTarget = BABYLON.Vector3.Distance(character.position, pickResult.pickedPoint);
      if (distanceToTarget > attackDistance) {
        const target = pickResult.pickedPoint;
        character.touchTarget = target;
      }
    } else {
      const direction = pickResult.pickedPoint.subtract(character.position).normalize();
      let forwardAngle = Math.atan2(direction.x, direction.z);
      hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
      var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
      hero.rotationQuaternion = rotationQuaternion.multiply(hero.rotationQuaternion);
      console.log("hit close");
    }
  }

  let characterSpeed = 5; // Speed of the character moving towards the target
  // scene.onBeforeRenderObservable.add(() => moveToTargetPoint());
  function moveToTargetPoint() {
    if (!character) return; // Check if character and targetPoint are defined
  }
  // Add touch event listener to canvas

  canvas.addEventListener("touchstart", function (event) {
    const point = getCanvasRelativePosition(event);
    // if (point.isEnemy) {attack}
    // else
    if (character.shouldTapToMove) {
      moveCharacterToPoint(point, character, scene);
    }
    // character.target = character.position;
  });
}

function handleGamepadInput(gamepad, character) {
  gamepad.onleftstickchanged((values) => {
    // Using the left stick to move the character or adjust camera angle
    let inputVelocity = new BABYLON.Vector3(values.x, 0, values.y).scaleInPlace(0.1);
    character.moveWithCollisions(inputVelocity);
  });

  gamepad.onbuttondown((button) => {
    if (button === BABYLON.Xbox360Button.A) {
      // Jump action, for example
      let jumpImpulse = new BABYLON.Vector3(0, 10, 0);
      if (character.physicsImpostor) {
        character.physicsImpostor.applyImpulse(jumpImpulse, character.getAbsolutePosition());
      }
    }
  });

  // Add more button interactions as needed
}

function DoCombo() {
  if (combo >= 3) combo = 0;
  combo += 1;
  // console.log(combo);
  return combo;
}

// Function to handle mouse clicks
// attack anim time
let lastClickTime = 0;
let firstAttack = false;
let secondAttack = false;
function handleClick() {
  // Set the variable to true on click
  if (mouseIsActive || thirdAttack || firstAttack || secondAttack) {
    return;
  }
  if (mobileMoving) return;
  console.log(mobileMoving);
  // const distanceToTarget = BABYLON.Vector3.Distance(character.position, character.touchTarget);
  // if (distanceToTarget > attackDistance)
  //     return;

  // clearTimeout(handleClick.thirdAttackWindowTimer);
  const currentTime = Date.now();

  // Check if the last click was within 700 milliseconds
  if (currentTime - lastClickTime <= 500) {
    clearTimeout(handleClick.thirdAttackTimer);
    if (canTryThirdCombo && !firstAttack && !secondAttack) {
      thirdAttack = true;
      handleClick.thirdAttackTimer = setTimeout(() => {
        thirdAttack = false;
        if (PLAYER.target && targetBaseOnCameraView) rotateToTarget();
        if (PLAYER.target) SPELLS.heavySwing.cast(PLAYER.health, PLAYER.target.health);
      }, 400);
    } else {
    }
  } else {
    // thirdAttack = false;
  }
  lastClickTime = currentTime;

  clearTimeout(handleClick.firstTimer);
  clearTimeout(handleClick.secondTimer);

  if (thirdAttack) return;
  let comboVal = DoCombo();
  // console.log(comboVal);
  if (comboVal == 1) {
    canTryThirdCombo = true;
    mouseIsActive = true;
    firstAttack = true;
    handleClick.firstTimer = setTimeout(() => {
      mouseIsActive = false;
      firstAttack = false;
      if (PLAYER.target && targetBaseOnCameraView) rotateToTarget();
      if (PLAYER.target) SPELLS.quickSwing.cast(PLAYER.health, PLAYER.target.health);
    }, 100); //handle with engine time
  } else {
    mouseIsActive = true;
    secondAttack = true;
    handleClick.secondTimer = setTimeout(() => {
      mouseIsActive = false;
      secondAttack = false;
      if (PLAYER.target && targetBaseOnCameraView) rotateToTarget();
      if (PLAYER.target) SPELLS.quickSwing.cast(PLAYER.health, PLAYER.target.health);
    }, 100);
  }
}

// mousedown versus click
// document.getElementById("renderCanvas").addEventListener('click', handleClick);

window.addEventListener("keydown", onKeyDown);
function onKeyDown(event) {
  if (event.key === "j") SPRINTING = !SPRINTING;

  // if (event.key === "Shift"){} SPRINTING = !SPRINTING;
  if (event.key === "j") {
    DoCombo();
  }
  if (event.key === "h") {
    SPELLS.heavySwing.cast(PLAYER.health, PLAYER.target.health);
  }
  if (event.key === "c") {
    SPELLS.fireball.cast(PLAYER.health, PLAYER.target.health);
  }
  if (event.key === "b") {
    console.log("walking");
    isWalking = !isWalking;
    speed = isWalking ? 30.0 : 80.0;
  }
}

function rotateToTarget() {
  var forwardTarget = PLAYER.target.position.subtract(PLAYER.position).normalize();
  forwardTarget.y = 0; // Ensure the player only moves horizontally
  var forwardAngleTarget = Math.atan2(forwardTarget.x, forwardTarget.z);
  PLAYER.health.rotationCheck.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngleTarget, 3.14, 0);
  var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
  PLAYER.health.rotationCheck.rotationQuaternion = rotationQuaternion.multiply(PLAYER.health.rotationCheck.rotationQuaternion);
  // shouldRotateToTarget = false;
}
let shouldRotateToTarget = false;

let combo = 0;

let SPRINTING = false;
// let normalSpeed = 100.0;
// let normalSpeed = 80.0;
let normalSpeed = 100.0;
let isWalking = false;
let rollSpeed = 1.6;
let sprintSpeed = 1.5;
let speed = normalSpeed;
let lastMoveDirection = BABYLON.Vector3.Zero();
const runningAnimSpeed = 0.96;
let mobileMoving = false;
let mouseIsActive = false;
let attackDistance = 17.0;
let thirdAttack = false;
let canTryThirdCombo = false;
let lastUpdateTime = 1;
let lastPosition = new BABYLON.Vector3(0, 0, 0);
const multiplayerSyncSpeed = 200; // 100 fast update
let lastRotation = 0;
function handleCharacterMovement(inputMap, character, camera, hero, anim, engine, dummyAggregate) {
  // Added multiplayer movement
  const currentTime = Date.now();
  if (!lastUpdateTime || currentTime - lastUpdateTime >= multiplayerSyncSpeed) {
    const currentPosition = new BABYLON.Vector3(dummyAggregate.body.transformNode._absolutePosition.x, dummyAggregate.body.transformNode._absolutePosition.y, dummyAggregate.body.transformNode._absolutePosition.z);
    // currentPosition.x = dummyAggregate.body.transformNode._absolutePosition.x;
    // currentPosition.y = dummyAggregate.body.transformNode._absolutePosition.y;
    // currentPosition.z = dummyAggregate.body.transformNode._absolutePosition.z;

    // Emit position update to server/other clients
    if (window.MULTIPLAYER && window.MULTIPLAYER.localPlayer) {
      // only send position update if different from last position
      if (BABYLON.Vector3.Distance(currentPosition, lastPosition) > 0.05) {
        // console.log("sending multiplayer position", currentPosition);
        // console.log("sending multiplayer position", position);

        window.MULTIPLAYER.sendPlayerPosition(currentPosition);
        lastPosition = currentPosition;
      }

      if (Math.abs(hero.rotationQuaternion.x - lastRotation) > 0.04) {
        // Extract the yaw rotation from the quaternion
        // Extract the yaw rotation from the quaternion and add 90 degrees (PI/2) to correct model offset
        // const rotationYaw = Math.atan2(2.0 * (hero.rotationQuaternion.y * hero.rotationQuaternion.w + hero.rotationQuaternion.x * hero.rotationQuaternion.z), 1.0 - 2.0 * (hero.rotationQuaternion.y * hero.rotationQuaternion.y + hero.rotationQuaternion.z * hero.rotationQuaternion.z)) + Math.PI / 4 + (Math.PI * 3) / 2;
        // const rotationYaw = -Math.atan2(2.0 * (hero.rotationQuaternion.y * hero.rotationQuaternion.w + hero.rotationQuaternion.x * hero.rotationQuaternion.z), 1.0 - 2.0 * (hero.rotationQuaternion.y * hero.rotationQuaternion.y + hero.rotationQuaternion.z * hero.rotationQuaternion.z) + (3 * Math.PI) / 4);

        const rotationYaw = -Math.atan2(2.0 * (hero.rotationQuaternion.y * hero.rotationQuaternion.w + hero.rotationQuaternion.x * hero.rotationQuaternion.z), 1.0 - 2.0 * (hero.rotationQuaternion.y * hero.rotationQuaternion.y + hero.rotationQuaternion.z * hero.rotationQuaternion.z));

        window.MULTIPLAYER.sendPlayerRotation(rotationYaw);
        // console.log("sending multiplayer rotation", hero.rotationQuaternion.x);
        lastRotation = hero.rotationQuaternion.x;
      }
    }
    lastUpdateTime = currentTime;
  }

  // Start of handleCharacterMovement
  var currentVerticalVelocity = dummyAggregate.body.getLinearVelocity().y;

  // previously the movement speed slowed down to 0 when looking directly down on the player
  // var forward = camera.getFrontPosition(1).subtract(camera.position).normalize().scaleInPlace(speed);

  var forward = camera.getFrontPosition(1).subtract(camera.position);
  forward.y = 0; // Ensure the player only moves horizontally
  forward = forward.normalize().scaleInPlace(speed); // Normalize after zeroing Y to maintain consistent horizontal speed
  // fix the player stopping moving when camera above

  var forwardAngle = Math.atan2(forward.x, forward.z);
  // Set the character's rotation to face the direction the camera is looking

  var right = forward.clone().rotateByQuaternionAroundPointToRef(BABYLON.Quaternion.FromEulerAngles(0, Math.PI / 2, 0), BABYLON.Vector3.Zero(), new BABYLON.Vector3());

  // if (shouldRotateToTarget) {

  // }

  // let moveDirection = dummyAggregate.body.getLinearVelocity();
  let moveDirection = new BABYLON.Vector3(lastMoveDirection.x, lastMoveDirection.y, lastMoveDirection.z);
  if (!anim.Roll.isPlaying && !anim.Attack.isPlaying) {
    moveDirection = new BABYLON.Vector3(0, dummyAggregate.body.getLinearVelocity().y, 0);
  }
  // let moveDirection = dummyAggregate.body.getLinearVelocity();
  if (inputMap["w"] || inputMap["ArrowUp"]) {
    moveDirection.addInPlace(forward); // Forward
    hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
    var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
    hero.rotationQuaternion = rotationQuaternion.multiply(hero.rotationQuaternion);

    if (!anim.Roll.isPlaying && !anim.Attack.isPlaying && !anim.Combo.isPlaying) {
      for (let key in anim) {
        if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
          if (key !== "Running" && key !== "Jump") anim[key].stop();
        }
      }
      if (!anim.Jump.isPlaying) {
        anim.Running.start(true, runningAnimSpeed, anim.Running.from, anim.Running.to, false);
      }
    }

    // anim.Running.play();
    // anim.Running.weight = 0.5;
    // scene.beginAnimation(hero, anim.Running.from, anim.Running.to, true);
    // anim.Running._weight = 1;
  }
  if (inputMap["s"] || inputMap["ArrowDown"]) {
    moveDirection.subtractInPlace(forward);
    hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
    if (!anim.Roll.isPlaying && !anim.Attack.isPlaying && !anim.Combo.isPlaying) {
      for (let key in anim) {
        if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
          if (key !== "Running" && key !== "Jump") anim[key].stop();
        }
      }
      if (!anim.Jump.isPlaying) {
        anim.Running.start(true, runningAnimSpeed, anim.Running.from, anim.Running.to, false);
      }
    }
  }
  if (inputMap["a"] || inputMap["ArrowLeft"]) {
    moveDirection.subtractInPlace(right.scaleInPlace(0.7));
    hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
    var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI / 2, 0, 0);
    hero.rotationQuaternion = rotationQuaternion.multiply(hero.rotationQuaternion);
    if (!anim.Roll.isPlaying && !anim.Attack.isPlaying && !anim.Combo.isPlaying) {
      for (let key in anim) {
        if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
          if (key !== "Running" && key !== "Jump") anim[key].stop();
        }
      }
      if (!anim.Jump.isPlaying) {
        anim.Running.start(true, runningAnimSpeed, anim.Running.from, anim.Running.to, false);
      }
    }
  }
  if (inputMap["d"] || inputMap["ArrowRight"]) {
    moveDirection.addInPlace(right.scaleInPlace(0.7));
    hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
    var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(-Math.PI / 2, 0, 0);
    hero.rotationQuaternion = rotationQuaternion.multiply(hero.rotationQuaternion);
    if (!anim.Roll.isPlaying && !anim.Attack.isPlaying && !anim.Combo.isPlaying) {
      for (let key in anim) {
        if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
          if (key !== "Running" && key !== "Jump") anim[key].stop();
        }
      }
      if (!anim.Jump.isPlaying) {
        anim.Running.start(true, runningAnimSpeed, anim.Running.from, anim.Running.to, false);
      }
    }
  }

  // do for all four directions
  if (inputMap["a"] && inputMap["w"]) {
    hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
    var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll((3 * Math.PI) / 4, 0, 0);
    hero.rotationQuaternion = rotationQuaternion.multiply(hero.rotationQuaternion);
    moveDirection.scaleInPlace(0.72);
  }

  if (SPRINTING) {
    moveDirection = forward.scaleInPlace(sprintSpeed); // fix running in air when sprinting
    hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
    var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
    hero.rotationQuaternion = rotationQuaternion.multiply(hero.rotationQuaternion);

    if (!anim.Jump.isPlaying) {
      anim.Running.start(true, 1.5, anim.Running.from, anim.Running.to, false);
    }
  }

  if (MOVEMENT_OVERIDE_MOBILE) {
    if (MOVEMENT_OVERIDE_MOBILE_DIRECTION_X !== 0 || MOVEMENT_OVERIDE_MOBILE_DIRECTION_Y !== 0) {
      moveDirection = forward.scale(MOVEMENT_OVERIDE_MOBILE_DIRECTION_Y).add(right.scale(MOVEMENT_OVERIDE_MOBILE_DIRECTION_X)).normalize().scaleInPlace(speed);
      // console.log("moveDirection", moveDirection);
      // hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
      // var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
      // hero.rotationQuaternion = rotationQuaternion.multiply(hero.rotationQuaternion);

      const upVector = new BABYLON.Vector3(0, -1, 0);
      const rotationMatrix = BABYLON.Matrix.LookAtLH(BABYLON.Vector3.Zero(), moveDirection, upVector).invert();
      hero.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(rotationMatrix);

      if (!anim.Roll.isPlaying && !anim.Attack.isPlaying && !anim.Combo.isPlaying) {
        for (let key in anim) {
          if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
            if (key !== "Running" && key !== "Jump") anim[key].stop();
          }
        }
        if (!anim.Jump.isPlaying) {
          anim.Running.start(true, runningAnimSpeed, anim.Running.from, anim.Running.to, false);
        }
      }
    }
  }

  if (moveDirection.length() > 0) {
    // character.moveWithCollisions(moveDirection);
    // if (!anim.Roll.isPlaying) {
    // }
    moveDirection.y = currentVerticalVelocity;
    if (!anim.Jump.isPlaying) {
      if (!IS_SLIDING) {
        dummyAggregate.body.setLinearVelocity(moveDirection);
      }
      // send multiplayyer update every 200ms

      // Every 500ms send multiplayer position
    }
    // if (anim.Roll.isPlaying) {
    //   moveDirection.x *= 5;
    //   moveDirection.z *= 5;
    //   dummyAggregate.body.setLinearVelocity(moveDirection);
    // }

    if (anim.Roll.isPlaying || anim.Attack.isPlaying || anim.Combo.isPlaying) {
      // dummyAggregate.body.setLinearVelocity(moveDirection.scaleInPlace(0.5 * rollSpeed));
    } else {
      lastMoveDirection = moveDirection;
    }
  }

  if (!inputMap["w"] && !inputMap["s"] && !inputMap["a"] && !inputMap["d"] && !SPRINTING && !mobileMoving) {
    if (!MOVEMENT_OVERIDE_MOBILE || (MOVEMENT_OVERIDE_MOBILE_DIRECTION_X === 0 && MOVEMENT_OVERIDE_MOBILE_DIRECTION_Y === 0)) {
      //Default animation is idle when no key is down

      // anim.BreathingIdle.start(true, 1.0, anim.BreathingIdle.from, anim.BreathingIdle.to, true);
      anim.Running.stop();
      // for (let key in anim) {
      //     if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
      //         if (key !== 'BreathingIdle')anim[key].stop();
      //     }
      // }
      if (!anim.Roll.isPlaying && !anim.SelfCast.isPlaying && !anim.Attack.isPlaying && !anim.Combo.isPlaying && !anim.Jump.isPlaying) {
        anim.BreathingIdle.play(true);
      }
      // console.log()
      // const noYMovementOnSlope = new BABYLON.Vector3(character.position.x, character.position.y, character.position.z);
      // dummyAggregate.body.setTargetTransform(noYMovementOnSlope);
      // dummyAggregate.body.setLinearVelocity(noYMovementOnSlope);

      //Stop all animations besides Idle Anim when no key is down
      // sambaAnim.stop();

      // console.log(anim.Running._weight);
      // if (anim.Running._weight >= -1 ) {
      //     anim.Running._weight -= 0.03;
      // }

      // walkBackAnim.stop();
    }
  }

  let combo1length = anim.Combo.from + 60;
  let combo2length = anim.Combo.from + 110;
  // combo
  if (inputMap["j"] || (mouseIsActive && !thirdAttack)) {
    anim.BreathingIdle.stop();
    anim.Running.stop();
    if (!anim.Roll.isPlaying && !anim.Running.isPlaying) {
      for (let key in anim) {
        if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
          if (key !== "Combo") anim[key].stop();
        }
      }

      if (combo === 1) {
        // anim.Combo.start(false, 1.8, combo1length -5, combo2length, true);
        combo += 1;
      }
      if (combo === 2) {
        anim.Combo.start(false, 1.6, combo2length, anim.Combo.to - 65, true);
      }
      if (combo === 3) {
        anim.Combo.start(false, 1.6, anim.Combo.from + 25, combo1length, true);

        combo = 0;
      }
    }
  }

  // todo replace input map with keyrebind
  // todo replace with spell system.
  if (inputMap["h"] || thirdAttack) {
    anim.BreathingIdle.stop();
    anim.Running.stop();
    if (!anim.Roll.isPlaying && !anim.Running.isPlaying) {
      for (let key in anim) {
        if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
          if (key !== "Attack") anim[key].stop();
        }
      }
      anim.Attack.start(false, 1.3, anim.Attack.from, anim.Attack.to - 20, true);

      // spawn effect
    }
  }

  if (inputMap["c"]) {
    // anim.Running.stop();
    if (!anim.Roll.isPlaying && !anim.Running.isPlaying) {
      for (let key in anim) {
        if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
          if (key !== "SelfCast") anim[key].stop();
        }
      }
      // anim.SelfCast.play();
      anim.SelfCast.start(false, 1.0, anim.SelfCast.from, anim.SelfCast.to - 50, true);
    }
  }

  if (inputMap["shift"]) {
    anim.BreathingIdle.stop();
    anim.Running.stop();
    anim.Roll.start(false, 2.0, anim.Roll.from, anim.Roll.to, true);
    // speed = rollSpeed;
    // setTimeout(() => speed = normalSpeed, 800);
  }

  if (inputMap[" "] && !anim.Jump.isPlaying) {
    // let jumpImpulse = new BABYLON.Vector3(0, 2000000, 0);
    anim.Jump.start(false, 0.7, anim.Jump.from + 30, anim.Jump.to - 34, false);
    // dummyAggregate.physicsImpostor.applyImpulse(
    //   jumpImpulse,
    //   character.getAbsolutePosition()
    // );
    // if (character.physicsImpostor) {
    const currentVelocity = dummyAggregate.body.getLinearVelocity();

    // Only allow jumping if we're close to the ground (not already jumping)
    // Apply upward impulse while maintaining current horizontal velocity
    const jumpVelocity = new BABYLON.Vector3(
      currentVelocity.x * 2,
      60.0, // Jump force - adjust this value to change jump height
      currentVelocity.z * 2
    );
    dummyAggregate.body.setLinearVelocity(jumpVelocity);
    // }
  }

  const characterSpeed = 3000;
  if (character.touchTarget) {
    const distanceToTarget = BABYLON.Vector3.Distance(character.position, character.touchTarget);

    if (distanceToTarget > attackDistance) {
      //mobileMoveDistance // Provide a threshold to stop moving when close enough
      const direction = character.touchTarget.subtract(character.position).normalize();
      const step = direction.scale(characterSpeed / 60); // Assuming about 60 FPS
      // character.position.addInPlace(step);
      dummyAggregate.body.setLinearVelocity(step);
      let forwardAngle = Math.atan2(direction.x, direction.z);
      hero.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(forwardAngle, 3.14, 0);
      var rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(Math.PI, 0, 0);
      hero.rotationQuaternion = rotationQuaternion.multiply(hero.rotationQuaternion);

      // if (!anim.Roll.isPlaying && !anim.Attack.isPlaying && !anim.Combo.isPlaying){
      //     for (let key in anim) {
      //         if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
      //             if (key !== 'Running')anim[key].stop();
      //         }
      //     }
      //     anim.Running.start(true, runningAnimSpeed, anim.Running.from, anim.Running.to, false);
      // }

      mobileMoving = true;
      if (!anim.Jump.isPlaying) {
        anim.Running.start(true, runningAnimSpeed, anim.Running.from, anim.Running.to, false);
      }
    } else {
      mobileMoving = false;
      // character.position.copyFrom(character.touchTarget); // Snap to the target position to stop movement
      // Optionally, remove this observer if no longer needed
      // scene.onBeforeRenderObservable.remove(moveToTargetObserver);
    }
  }
}

function stopAllAnimations() {
  for (let key in anim) {
    if (anim.hasOwnProperty(key) && anim[key].isPlaying) {
      anim[key].stop();
    }
  }
}

class CustomArcRotateCameraGamepadInput extends BABYLON.ArcRotateCameraGamepadInput {
  constructor() {
    super();
    this.rotationSpeedFactorX = 0.003; // Adjust this value to control rotation speed
    this.rotationSpeedFactorY = 0.0015;
    this.deadzoneX = 0.1;
    this.deadzoneY = 0.16;
  }

  checkInputs() {
    if (this.gamepad) {
      const camera = this.camera;
      const rsValues = this.gamepad.rightStick;

      // if (rsValues) {
      //   // Apply the rotation speed factor to the camera's rotation
      //   camera.inertialAlphaOffset -= rsValues.x * this.rotationSpeedFactorX;
      //   camera.inertialBetaOffset -= rsValues.y * this.rotationSpeedFactorY;
      // }
      if (rsValues) {
        // Apply deadzone
        const normalizedRX = Math.abs(rsValues.x) > this.deadzoneX ? rsValues.x : 0;
        const normalizedRY = Math.abs(rsValues.y) > this.deadzoneY ? rsValues.y : 0;

        // Apply sensitivity with cameraSlow
        camera.inertialAlphaOffset -= normalizedRX * this.rotationSpeedFactorX;
        camera.inertialBetaOffset += normalizedRY * this.rotationSpeedFactorY;
      }
    }
  }
}
