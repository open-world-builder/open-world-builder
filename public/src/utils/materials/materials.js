// in charge of loading materials, and serving them from map "materialName"

// move terrain materials creation here. should be used in babylon preview window on the site, assetlibrary page

let MATERIALS = {};

export function getMaterial(materialName) {
  return MATERIALS[materialName];
}
