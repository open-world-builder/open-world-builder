export function setupCamera(scene, target, engine) {
  const camera = new BABYLON.ArcRotateCamera("arcCam", (3 * Math.PI) / 2, (3 * Math.PI) / 8, 200, target.position, scene);
  camera.attachControl(document.getElementById("renderCanvas"), false);

  scene.collisionsEnabled = true;
  // camera.checkCollisions = true;
  camera.collisionRadius = new BABYLON.Vector3(0.5, 0.5, 0.5);

  camera.allowUpsideDown = false;
  camera.panningSensibility = 0;

  camera.radius = 70;

  // More Professional Limited Camera, avoids collision
  camera.wheelDeltaPercentage = 0.02;
  // camera.upperBetaLimit = 3.13;
  camera.lowerRadiusLimit = 8; // Minimum distance to target (closest zoom)
  camera.upperRadiusLimit = 656.8044;
  camera.upperBetaLimit = Math.PI / 2; // Stops at the horizon (90 degrees)
  camera.lowerBetaLimit = (Math.PI / 2) * 0.01; // Slightly below the top-down view
  camera.alpha = 4.954;
  camera.beta = 1.3437;
  // camera.fov = 1.04;
  camera.inputs.attached.keyboard.angularSpeed = 0.002;

  camera.preferredZoom = 100; // Set initial preferred zoom
  camera.preferredOffset = new BABYLON.Vector3(0, 0, 0); // Set initial preferred offset
  camera.shouldPreferredOffset = false;

  let zoomTimeout;
  scene.onPointerObservable.add((pointerInfo) => {
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
      camera.shouldPrefferedZoom = false;

      // Clear any existing timeout
      clearTimeout(zoomTimeout);

      // Set new timeout
      zoomTimeout = setTimeout(() => {
        camera.shouldPrefferedZoom = true;
        camera.preferredZoom = camera.radius;
      }, 500);

      // if (camera.firstPerson && pointerInfo.event.wheelDelta < 0) {
      //   toggleFirstPersonView(scene, target);
      //   return;
      // }

      // // Check if camera is very close and user is still trying to zoom in
      // if (!camera.firstPerson && camera.radius <= camera.lowerRadiusLimit + 0.5 && pointerInfo.event.wheelDelta > 0) {
      //   toggleFirstPersonView(scene, target);
      //   return;
      // }
    }
  });
  camera.shouldPrefferedZoom = true;

  // if camera
  // setupCameraCollision(scene, camera, target);
  // setupCameraCollisionZoomInOnly(scene, camera, target);
  setupCollision(scene, camera, target);

  setupTurnCamera(scene, camera, engine);
  if (isMobileDevice()) {
    // keep the left click and drag to rotate the camera
  } else {
    freeLeftClick(scene, camera);
  }

  // Add these lines after the initial camera setup (around line 12)
  camera.firstPerson = false;
  camera.defaultRadius = 8.01; // Store the default third-person distance
  camera.followCamera = false; // Make camera mode enum instead of .firstPerson and .followCamera

  // Add key listener for first-person toggle
  window.addEventListener("keydown", (event) => {
    if (event.key === "/") toggleFirstPersonView(scene, target);
  });

  // Add the interaction raycast setup
  let picked = {};
  setupInteractionRaycast(scene, target, picked);
  picked.interactionPickedMesh = null;
  window.addEventListener("keydown", async (event) => {
    if (event.key.toLowerCase() === "f") {
      if (picked.interactionPickedMesh) {
        // camera.interactionPickedMesh.interact();
        // if (picked.interact) {
        //   picked.interact.interact();
        // }
        if (picked.interactionPickedMesh.interact) {
          // picked.interactionPickedMesh.interact.interact();
          if (picked.interactionPickedMesh.interact.defaultAction === "grab") {
            scene.activeCamera.sound.play("Pickup");
            picked.interactionPickedMesh.dispose();
          } else if (picked.interactionPickedMesh.interact.defaultAction === "talk") {
            window.NPCMenu.show(picked.interactionPickedMesh.parent.NPC, scene.pointerX, scene.pointerY);
          } else {
            picked.interactionPickedMesh.interact.interact();
          }
        }

        picked.interactionPickedMesh = null;
        interactionUI.style.opacity = "0";
      }
    }
  });

  // setup pointer lock
  // let isPointerLocked = false;
  // document.addEventListener("pointerlockchange", () => {
  //   isPointerLocked = document.pointerLockElement === canvas;
  // });
  // document.addEventListener("mousemove", (event) => {
  //   if (!isPointerLocked) return;

  //   const sensitivity = 0.002; // Adjust sensitivity as needed
  //   camera.alpha -= event.movementX * sensitivity;
  //   camera.beta -= event.movementY * sensitivity;

  //   // Clamp beta to prevent the camera from flipping
  //   const lowerLimit = 0.01;
  //   const upperLimit = Math.PI - 0.01;
  //   camera.beta = Math.max(lowerLimit, Math.min(upperLimit, camera.beta));
  // });
  let isPointerLocked = false;
  document.addEventListener("pointerlockchange", () => {
    isPointerLocked = document.pointerLockElement === canvas;
  });
  scene.onPointerObservable.add((pointerInfo) => {
    if (!isPointerLocked) return;
    switch (pointerInfo.type) {
      case BABYLON.PointerEventTypes.POINTERMOVE:
        // Implement camera movement logic here based on pointerInfo.event.movementX and movementY
        const sensitivity = 0.002; // Adjust sensitivity as needed
        camera.alpha -= pointerInfo.event.movementX * sensitivity;
        camera.beta -= pointerInfo.event.movementY * sensitivity;

        // Clamp beta to prevent the camera from flipping
        const lowerLimit = 0.01;
        const upperLimit = Math.PI - 0.01;
        camera.beta = Math.max(lowerLimit, Math.min(upperLimit, camera.beta));
        break;
    }
  });
  // camera.inertia = 0.5;

  return camera;
}

