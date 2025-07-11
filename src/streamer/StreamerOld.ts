// export class Streamer {
//   private lastPosition: { x: number; y: number; z: number } | null = null;
//   private loadedObjects: Set<string> = new Set();
//   private intervalId: number | null = null,
//   private currentPosition: { x: number; y: number; z: number } | null = null

//   constructor(

//   ) {}

//   // Call this method whenever the user's position updates
//   public update(position: { x: number; y: number; z: number }) {
//     if (
//       !this.lastPosition ||
//       this.getDistance(this.lastPosition, position) > 100
//     ) {
//       this.lastPosition = position;
//       this.streamAssets(position);
//     }
//   }

//   // Call this method to start the 15-second interval updates
//   public start() {
//     if (this.intervalId) return; // Prevent multiple intervals
//     this.intervalId = setInterval(() => {
//       if (this.currentPosition) {
//         this.update(this.currentPosition);
//       }
//     }, 15000);
//   }

//   // Call this method to stop the interval
//   public stop() {
//     if (this.intervalId) {
//       clearInterval(this.intervalId);
//       this.intervalId = null;
//     }
//   }

//   // Calculate Euclidean distance
//   private getDistance(
//     a: { x: number; y: number; z: number },
//     b: { x: number; y: number; z: number }
//   ) {
//     return Math.sqrt(
//       Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2) + Math.pow(a.z - b.z, 2)
//     );
//   }

//   // Main streaming logic
//   private streamAssets(position: { x: number; y: number; z: number }) {
//     const objectsInRange = this.getObjectsInRange(position);
//     const newObjectIds = new Set(objectsInRange.map((obj) => obj.id));

//     // Load new assets
//     for (const obj of objectsInRange) {
//       if (!this.loadedObjects.has(obj.id)) {
//         this.assetManager.load(obj.id);
//         this.loadedObjects.add(obj.id);
//       }
//     }

//     // Unload assets that are no longer in range
//     for (const objId of Array.from(this.loadedObjects)) {
//       if (!newObjectIds.has(objId)) {
//         this.assetManager.unload(objId);
//         this.loadedObjects.delete(objId);
//       }
//     }
//   }
// }
