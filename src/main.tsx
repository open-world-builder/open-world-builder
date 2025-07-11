import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

declare global {
  interface Window {
    MULTIPLAYER: any;
    BABYLON: any;
    SCENE_MANAGER: any;
    RemotePlayer: any;
    TERRAIN_EDITOR: any;
    dummyAggregate: any;
    DUMMY_AGGREGATE: any;
    WORLD_ID: string;
    CHANNEL_ID: string;
    STREAMER: any;
    ASSET_MANAGER: any;
    streamExclusionMap: Map<string, boolean>;
    lil: any;
    AUTOBLEND_NOISE_STRENGTH: any;
  }
}