function setupCollision(scene, camera, target) {
  // Check to see if camera can move back, ray creation every 2 seconds

  const checkCollision = () => {
    const direction = target.position.subtract(camera.position).normalize();
    const preferredPosition = target.position.subtract(direction.scale(camera.preferredZoom));

    // Calculate distance between preferred position and target
    const rayLength = BABYLON.Vector3.Distance(target.position, preferredPosition);

    // Create ray from target to preferred position
    const ray = new BABYLON.Ray(target.position, preferredPosition.subtract(target.position).normalize(), rayLength);
    // const rayHelper = new BABYLON.RayHelper(ray);
    // rayHelper.show(scene, new BABYLON.Color3(0, 1, 0)); // Green color for visibility

    const hit = scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh !== target);
    if (hit.hit) {
      // console.log("hit", "can't move");
      // console.log("hit.pickedMesh", hit.pickedMesh.name);
      camera.hitCanMove = false;
    } else {
      camera.hitCanMove = true;
    }
    // Remove the ray after 1 second
    // setTimeout(() => {
    // rayHelper.dispose();
    // }, 1000);
  };

  let rayInterval = setInterval(checkCollision, 500);

  // Clean up interval when scene is disposed
  scene.onDisposeObservable.add(() => {
    clearInterval(rayInterval);
  });

  // Smooth camera settings
  const smoothFactor = 0.015;

  // Desired target position with an offset for the character height
  // const desiredTargetOffset = new BABYLON.Vector3(0, 3.5, 0);

  // Collision settings
  const collisionMargin = 10.5;
  const minWallDistance = 3.0; // minimum distance to wall
  // Add a buffer to prevent oscillation
  const collisionBuffer = 0.5; // Adjust this value as needed

  camera.defaultTarget = target.position.clone();
  camera.focusedOnNPC = false;
  camera.focusTransitionSpeed = 0.05;

  let cameraDebug = false;
  if (cameraDebug) {
    BABYLON.Tools.LoadScriptAsync("https://cdn.jsdelivr.net/npm/lil-gui@0.17.0/dist/lil-gui.umd.min.js").then(() => {
      const gui = new lil.GUI({ title: "Camera Settings" });
      gui
        .add(camera, "focusTransitionSpeed", 0.01, 0.2)
        .name("Camera Focus Speed")
        .onChange((value) => {
          camera.focusTransitionSpeed = value;
        });
    });
  }

  let defaultZoom = () => camera.radius;
  let preferredZoom = () => camera.preferredZoom;

  scene.registerBeforeRender(() => {
    if (camera.followCamera) {
    } else if (camera.firstPerson) {
      // Calculate forward direction based on camera rotation
      // const forward = new BABYLON.Vector3(Math.sin(camera.alpha), 0, Math.cos(camera.alpha));

      // Position camera in front of character
      // const basePosition = target.position.add(new BABYLON.Vector3(0, camera.heightOffset, 0));

      // camera.target = basePosition;

      // probably need
      const basePosition = target.position.add(new BABYLON.Vector3(0, camera.heightOffset, 0));
      camera.beta;
      camera.target = basePosition;

      // camera.radius = 0;
      // this with no radius upper or lower bounds set is really cool follow camera! could be used for zones to load in. a really cooly fresh effect
      // const basePosition = target.position.add(new BABYLON.Vector3(0, camera.heightOffset, 0));
      // camera.target = basePosition;
    } else {
      if (camera.focusedOnNPC) {
        if (target.velocity && target.velocity.length() > 0.01) {
          // Player is moving, transition back to player
          camera.focusedOnNPC = false;
          // camera.focusTarget = target.position;
        }
      } else {
        // camera.focusTarget = target.position;
      }

      // Smooth camera target transition
      if (camera.focusTarget) {
        // console.log("lerping");
        camera.target = BABYLON.Vector3.Lerp(camera.target, camera.focusTarget, camera.focusTransitionSpeed);
      }

      // smooth follow camera like KOA, disable for WOW like
      // if (camera.smoothFollowCamera) {
      //   camera.target = BABYLON.Vector3.Lerp(camera.target, camera.focusTarget, camera.focusTransitionSpeed);
      // }
      // console.log("camera.preferredZoom", preferredZoom());

      // Update camera target smoothly
      // camera.target = BABYLON.Vector3.Lerp(
      //     camera.target,
      //     target.position.add(desiredTargetOffset),
      //     smoothFactor
      // );

      // Cast ray from camera to target to handle collisions
      const direction = target.position.subtract(camera.position).normalize();
      // 2) choose your shift amount
      const shiftAmount = -5.5;
      // 3) move the camera forward
      const rayOrigin = camera.position.add(direction.scale(shiftAmount));
      const ray = new BABYLON.Ray(rayOrigin, direction, camera.radius + collisionMargin);
      const hit = scene.pickWithRay(ray, (mesh) => mesh.isPickable && mesh !== target);
      if (hit.hit) {
        //     console.log(hit);
        // console.log(hit.pickedMesh.name);
        // console.log("hit.distance", hit.distance);
      }

      if (hit?.pickedMesh && !camera.focusedOnNPC) {
        //     // Adjust camera radius based on collision, ensuring it doesn't go below the minimum radius
        //     const safeDistance = Math.max(hit.distance - collisionMargin, camera.lowerRadiusLimit);
        // const safeDistance = hit.distance - collisionBuffer;
        const safeDistance = camera.radius - hit.distance; // - buffer
        // if (camera.safeDistance < safeDistance) {
        // camera.canZoomOut = true;
        camera.safeDistance = safeDistance;

        // }
        // camera.preferredZoom = 100;

        //     // camera.radius = BABYLON.Scalar.Lerp(camera.radius, safeDistance, smoothFactor);
        camera.radius = safeDistance;
        camera.hitCanMove = false;

        //     console.log("safeDistance", safeDistance);
        //     console.log("camera.radius", camera.radius);
      } else {
        // camera.safeDistance = camera.radius - 1;
        // camera.radius = preferredZoom();
        //     // Smoothly return to the preferred zoom level when no collision
      }
      if (camera.shouldPreferredOffset && !camera.focusedOnNPC) {
        const currentOffset = camera.target.subtract(target.position);
        const lerpedOffset = BABYLON.Vector3.Lerp(currentOffset, camera.preferredOffset, smoothFactor);
        camera.target = target.position.add(lerpedOffset);
      }
      if (camera.isShaking) {
        if (camera.shakeXOffset) {
          camera.target.x = camera.target.x + camera.shakeXOffset;
        }
        if (camera.shakeYOffset) {
          camera.target.y = camera.target.y + camera.shakeYOffset;
        }
      }

      if (camera.shouldPrefferedZoom) {
        // console.log("camera.lastRadius", camera.lastRadius);

        // console.log("preferredZoom", preferredZoom());

        if (Math.abs(camera.radius - preferredZoom()) > 0.8) {
          if (camera.hitCanMove) {
            camera.radius = BABYLON.Scalar.Lerp(camera.radius, preferredZoom(), smoothFactor);
          }

          // if (Math.abs(camera.radius - preferredZoom()) > 0.5) {
          // if (camera.safeDistance < camera.radius ) {
          // if (camera.canZoomOut) {
          // if (preferredZoom() < camera.safeDistance  ) {

          // console.log("camera.radius", camera.radius);

          // let variSmooth = 0.03 * 100 / camera.radius;
          // let variBound = 0.21 * 100 / camera.radius;
          // camera.radius = BABYLON.Scalar.Lerp(camera.radius, preferredZoom(), smoothFactor) -0.21;
          // camera.radius = BABYLON.Scalar.Lerp(camera.radius, preferredZoom(), variSmooth) -variBound;

          // camera.radius = BABYLON.Scalar.Lerp(camera.radius, preferredZoom(), 0.03) -0.21;

          // } else {
          // camera.radius = BABYLON.Scalar.Lerp(camera.radius, camera.safeDistance, smoothFactor);
          // }
          // }
          // }

          // }
        }

        // if (Math.abs(camera.lastRadius - camera.radius) > 2.5) {
        //     camera.radius = camera.lastRadius;
        // }

        camera.lastRadius = camera.radius;
      }
    }
  });
}

