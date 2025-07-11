// src/utils/InteriorEditor.js

export class InteriorEditor {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = { x: 10, y: 10, z: 10 }; // Grid dimensions
    this.cellSize = 100; // Size of each grid cell
    this.grid = this.initializeGrid();
    this.initializeFirstRoom();
  }

  initializeFirstRoom() {
    this.setEmpty(0, 1, 1);
    this.setEmpty(0, 2, 1);
    this.setEmpty(0, 1, 2);
    this.setEmpty(0, 2, 2);
    this.setEmpty(1, 1, 1);
    this.setEmpty(1, 2, 1);
    this.setEmpty(1, 1, 2);
    this.setEmpty(1, 2, 2);
  }

  initializeGrid() {
    // Create a 3D array filled with 1 (solid)
    const grid = Array(this.gridSize.x)
      .fill()
      .map(() =>
        Array(this.gridSize.y)
          .fill()
          .map(() => Array(this.gridSize.z).fill(1))
      );
    return grid;
  }

  // Mark a cell as empty (0)
  setEmpty(x, y, z) {
    if (this.isValidPosition(x, y, z)) {
      this.grid[x][y][z] = 0;
      this.updateGeometry();
    }
  }

  isValidPosition(x, y, z) {
    return x >= 0 && x < this.gridSize.x && y >= 0 && y < this.gridSize.y && z >= 0 && z < this.gridSize.z;
  }

  // ... existing code ...

  updateGeometry() {
    if (this.mesh) {
      this.mesh.dispose();
    }

    const positions = [];
    const indices = [];
    let vertexIndex = 0;

    // Helper function to check if a position is solid or out of bounds
    const isSolid = (x, y, z) => {
      if (!this.isValidPosition(x, y, z)) return true;
      return this.grid[x][y][z] === 1;
    };

    // Check each cell
    for (let x = 0; x < this.gridSize.x; x++) {
      for (let y = 0; y < this.gridSize.y; y++) {
        for (let z = 0; z < this.gridSize.z; z++) {
          if (this.grid[x][y][z] === 0) {
            const x1 = x * this.cellSize;
            const x2 = (x + 1) * this.cellSize;
            const y1 = y * this.cellSize;
            const y2 = (y + 1) * this.cellSize;
            const z1 = z * this.cellSize;
            const z2 = (z + 1) * this.cellSize;

            // Only create faces where they touch solid blocks

            // Front face (positive Z)
            if (isSolid(x, y, z + 1)) {
              positions.push(x1, y1, z2, x2, y1, z2, x2, y2, z2, x1, y2, z2);
              indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
              vertexIndex += 4;
            }

            // Back face (negative Z)
            if (isSolid(x, y, z - 1)) {
              positions.push(x1, y1, z1, x1, y2, z1, x2, y2, z1, x2, y1, z1);
              indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
              vertexIndex += 4;
            }

            // Top face (positive Y)
            if (isSolid(x, y + 1, z)) {
              positions.push(x1, y2, z1, x1, y2, z2, x2, y2, z2, x2, y2, z1);
              indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
              vertexIndex += 4;
            }

            // Bottom face (negative Y)
            if (isSolid(x, y - 1, z)) {
              positions.push(x1, y1, z1, x2, y1, z1, x2, y1, z2, x1, y1, z2);
              indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
              vertexIndex += 4;
            }

            // Right face (positive X)
            if (isSolid(x + 1, y, z)) {
              positions.push(x2, y1, z1, x2, y2, z1, x2, y2, z2, x2, y1, z2);
              indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
              vertexIndex += 4;
            }

            // Left face (negative X)
            if (isSolid(x - 1, y, z)) {
              positions.push(x1, y1, z1, x1, y1, z2, x1, y2, z2, x1, y2, z1);
              indices.push(vertexIndex, vertexIndex + 1, vertexIndex + 2, vertexIndex, vertexIndex + 2, vertexIndex + 3);
              vertexIndex += 4;
            }
          }
        }
      }
    }

    const vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;

    const mesh = new BABYLON.Mesh("gridMesh", this.scene);
    vertexData.applyToMesh(mesh);
    // mesh.isPickable = false;

    this.mesh = mesh;
  }

  // ... existing code ...
}
