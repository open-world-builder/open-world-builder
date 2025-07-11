export async function setupPhysics(scene, spawnPoint) {
  const normalGravity = new BABYLON.Vector3(0, -100.81, 0);
  const heavyGravity = new BABYLON.Vector3(0, -200, 0);

  // scene.enablePhysics(normalGravity, new BABYLON.CannonJSPlugin());
  // scene.physicsEnabled = false;
  const havokInstance = await HavokPhysics();
  const havokPlugin = new BABYLON.HavokPlugin(true, havokInstance);
  scene.enablePhysics(new BABYLON.Vector3(0, -9.8, 0), havokPlugin);
  scene.physicsEnabled = false;

  let dummyPhysicsRoot = BABYLON.MeshBuilder.CreateCapsule("dummyPhysicsRoot", { radius: 10, height: 22, width: 100 }, scene);
  // let dummyPhysicsRoot = BABYLON.MeshBuilder.CreateCapsule("dummyPhysicsRoot", { radius: 10, height: 22, width: 100 }, scene);
  // var dummyPhysicsRoot = new BABYLON.MeshBuilder.create("dummyPhysicsRoot", {size: 1, height: 2, width: 1}, scene);
  // dummyPhysicsRoot.addChild(newMeshes[0]);
  // DummyPhysicsRoot Visibility Change to 0 to Hide
  // let dummyPhysicsRoot = BABYLON.MeshBuilder.CreateCapsule("dummyPhysicsRoot", { radius: 5, height: 22, width: 100 }, scene);
  // dummyPhysicsRoot.visibility = 0.8;
  dummyPhysicsRoot.visibility = 0.0;
  dummyPhysicsRoot.position.y = 100;

  var dummyAggregate = new BABYLON.PhysicsAggregate(dummyPhysicsRoot, BABYLON.PhysicsShapeType.CAPSULE, { mass: 500, restitution: 0.0, friction: 1.0, stepOffset: 1.5 }, scene);
  dummyAggregate.body.setMotionType(BABYLON.PhysicsMotionType.DYNAMIC);
  // movePlayer(dummyAggregate);
  dummyAggregate.body.setCollisionCallbackEnabled(true);
  dummyAggregate.body.setMassProperties({
    inertia: new BABYLON.Vector3(0, 0, 0),
  });
  dummyAggregate.body.setGravityFactor(20);
  // dummyAggregate.body.setLinearDamping(0.9);

  havokInstance.HP_Body_SetPosition(dummyAggregate.body._pluginData.hpBodyId, [spawnPoint.x, spawnPoint.y, spawnPoint.z]);
  dummyAggregate.resetToSpawn = function () {
    havokInstance.HP_Body_SetPosition(dummyAggregate.body._pluginData.hpBodyId, [spawnPoint.x, spawnPoint.y, spawnPoint.z]);
  };

  dummyAggregate.jumpToY = function (y) {
    havokInstance.HP_Body_SetPosition(dummyAggregate.body._pluginData.hpBodyId, [dummyAggregate.body.transformNode._absolutePosition.x, y, dummyAggregate.body.transformNode._absolutePosition.z]);
  };

  dummyAggregate.jumpToSpawn = function () {
    havokInstance.HP_Body_SetPosition(dummyAggregate.body._pluginData.hpBodyId, [0, 0, 0]);
  };

  dummyAggregate.jumpToPosition = function (x, y, z) {
    havokInstance.HP_Body_SetPosition(dummyAggregate.body._pluginData.hpBodyId, [x, y, z]);
  };

  dummyAggregate.current = function (currentStrength) {
    //
    const moveDirection = new BABYLON.Vector3(dummyAggregate.body.getLinearVelocity().x, dummyAggregate.body.getLinearVelocity().y - 25, dummyAggregate.body.getLinearVelocity().z + currentStrength);
    dummyAggregate.body.setLinearVelocity(moveDirection);
    // havokInstance.HP_Body_SetPosition(dummyAggregate.body._pluginData.hpBodyId, [dummyAggregate.body.transformNode._absolutePosition.x, dummyAggregate.body.transformNode._absolutePosition.y, dummyAggregate.body.transformNode._absolutePosition.z + currentStrength]);
  };

  dummyAggregate.waterMovement = function () {
    //
    // const moveDirection = new BABYLON.Vector3(dummyAggregate.body.getLinearVelocity().x, dummyAggregate.body.getLinearVelocity().y - 25, dummyAggregate.body.getLinearVelocity().z + currentStrength);
    // dummyAggregate.body.setLinearVelocity(moveDirection);
    dummyAggregate.body.setGravityFactor(1);
    // havokInstance.HP_Body_SetPosition(dummyAggregate.body._pluginData.hpBodyId, [dummyAggregate.body.transformNode._absolutePosition.x, dummyAggregate.body.transformNode._absolutePosition.y, dummyAggregate.body.transformNode._absolutePosition.z + currentStrength]);
  };

  dummyAggregate.normalMovement = function () {
    //
    dummyAggregate.body.setGravityFactor(20);
  };

  // dummyAggregate.body.setAxisFriction(BABYLON.HavokPlugin.LockConstraint, BABYLON.HavokPlugin.LINEAR_Y, 0);
  // camera.position.copyFrom(dummyPhysicsRoot.position)
  // dummyPhysicsRoot.setDirection(camera.getForwardRay().direction)

  // const observable = dummyAggregate.body.getCollisionObservable();
  // const observer = observable.add((collisionEvent) => {
  //     if(lflag){
  //          console.log(collisionEvent)
  //         lflag = false;
  //     }
  // });

  IS_SLIDING = false;
  let slideCooldown = false;
  const SLIDE_DURATION = 800; // milliseconds
  const SLIDE_COOLDOWN = 1500; // milliseconds
  const SLIDE_SPEED_MULTIPLIER = 2.5;
  const SLIDE_SPEED = 10;
  const ORIGINAL_HEIGHT = 22; // original capsule height
  const SLIDE_HEIGHT = 12; // reduced height during slide

  dummyAggregate.startSlide = function () {
    if (IS_SLIDING || slideCooldown) return;

    IS_SLIDING = true;

    // Reduce height during slide
    dummyPhysicsRoot.scaling.y = SLIDE_HEIGHT / ORIGINAL_HEIGHT;

    // Get the forward direction based on mesh rotation
    const forward = dummyPhysicsRoot.forward;

    // Apply slide velocity
    const moveDirection = new BABYLON.Vector3(forward.x * SLIDE_SPEED, dummyAggregate.body.getLinearVelocity().y, forward.z * SLIDE_SPEED);

    dummyAggregate.body.setLinearVelocity(moveDirection);

    // Temporarily reduce linear damping for a smoother slide
    dummyAggregate.body.setLinearDamping(0.1);
    // dummyAggregate.body.setGravityFactor(1);
    // dummyAggregate.body.setParam("friction", 0.1);
    // End slide after duration
    setTimeout(() => {
      dummyAggregate.body.setGravityFactor(20);
      IS_SLIDING = false;
      dummyPhysicsRoot.scaling.y = 1;
      dummyAggregate.body.setLinearDamping(0.9); // Reset to original damping

      // Start cooldown
      slideCooldown = true;
      setTimeout(() => {
        slideCooldown = false;
      }, SLIDE_COOLDOWN);
    }, SLIDE_DURATION);
  };

  const SLIDE_ANGLE_THRESHOLD = 45;
  const SLIDE_FORCE_MAGNITUDE = 10000;

  // // setTimeout(() => {
  //   scene.onBeforePhysicsObservable.add(() => {
  //     // Raycast down
  //     const origin = dummyPhysicsRoot.position.add(new BABYLON.Vector3(0, 1, 0));
  //     const pick = scene.pickWithRay(new BABYLON.Ray(origin, BABYLON.Vector3.Down(), 2), (m) => m === window.TERRAIN_EDITOR.mesh);
  //     if (!pick.hit) {
  //       return;
  //     }

  //     const normal = pick.getNormal(true);
  //     const cosA = BABYLON.Vector3.Dot(normal, BABYLON.Vector3.Up());
  //     const slopeDeg = Math.acos(cosA) * (180 / Math.PI);

  //     if (slopeDeg > SLIDE_ANGLE_THRESHOLD) {
  //       // compute downhill dir
  //       const downhill = BABYLON.Vector3.Cross(normal, BABYLON.Vector3.Cross(BABYLON.Vector3.Up(), normal)).normalize();

  //       // apply force
  //       // if (IS_SLIDING) {
  //       havokInstance.HP_Body_ApplyForce(dummyAggregate.body._pluginData.hpBodyId, [downhill.x * SLIDE_FORCE_MAGNITUDE, downhill.y * SLIDE_FORCE_MAGNITUDE, downhill.z * SLIDE_FORCE_MAGNITUDE]);
  //       // optional: tweak friction/gravity
  //       // dummyAggregate.body.setParam("friction", 0.3);
  //       // dummyAggregate.body.setGravityFactor(1.2);
  //       // }
  //     } else {
  //       // reset when not sliding
  //       // dummyAggregate.body.setParam("friction", 1.0);
  //       // dummyAggregate.body.setGravityFactor(1.0);
  //     }
  //   });
  // // }, 20000);

  return {
    character: dummyPhysicsRoot,
    dummyAggregate: dummyAggregate,
  };

  // return {dummyPhysicsRoot, dummyAggregate};

  // character.physicsImpostor.registerOnPhysicsCollide(ground.physicsImpostor, function(main, collided) {
  //     characterCanJump = true; // Enable jumping again when touching the ground
  // });
}