export function setupCameraOld(scene, target, engine) {
  const camera = new BABYLON.ArcRotateCamera("arcCam", (3 * Math.PI) / 2, (3 * Math.PI) / 8, 200, target.position, scene);
  camera.attachControl(document.getElementById("renderCanvas"), false);

  scene.collisionsEnabled = true;
  // camera.checkCollisions = true;
  camera.collisionRadius = new BABYLON.Vector3(0.5, 0.5, 0.5);

  camera.allowUpsideDown = false;
  camera.panningSensibility = 0;

  camera.radius = 70;

  // More Professional Limited Camera, avoids collision
  camera.wheelDeltaPercentage = 0.02;
  // camera.upperBetaLimit = 3.13;
  camera.lowerRadiusLimit = 4; // Minimum distance to target (closest zoom)
  camera.upperRadiusLimit = 656.8044;
  camera.upperBetaLimit = Math.PI / 2; // Stops at the horizon (90 degrees)
  camera.lowerBetaLimit = (Math.PI / 2) * 0.01; // Slightly below the top-down view
  camera.alpha = 4.954;
  camera.beta = 1.3437;
  // camera.fov = 1.04;

  // if camera
  // setupCameraCollision(scene, camera, target);
  // setupCameraCollisionZoomInOnly(scene, camera, target);

  setupTurnCamera(scene, camera, engine);
  if (isMobileDevice()) {
    // keep the left click and drag to rotate the camera
  } else {
    freeLeftClick(scene, camera);
  }
  return camera;
}

