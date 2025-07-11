export function createMobileControls(scene, camera, player) {
  function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  ON_MOBILE = isMobile();
  if (!ON_MOBILE) {
    return;
  }

  // Create joysticks
  const movementJoystick = new BABYLON.VirtualJoystick(true);
  const cameraJoystick = new BABYLON.VirtualJoystick(false);
  movementJoystick.setJoystickColor("#00000072");
  cameraJoystick.setJoystickColor("#00000072");

  CANVASES = document.querySelectorAll("canvas");

  CANVASES[1].style.zIndex = -1;
  // Hide joysticks initially
  // movementJoystick.setVisible(false);
  // cameraJoystick.setVisible(false);

  CANVASES[1].addEventListener("click", function (event) {
    const rect = CANVASES[1].getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    let cornerSize = 500;

    // Check if the click is in the bottom left corner
    console.log(event.clientY);
    console.log(rect.bottom);

    if (event.clientY >= rect.bottom * 0.6) {
      console.log("click second canvas bottom");
    } else {
      console.log("clicked second canvas top, passing through");

      CANVASES[1].style.zIndex = -1;
      inputMap["w"] = false;
      inputMap["s"] = false;
      inputMap["a"] = false;
      inputMap["d"] = false;

      // Dispatch a click event on the first canvas at the same position
      const clickEvent = new MouseEvent("click", {
        clientX: CANVASES[0].getBoundingClientRect().left + x,
        clientY: CANVASES[0].getBoundingClientRect().top + y,
        bubbles: true,
        cancelable: true,
        view: window,
      });

      CANVASES[0].dispatchEvent(clickEvent);
    }
  });

  // Touch event listeners
  scene.onPointerObservable.add(function (pointerInfo) {
    const { width, height } = scene.getEngine().getRenderingCanvas();
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      // console.log(pointerInfo.event.clientY >= height * 0.7);
      if (pointerInfo.event.clientY >= height * 0.7) {
        // CANVASES[1].style.zIndex = 2;
      }
      // var pickResult = pointerInfo.pickInfo;
      // if (pickResult.hit) {
      //     console.log("Additional onPointerDown function: Picked mesh - " + pickResult.pickedMesh.name);
      // }
    }
    // if (evt.y <= height * 0.7) {
    //     // Top 70% of the screen - normal click interaction
    //     // const pickResult = scene.pick(evt.x, evt.y, pointerPredicate);
    //     // if (pickResult.hit) {
    //     //     handleObjectInteraction(pickResult.pickedMesh);
    //     // }
    // } else {
    //     // Bottom 30% of the screen - joystick controls
    //     if (evt.x < width * 0.3) {
    //         movementJoystick.setVisible(true);
    //     } else if (evt.x > width * 0.7) {
    //         cameraJoystick.setVisible(true);
    //     }
    // }
  });

  // scene.onPointerUp = () => {
  //     movementJoystick.setVisible(false);
  //     cameraJoystick.setVisible(false);

  // };

  // Update loop
  scene.onBeforeRenderObservable.add(() => {
    if (movementJoystick.pressed) {
      // const moveX = movementJoystick.deltaPosition.x * 0.1;
      // const moveZ = movementJoystick.deltaPosition.y * 0.1;
      // player.position.addInPlace(new BABYLON.Vector3(moveX, 0, moveZ));
      if (movementJoystick.deltaPosition.y > 0.5) {
        inputMap["w"] = true;
        inputMap["s"] = false;
        inputMap["a"] = false;
        inputMap["d"] = false;
      }
      if (movementJoystick.deltaPosition.y < -0.5) {
        inputMap["w"] = false;
        inputMap["s"] = true;
        inputMap["a"] = false;
        inputMap["d"] = false;
      }
      if (movementJoystick.deltaPosition.x > 0.75) {
        inputMap["d"] = true;
        inputMap["a"] = false;
        inputMap["w"] = false;
        inputMap["s"] = false;
      }
      if (movementJoystick.deltaPosition.x < -0.75) {
        inputMap["a"] = true;
        inputMap["d"] = false;
        inputMap["w"] = false;
        inputMap["s"] = false;
      }

      // if (movementJoystick.deltaPosition.y < -0.75 && movementJoystick.deltaPosition.x < -0.75) { inputMap["a"] = true; inputMap["d"] = false; inputMap["w"] = false; inputMap["s"] = true; }
    } else {
      if (CANVASES[1].style.zIndex !== "-1") {
        //Still allow keyboard interaction
        inputMap["w"] = false;
        inputMap["s"] = false;
        inputMap["a"] = false;
        inputMap["d"] = false;
      }
    }

    if (cameraJoystick.pressed) {
      const rotateX = cameraJoystick.deltaPosition.x * 0.02;
      const rotateY = cameraJoystick.deltaPosition.y * 0.041;
      camera.alpha += rotateX;
      if (camera.beta - rotateY >= (Math.PI / 2) * 0.01) {
        camera.beta -= rotateY;
      }
    }
  });
}

