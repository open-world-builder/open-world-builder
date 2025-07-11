import React, { useEffect } from "react";
import { DbConnection, User, EventContext } from "../module_bindings";

// import * as BABYLON from '@babylonjs/core';
// import { Identity } from "@clockworklabs/spacetimedb-sdk";
import "../../public/src/utils/npc/RemotePlayer.js";

interface MultiplayerProps {
  conn: DbConnection | null;
  identity: string | null;
}

export const Multiplayer: React.FC<MultiplayerProps> = ({ conn, identity }) => {
  useEffect(() => {
    if (!conn || !identity) return;

    // Initialize multiplayer system
    if (!window.MULTIPLAYER) {
      window.MULTIPLAYER = {
        players: new Map(),
        localPlayer: null,
        addPlayer: (identity: string, isLocal = false, position: any) => {
          // console.log("addPlayer: " + identity);
          if (!window.MULTIPLAYER.players.has(identity)) {
            const player = {
              identity: identity,
              isLocal: isLocal,
              visual: null,
            };
            // console.log(`Adding new player: ${identity}, isLocal: ${isLocal}`);
            // Create visual representation for non-local players
            if (!isLocal) {
              console.log(`Setting up other player: ${identity}`);
              console.log("addPlayer position", position);
              const playerVisual = new window.RemotePlayer(position);
              player.visual = playerVisual;
            }

            if (isLocal) {
              window.MULTIPLAYER.localPlayer = player;
            }

            window.MULTIPLAYER.players.set(identity, player);
          }
        },
        removePlayer: (identity: string) => {
          const player = window.MULTIPLAYER.players.get(identity);
          if (player && !player.isLocal) {
            if (player.visual) {
              player.visual.dispose();
            }
          }
          window.MULTIPLAYER.players.delete(identity);
        },
        updatePlayerPosition: (identity: string, newPosition: any) => {
          const player = window.MULTIPLAYER.players.get(identity);
          if (player && player.visual) {
            const newBabylonPosition = new window.BABYLON.Vector3(
              newPosition.x,
              newPosition.y,
              newPosition.z
            );
            player.visual.setTargetPosition(newBabylonPosition);
          }
        },
        sendPlayerPosition: (position: any) => {
          conn.reducers.updatePosition(
            position.x, // x coordinate
            position.y, // y coordinate
            position.z // z coordinate
          );
        },
        updatePlayerRotation: (identity: string, newRotation: any) => {
          const player = window.MULTIPLAYER.players.get(identity);
          if (player && player.visual) {
            player.visual.setTargetRotation(newRotation);
          }
        },
        sendPlayerRotation: (newRotation: any) => {
          conn.reducers.updateRotation(
            newRotation // x coordinate
          );
        },
        onAddObject: (
          positionX: number,
          positionY: number,
          positionZ: number,
          assetId: bigint,
          rotationQuaternionX: number,
          scaleX: number
        ) => {
          // Create a box mesh for the object

          const scene = window.SCENE_MANAGER.activeScene;
          if (scene) {
            // Create a box with the position from the object data
            let templateKey = assetId;
            let objectPosition = new window.BABYLON.Vector3(
              positionX,
              positionY,
              positionZ
            );
            window.TERRAIN_EDITOR.addObjectAtLocation(
              templateKey,
              objectPosition,
              rotationQuaternionX,
              scaleX,
              true,
              assetId
            );
            // // Add physics if needed
            // if (scene.getPhysicsEngine()) {
            //   new window.BABYLON.PhysicsImpostor(
            //     box,
            //     window.BABYLON.PhysicsImpostor.BoxImpostor,
            //     { mass: 1, restitution: 0.7 },
            //     scene
            //   );
            // }
          }
        },
        sendAddObject: (assetId: bigint, instance: any) => {
          let worldId = "1";
          let channelId = "1";
          let assetId2 = BigInt(instance.assetId);
          let position_x = instance.position.x;
          let position_y = instance.position.y;
          let position_z = instance.position.z;
          console.log("draggedRotation", instance.draggedRotation);
          let rotation_quaternion_x = instance.draggedRotation;
          let scaleX = instance.scaling.x;
          let anim_state = "none";
          console.log("rotationQuaternionX", rotation_quaternion_x);
          console.log("scaleX", scaleX);
          console.log("anim_state", anim_state);

          // Generate a unique object ID using a combination of timestamp and random values
          // const timestamp = Date.now().toString(36); // Convert timestamp to base36
          const randomPart = Math.floor(Math.random() * 1000000).toString(); // Random number
          const objectId = BigInt(randomPart);

          conn.reducers.addObject(
            objectId,
            worldId,
            channelId,
            assetId2,
            position_x,
            position_y,
            position_z,
            rotation_quaternion_x,
            scaleX,
            anim_state
          );
          // console.log("objectId", objectId);
          // add object id to local stream exclusion map
          window.streamExclusionMap.set(objectId.toString(), true);
          console.log("sendAddObject", assetId, instance);
        },
        onDeleteObject: (objectId: any) => {
          // let worldId = "1";
          // let channelId = "1";
          // conn.reducers.deleteObject(
          //   objectId
          // );
          window.MULTIPLAYER.deleteObject(objectId);
        },
        // sendDeleteObject: (objectId: any) => {
        // object
        // let worldId = "1";
        // let channelId = "1";
        // conn.reducers.deleteObject(
        //   objectId
        // );
        // },
      };
    }
    window.streamExclusionMap = new Map<string, boolean>();

    // Set up event handlers for player management
    const onUserJoin = (_ctx: EventContext, user: User) => {
      const userId = user.identity.toHexString();
      const isLocal = userId === identity;
      const position = new window.BABYLON.Vector3(
        user.positionX,
        user.positionY,
        user.positionZ
      );
      if (user.online) {
        window.MULTIPLAYER.addPlayer(userId, isLocal, position);
      }
      // window.MULTIPLAYER.updatePlayerPosition(
      //   userId,
      //   user.positionX,
      //   user.positionY,
      //   user.positionZ
      // );
    };

    const onUserUpdate = (_ctx: EventContext, user: User) => {
      // console.log("received user update: " + user.identity.toHexString());
      const userId = user.identity.toHexString();
      const position = new window.BABYLON.Vector3(
        user.positionX,
        user.positionY,
        user.positionZ
      );
      window.MULTIPLAYER.updatePlayerPosition(userId, position);
      window.MULTIPLAYER.updatePlayerRotation(userId, user.rotationX);
    };

    const onUserLeave = (_ctx: EventContext, user: User) => {
      window.MULTIPLAYER.removePlayer(user.identity.toHexString());
    };

    // const onObjectInsert = (_ctx: EventContext, obj: any) => {
    //   console.log(
    //     "Object added: id=" + obj.objectId + " assetId=" + obj.assetId
    //   );
    //   window.MULTIPLAYER.onAddObject(
    //     obj.positionX,
    //     obj.positionY,
    //     obj.positionZ,
    //     obj.assetId
    //   );
    // };

    // const onObjectDelete = (_ctx: EventContext, obj: any) => {
    //   console.log("Object removed: id=" + obj.objectId);
    //   window.MULTIPLAYER.onDeleteObject(obj);
    // };

    // Subscribe to user events
    if (window.CHANNEL_ID !== "0") {
      conn.db.user.onInsert(onUserJoin);
      conn.db.user.onUpdate(onUserUpdate);
      conn.db.user.onDelete(onUserLeave);
    }

    // conn.db.object.onInsert(onObjectInsert);
    // conn.db.object.onDelete(onObjectDelete);
    // Use for multiple worlds/channels
    // conn
    //   .subscriptionBuilder()
    //   .onApplied((ctx) => {
    //     console.log("onAddObject");
    //     // const objs = ctx.db.object.iter();
    //     // for (const obj of objs) {
    //     // window.MULTIPLAYER.onAddObject(obj);
    //     // }
    //   })
    //   .subscribe(["SELECT * FROM object"]);

    // Cleanup
    return () => {
      conn.db.user.removeOnInsert(onUserJoin);
      conn.db.user.removeOnUpdate(onUserUpdate);
      conn.db.user.removeOnDelete(onUserLeave);
    };
  }, [conn, identity]);

  // This component doesn't render anything visible
  return null;
};