function setupCameraCollision(scene, camera, player) {
  camera.upperBetaLimit = Math.PI; // Full rotate

  let cameraSnap = 0.01;
  let targetRadius = 80;
  let targetPosition = camera.position.clone();
  let transitionSpeed = 0.1;

  let ray = new BABYLON.Ray(camera.position, player.position.subtract(camera.position), 800);
  // let rayHelper = new BABYLON.RayHelper(ray);
  // rayHelper.show(scene);

  let frameCounter = 0;
  const updateInterval = 10; // Update every 3 frames
  scene.registerBeforeRender(() => {
    const offset = 0.0; // Adjust this value as needed
    ray.direction = player.position.subtract(camera.position).normalize();
    ray.origin = camera.position.add(ray.direction.scale(offset));

    // Perform ray cast
    let pickInfo = scene.pickWithRay(ray, (mesh) => mesh !== player);

    let hitObjectName = pickInfo.pickedMesh ? pickInfo.pickedMesh.name : "Unknown";
    // console.log("Hit object name:", hitObjectName);
    // console.log("pickInfo.pickedMesh.cameraCollide", pickInfo.pickedMesh?.cameraCollide);

    let distanceBetweenCameraAndProjected = BABYLON.Vector3.Distance(camera.position, BABYLON.Vector3.Lerp(camera.position, targetPosition, 0.2));

    if (pickInfo.pickedMesh?.cameraCollide ?? true) {
      let distanceToObject = pickInfo.distance;
      let distanceToPlayer = BABYLON.Vector3.Distance(camera.position, player.position);

      // Adjust these values as needed
      let minDistanceFromWall = 0; // Minimum distance to keep from the wall
      let minDistanceFromPlayer = 0; // Minimum distance to keep from the player
      let forwardBias = 0.0; // Small forward bias

      // Calculate target distance
      let targetDistance = Math.min(distanceToObject - minDistanceFromWall, distanceToPlayer - minDistanceFromPlayer);

      // Ensure we don't go backwards
      // targetDistance = Math.max(targetDistance, 0);

      // Calculate new target position
      targetPosition = camera.position.add(ray.direction.scale(targetDistance));

      // console.log(distanceToPlayer);
      // console.log(distanceToPlayer);
      // camera.position = targetPosition;
      let distanceBetweenCameraAndProjected = BABYLON.Vector3.Distance(camera.position, BABYLON.Vector3.Lerp(camera.position, targetPosition, 0.2));

      // if (distanceBetweenCameraAndProjected > 0.10) {
      camera.position = BABYLON.Vector3.Lerp(camera.position, targetPosition, 0.91);
      // camera.position = targetPosition;
      // } else {
      // console.log("not moving");
      // }
    } else {
      // if the camera has room to move inward, don't apply moving out force
      if (distanceBetweenCameraAndProjected > cameraSnap) {
        // If no collision, set target to a position behind the player
        let defaultDistance = 70;
        let judgedDistance = targetRadius;

        let distanceToPlayer = BABYLON.Vector3.Distance(camera.position, player.position);
        // if there would still be a collision, set distance to player, otherwise set target radius
        if (distanceToPlayer < targetRadius) judgedDistance = distanceToPlayer;
        // defaultDistance = camera.radius;
        // targetPosition = player.position.subtract(ray.direction.scale(defaultDistance));

        // console.log(pickInfo.pickedMesh?.cameraCollide);
        targetPosition = player.position.subtract(ray.direction.scale(targetRadius));
        // targetPosition = player.position.subtract(ray.direction.scale(judgedDistance));

        camera.position = BABYLON.Vector3.Lerp(camera.position, targetPosition, 0.02);
        // camera.position = targetPosition;
      }
    }

    // Smoothly move camera
    // camera.position = BABYLON.Vector3.Lerp(camera.position, targetPosition, transitionSpeed);

    // camera.radius = BABYLON.Vector3.Lerp(camera.radius, targetRadius, transitionSpeed);
  });

  // scene.onPointerObservable.add((pointerInfo) => {
  //     if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
  //         // Adjust zoom speed as needed
  //         let zoomSpeed = 1;
  //         targetRadius += pointerInfo.event.wheelDelta * zoomSpeed;

  //         // Set min and max zoom limits
  //         targetRadius = Math.max(5, Math.min(targetRadius, 100));
  //     }
  // });
}