export function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function createMobileControlsJoystickOnly(scene, camera, player) {
  ON_MOBILE = isMobile();
  window.ON_MOBILE = ON_MOBILE;
  if (!ON_MOBILE) {
    return;
  }

  //   scene.imageProcessingConfiguration.vignetteEnabled = true;
  scene.imageProcessingConfiguration.vignetteWeight = 1.6;
  // Create joysticks
  const movementJoystick = new BABYLON.VirtualJoystick(true);
  //   const cameraJoystick = new BABYLON.VirtualJoystick(false);
  movementJoystick.setJoystickColor("#00000072");
  //   cameraJoystick.setJoystickColor("#00000072");

  const jsCanvas = BABYLON.VirtualJoystick.Canvas;
  if (jsCanvas) {
    jsCanvas.id = "myJoystickCanvas";
  }

  CANVASES = document.querySelectorAll("canvas");

  console.log(CANVASES);
  // CANVASES[1].style.zIndex = -1;
  // Hide joysticks initially
  // movementJoystick.setVisible(false);
  // cameraJoystick.setVisible(false);

  // Touch event listeners
  scene.onPointerObservable.add(function (pointerInfo) {
    const { width, height } = scene.getEngine().getRenderingCanvas();
    if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
      // console.log(pointerInfo.event.clientY >= height * 0.7);
      if (pointerInfo.event.clientY >= height * 0.7) {
        // CANVASES[1].style.zIndex = 2;
      }
      // var pickResult = pointerInfo.pickInfo;
      // if (pickResult.hit) {
      //     console.log("Additional onPointerDown function: Picked mesh - " + pickResult.pickedMesh.name);
      // }
    }
    // if (evt.y <= height * 0.7) {
    //     // Top 70% of the screen - normal click interaction
    //     // const pickResult = scene.pick(evt.x, evt.y, pointerPredicate);
    //     // if (pickResult.hit) {
    //     //     handleObjectInteraction(pickResult.pickedMesh);
    //     // }
    // } else {
    //     // Bottom 30% of the screen - joystick controls
    //     if (evt.x < width * 0.3) {
    //         movementJoystick.setVisible(true);
    //     } else if (evt.x > width * 0.7) {
    //         cameraJoystick.setVisible(true);
    //     }
    // }
  });

  // scene.onPointerUp = () => {
  //     movementJoystick.setVisible(false);
  //     cameraJoystick.setVisible(false);

  // };
  MOVEMENT_OVERIDE_MOBILE = true;
  // Update loop
  scene.onBeforeRenderObservable.add(() => {
    if (movementJoystick.pressed) {
      // const moveX = movementJoystick.deltaPosition.x * 0.1;
      // const moveZ = movementJoystick.deltaPosition.y * 0.1;
      // player.position.addInPlace(new BABYLON.Vector3(moveX, 0, moveZ));

      if (MOVEMENT_OVERIDE_MOBILE) {
        if (Math.abs(movementJoystick.deltaPosition.x) > 0.1 || Math.abs(movementJoystick.deltaPosition.y) > 0.0) {
          MOVEMENT_OVERIDE_MOBILE_DIRECTION_X = movementJoystick.deltaPosition.x;
          MOVEMENT_OVERIDE_MOBILE_DIRECTION_Y = movementJoystick.deltaPosition.y;
        }
      } else {
        if (movementJoystick.deltaPosition.y > 0.5) {
          inputMap["w"] = true;
          inputMap["s"] = false;
          inputMap["a"] = false;
          inputMap["d"] = false;
        }
        if (movementJoystick.deltaPosition.y < -0.5) {
          inputMap["w"] = false;
          inputMap["s"] = true;
          inputMap["a"] = false;
          inputMap["d"] = false;
        }
        if (movementJoystick.deltaPosition.x > 0.75) {
          inputMap["d"] = true;
          inputMap["a"] = false;
          inputMap["w"] = false;
          inputMap["s"] = false;
        }
        if (movementJoystick.deltaPosition.x < -0.75) {
          inputMap["a"] = true;
          inputMap["d"] = false;
          inputMap["w"] = false;
          inputMap["s"] = false;
        }

        // if (movementJoystick.deltaPosition.y < -0.75 && movementJoystick.deltaPosition.x < -0.75) { inputMap["a"] = true; inputMap["d"] = false; inputMap["w"] = false; inputMap["s"] = true; }
        if (movementJoystick.deltaPosition.y < 0.5 && movementJoystick.deltaPosition.y > -0.5 && movementJoystick.deltaPosition.x < 0.75 && movementJoystick.deltaPosition.x > -0.75) {
          inputMap["w"] = false;
          inputMap["s"] = false;
          inputMap["a"] = false;
          inputMap["d"] = false;
        }
      }
    } else {
      if (CANVASES[1].style.zIndex !== "-1") {
        //Still allow keyboard interaction
        inputMap["w"] = false;
        inputMap["s"] = false;
        inputMap["a"] = false;
        inputMap["d"] = false;
      }

      if (MOVEMENT_OVERIDE_MOBILE) {
        MOVEMENT_OVERIDE_MOBILE_DIRECTION_X = 0;
        MOVEMENT_OVERIDE_MOBILE_DIRECTION_Y = 0;
      }
    }

    // if (cameraJoystick.pressed) {
    //   let rotateX = cameraJoystick.deltaPosition.x * 0.02;
    //   let rotateY = cameraJoystick.deltaPosition.y * 0.037;
    //   // console.log(cameraJoystick.deltaPosition.x);
    //   if (cameraJoystick.deltaPosition.x > 0.2 || cameraJoystick.deltaPosition.x < -0.2) camera.alpha += rotateX;

    //   if (camera.beta - rotateY >= (Math.PI / 2) * 0.01) {
    //     if (cameraJoystick.deltaPosition.y > 0.2 || cameraJoystick.deltaPosition.y < -0.2) {
    //       camera.beta -= rotateY;
    //     }
    //   }
    // } else {
    //   cameraJoystick.deltaPosition.x = 0;
    //   cameraJoystick.deltaPosition.y = 0;
    // }
  });
}