function setupCameraCollisionZoomInOnly(scene, camera, player) {
  camera.upperBetaLimit = Math.PI; // Full rotate

  let cameraSnap = 0.01;
  let targetRadius = 80;
  let targetPosition = camera.position.clone();
  let transitionSpeed = 0.1;

  let ray = new BABYLON.Ray(camera.position, player.position.subtract(camera.position), 800);
  // let rayHelper = new BABYLON.RayHelper(ray);
  // rayHelper.show(scene);

  let frameCounter = 0;
  const updateInterval = 10; // Update every 3 frames
  scene.registerBeforeRender(() => {
    const offset = 0.0; // Adjust this value as needed
    ray.direction = player.position.subtract(camera.position).normalize();
    ray.origin = camera.position.add(ray.direction.scale(offset));

    // Perform ray cast
    let pickInfo = scene.pickWithRay(ray, (mesh) => mesh !== player);

    // console.log("Hit object name:", hitObjectName);
    // console.log("pickInfo.pickedMesh.cameraCollide", pickInfo.pickedMesh?.cameraCollide);

    if (pickInfo.pickedMesh?.cameraCollide ?? true) {
      let distanceToObject = pickInfo.distance;
      let distanceToPlayer = BABYLON.Vector3.Distance(camera.position, player.position);

      // Adjust these values as needed
      let minDistanceFromWall = 0; // Minimum distance to keep from the wall
      let minDistanceFromPlayer = 0; // Minimum distance to keep from the player
      let forwardBias = 0.0; // Small forward bias

      // Calculate target distance
      let targetDistance = Math.min(distanceToObject - minDistanceFromWall, distanceToPlayer - minDistanceFromPlayer);

      // Ensure we don't go backwards
      // targetDistance = Math.max(targetDistance, 0);

      // Calculate new target position
      targetPosition = camera.position.add(ray.direction.scale(targetDistance));

      // console.log(distanceToPlayer);
      // console.log(distanceToPlayer);
      // camera.position = targetPosition;
      let distanceBetweenCameraAndProjected = BABYLON.Vector3.Distance(camera.position, BABYLON.Vector3.Lerp(camera.position, targetPosition, 0.2));

      // if (distanceBetweenCameraAndProjected > 0.10) {
      camera.position = BABYLON.Vector3.Lerp(camera.position, targetPosition, 0.91);
      // camera.position = targetPosition;
      // } else {
      // console.log("not moving");
      // }
    }
  });

  // scene.onPointerObservable.add((pointerInfo) => {
  //     if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
  //         // Adjust zoom speed as needed
  //         let zoomSpeed = 1;
  //         targetRadius += pointerInfo.event.wheelDelta * zoomSpeed;

  //         // Set min and max zoom limits
  //         targetRadius = Math.max(5, Math.min(targetRadius, 100));
  //     }
  // });
}

function setupTurnCamera(scene, camera, engine) {
  var cameraRotationSpeed = 2.25; // Adjust this value for faster or slower rotation
  var keyStates = {};

  // Function to handle keydown event
  function onKeyDown(event) {
    keyStates[event.key] = true;
  }

  // Function to handle keyup event
  function onKeyUp(event) {
    keyStates[event.key] = false;
  }

  // Add event listeners to the window
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  scene.onBeforeRenderObservable.add(() => {
    if (keyStates["q"]) {
      camera.alpha;
      camera.alpha += (cameraRotationSpeed * engine.getDeltaTime()) / 1000;
    }

    // Check if 'D' is pressed for rotating right
    if (keyStates["e"]) {
      camera.alpha -= (cameraRotationSpeed * engine.getDeltaTime()) / 1000;
    }
  });
}

// In camera.js, add this function:
function setupInteractionRaycast(scene, target, picked) {
  let frameCount = 0;
  const checkInterval = 100;
  // Create a dynamic texture for the interaction UI if needed
  let interactionUI = document.createElement("div");
  interactionUI.style.position = "absolute";
  interactionUI.style.top = "50%";
  interactionUI.style.left = "60%";
  interactionUI.style.transform = "translate(-50%, -50%)";
  // interactionUI.style.display = "block";
  interactionUI.style.visibility = "hidden";
  interactionUI.style.color = "white";
  interactionUI.style.padding = "10px";
  interactionUI.style.borderRadius = "5px";
  interactionUI.style.zIndex = "1";
  interactionUI.id = "interactionUI";
  interactionUI.style.transition = "opacity 0.6s ease";
  interactionUI.style.opacity = "0";
  interactionUI.style.textShadow = "rgba(0, 0, 0, 0.97) 1px 0px 5px";
  interactionUI.fadingOut = false;

  // btn.textContent = text;
  interactionUI.style.marginRight = "5px";
  interactionUI.style.textShadow = "rgba(0, 0, 0, 0.97) 1px 0px 5px";
  interactionUI.style.fontWeight = "bold";
  interactionUI.style.fontSize = "15px";
  interactionUI.style.padding = "10px";
  interactionUI.style.marginBottom = "5px";
  // btn.style.fontFamily = "revert";
  interactionUI.style.borderRadius = "5px";
  interactionUI.style.backgroundColor = "#000";
  interactionUI.style.color = "#fff4d5";
  interactionUI.style.boxShadow = "0px 0px 14px 0px rgba(0, 0, 0, 0.9)";
  interactionUI.style.cursor = "pointer";
  // interactionUI.style.backgroundColor = "rgba(0, 0, 0, 0.5)";

  // Add click event listener to interactionUI TODO Make this the same function as F keypress
  interactionUI.addEventListener("click", () => {
    if (picked.interactionPickedMesh) {
      if (picked.interactionPickedMesh.interact) {
        if (picked.interactionPickedMesh.interact.defaultAction === "grab") {
          scene.activeCamera.sound.play("Pickup");
          picked.interactionPickedMesh.dispose();
        } else if (picked.interactionPickedMesh.interact.defaultAction === "talk") {
          window.NPCMenu.show(picked.interactionPickedMesh.parent.NPC, scene.pointerX, scene.pointerY);
        } else {
          picked.interactionPickedMesh.interact.interact();
        }
      }
      picked.interactionPickedMesh = null;
    }
    interactionUI.style.opacity = "0";
    window.TERRAIN_EDITOR.canvas.focus();
  });
  const keybindImage = document.createElement("img");
  keybindImage.id = "interactFKeybind";
  keybindImage.src = "/assets/util/ui/buttons/interact_f.png";
  keybindImage.style.width = "200px";
  keybindImage.style.height = "200px";
  keybindImage.style.marginRight = "5px";
  keybindImage.style.cursor = "pointer";
  keybindImage.style.verticalAlign = "middle"; // Align vertically with text
  keybindImage.style.display = "absolute"; // Ensure it displays inline
  keybindImage.style.left = "50%";
  keybindImage.style.top = "50%";
  keybindImage.style.transform = "translate(-50%, -50%)";

  // Modify the interactionUI container styling
  interactionUI.style.display = "flex"; // Change to flex container
  interactionUI.style.alignItems = "center"; // Center items vertically
  interactionUI.style.justifyContent = "center"; // Center items horizontally
  interactionUI.style.flexDirection = "column"; // Stack items vertically

  // Update keybind image styling
  keybindImage.style.display = "block"; // Change from absolute to block
  keybindImage.style.position = "absolute"; // Remove absolute positioning
  keybindImage.style.width = "40px"; // Adjust size as needed
  keybindImage.style.height = "25px"; // Adjust size as needed
  keybindImage.style.marginBottom = "5px"; // Add space between image and text
  keybindImage.style.filter = "brightness(2.4)";
  keybindImage.style.left = "30px";

  // Create a text container for the interaction text
  const textContainer = document.createElement("div");
  textContainer.style.textAlign = "center";
  textContainer.style.width = "100%";
  textContainer.style.marginLeft = "47px";

  // Move the existing text to the text container when it's set
  const originalSetText = Object.getOwnPropertyDescriptor(interactionUI, "textContent");
  Object.defineProperty(interactionUI, "textContent", {
    set: function (value) {
      textContainer.textContent = value;
    },
    get: function () {
      return textContainer.textContent;
    },
  });

  // Clear the interactionUI and add elements in the correct order
  interactionUI.innerHTML = "";
  interactionUI.appendChild(keybindImage);
  interactionUI.appendChild(textContainer);

  document.body.appendChild(interactionUI);

  const debug = false;
  if (debug) {
    // Create a persistent ray helper
    const rayHelper = new BABYLON.RayHelper(new BABYLON.Ray(BABYLON.Vector3.Zero(), BABYLON.Vector3.Forward(), 20));

    // Configure ray helper visualization
    rayHelper.show(scene, new BABYLON.Color3(1, 0, 0)); // Red color for the ray
  }

  // Cache vectors to avoid creating new ones every frame
  const rayOrigin = new BABYLON.Vector3();
  const heightOffset = new BABYLON.Vector3(0, 5, 0);
  const interactDistance = 100;

  // Predefined predicate function for pickWithRay
  const predicate = (mesh) => mesh.isInteractable === true;

  const npcMenu = document.getElementById("npc-menu");
  // Register the raycast check in the render loop
  scene.registerBeforeRender(() => {
    frameCount++;
    if (frameCount % checkInterval !== 0) return;

    // Reuse vectors instead of creating new ones
    rayOrigin.copyFrom(target.position).addInPlace(heightOffset);
    const ray = new BABYLON.Ray(rayOrigin, scene.activeCamera.getForwardRay().direction, interactDistance);
    if (debug) rayHelper.ray = ray;

    // Use cached predicate function
    const hit = scene.pickWithRay(ray, predicate);

    // Update UI based on hit result
    if (hit.hit && hit.pickedMesh) {
      if (IS_IN_CONVERSATION) {
        return;
      }

      picked.interactionPickedMesh = hit.pickedMesh;

      interactionUI.style.opacity = "1";
      interactionUI.style.visibility = "visible";
      interactionUI.fadingOut = false;
      // interactionUI.style.display = "block";

      // Cache parent NPC check
      const npc = hit.pickedMesh.parent?.NPC;
      if (npc) {
        if (npc.isInCombat) {
          interactionUI.style.opacity = "0";
          interactionUI.style.visibility = "hidden";
          return;
        }
        // if (!(npcMenu.style.display === "block")) {
        //   return;
        // }
        interactionUI.textContent = `Talk to ${npc.name}`;
      } else {
        // else if (hit.pickedMesh.isGrabable) {
        //   interactionUI.textContent = "F: Pick Up";
        // } else {
        // interactionUI.textContent = "F: Interact";
        if (picked.interactionPickedMesh.interact) {
          // interactionUI.textContent = "F: " + picked.interactionPickedMesh.interact.getDefaultActionText();
          interactionUI.textContent = "" + picked.interactionPickedMesh.interact.getDefaultActionText();
          // used for secondary action, like read, edit material
          // interactionUI.textContent2 = picked.interactionPickedMesh.interact.getSecondaryctionText();
          //
        }
      }
      // }
    } else {
      // interactionUI.style.display = "none";
      interactionUI.style.opacity = "0";
      if (!interactionUI.fadingOut) {
        interactionUI.fadingOut = true;

        setTimeout(() => {
          if (!interactionUI.fadingOut) {
            return;
          }
          interactionUI.style.visibility = "hidden";
          interactionUI.fadingOut = false;
        }, 600);
      }
    }
  });
}

// Function to update camera beta limit based on terrain height
// function updateCameraBetaLimit() {
//     var ray = new Babylon.Ray(camera.target, new Babylon.Vector3(0, -1, 0));
//     var pickInfo = scene.pickWithRay(ray, function(mesh) { return mesh === ground; });
//     if (pickInfo.hit) {
//         var terrainHeight = pickInfo.pickedPoint.y;
//         var heightAboveTerrain = camera.position.y - terrainHeight;
//         var minBeta = Math.atan2(heightAboveTerrain, camera.radius);
//         camera.lowerBetaLimit = minBeta;
//     }
// }
// updateCameraBetaLimit();

function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// used in builder to make camera not intercept left click only
function freeLeftClick(scene, camera) {
  // Modify pointer inputs
  camera.inputs.attached.pointers.buttons = [1, 2]; // 0 = left, 1 = middle, 2 = right
}

// Add this function after setupCamera but before other functions
export function toggleFirstPersonView(scene, target) {
  const camera = scene.activeCamera;
  camera.firstPerson = !camera.firstPerson;

  if (camera.firstPerson) {
    // First-person settings
    camera.lowerRadiusLimit = 0.01;
    camera.upperRadiusLimit = 0.01;
    camera.radius = 0.01;
    camera.heightOffset = 9; // Height of camera (eye level)
    camera.forwardOffset = 300; // How far in front of the character
    // camera.rotationOffset = 180;
    camera.checkCollisions = false;

    // Disable preferred zoom behavior in first person
    camera.shouldPrefferedZoom = false;

    camera.upperBetaLimit = 1.3437;
    camera.lowerBetaLimit = 1.3437;
    camera.beta = 1.3437;
  } else {
    // Return to third-person settings
    camera.lowerRadiusLimit = 8;
    camera.upperRadiusLimit = 656.8044;
    camera.radius = camera.defaultRadius;
    camera.heightOffset = 0;
    camera.forwardOffset = 0;
    camera.rotationOffset = 0;
    camera.checkCollisions = true;

    // disable for zoomed out stationary follow camera
    // camera.target = target.position; //added 2-28, might remove for speed

    // Re-enable preferred zoom for third person
    camera.shouldPrefferedZoom = true;
  }
}
