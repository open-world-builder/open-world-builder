import Tool from "../Tool.js";

export default class TextureTool extends Tool {
    constructor(name, scene, meshes, grid, tools, icon) {
        super(name, scene, meshes, grid, tools, icon, []);
        this.scene = scene;
        this.availableTextures = {
            'Terrain': {
                floor: [
                    'assets/textures/terrain/floor.png',
                    'assets/textures/terrain/tileDark.png',
                ],
                rock: [
                    'assets/textures/terrain/rock.png',
                    'assets/textures/terrain/grassRock.png',
                ],
                grass: [
                    'assets/textures/terrain/grass.png',
                    'assets/textures/terrain/grassRock.png',
                ],
                mix: [
                    'assets/textures/terrain/mixMap.png',
                ]
            },
            'Path': {
                path: [
                    'assets/textures/terrain/floor.png',
                    'assets/textures/terrain/tileDark.png',
                ],
                rock: [
                    'assets/textures/terrain/rock.png',
                ],
                transition: [
                    'assets/textures/terrain/terrainMask.png',
                ]
            }
        };
        // Create UI immediately
        this.setupUI();
    }

    // Override the parent class's click method
    click() {
        console.log("TextureTool clicked"); // Debug log
        this.activate();
    }

    activate() {
        const editor = document.getElementById('textureEditor');
        if (!editor) {
            this.setupUI();
        } else {
            editor.style.display = 'block';
        }
    }

    deactivate() {
        const editor = document.getElementById('textureEditor');
        if (editor) editor.style.display = 'none';
    }

    // Override parent class methods that might trigger grass updates
    drag() {
        // No-op
    }

    mouseUp() {
        // No-op
    }

    setupUI() {
        const container = document.createElement('div');
        container.id = 'textureEditor';
        container.style.cssText = `
            position: fixed;
            right: 20px;
            top: 60px;
            background: rgba(30, 30, 30, 0.95);
            padding: 20px;
            border-radius: 8px;
            display: block;
            max-height: 80vh;
            overflow-y: auto;
            color: white;
            font-family: Arial, sans-serif;
            z-index: 1000;
            width: 300px;
            box-shadow: 0 0 10px rgba(0,0,0,0.5);
        `;

        const materials = {
            'Terrain': {
                grass: this.scene.getMaterialByName("terrain")?.diffuseTexture3,
                rock: this.scene.getMaterialByName("terrain")?.diffuseTexture2,
            },
            'Path': {
                path: this.scene.getMaterialByName("terrain")?.diffuseTexture1,
                transition: this.scene.getMaterialByName("terrain")?.mixTexture
            }
        };

        Object.entries(materials).forEach(([category, textures]) => {
            const section = document.createElement('div');
            section.innerHTML = `<h3 style="margin: 10px 0; color: rgb(245, 202, 86);">${category}</h3>`;
            
            Object.entries(textures).forEach(([name, currentTexture]) => {
                const textureBox = document.createElement('div');
                textureBox.classList.add('texture-box');
                textureBox.style.cssText = `
                    margin: 15px 0;
                    padding: 10px;
                    border: 1px solid rgba(245, 202, 86, 0.3);
                    border-radius: 4px;
                    background: rgba(0, 0, 0, 0.4);
                `;

                // Scale control
                const scaleControl = document.createElement('div');
                scaleControl.style.cssText = `
                    margin: 10px 0;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                `;
                
                const scaleSlider = document.createElement('input');
                scaleSlider.type = 'range';
                scaleSlider.min = '1';
                scaleSlider.max = '50';
                scaleSlider.step = '0.1';
                scaleSlider.value = currentTexture?.uScale || 1;
                scaleSlider.style.cssText = `
                    flex-grow: 1;
                    background: rgba(0, 0, 0, 0.6);
                    accent-color: rgb(245, 202, 86);
                `;

                const scaleInput = document.createElement('input');
                scaleInput.type = 'number';
                scaleInput.min = '1';
                scaleInput.max = '50';
                scaleInput.step = '0.1';
                scaleInput.value = currentTexture?.uScale || 1;
                scaleInput.style.cssText = `
                    width: 60px;
                    background: rgba(0, 0, 0, 0.6);
                    border: 1px solid rgba(245, 202, 86, 0.3);
                    color: rgb(245, 202, 86);
                    padding: 5px;
                    border-radius: 4px;
                `;

                scaleControl.innerHTML = `<label style="margin-right: 10px">Scale: </label>`;
                scaleControl.appendChild(scaleSlider);
                scaleControl.appendChild(scaleInput);

                // Sync slider and input values
                scaleSlider.addEventListener('input', (e) => {
                    scaleInput.value = e.target.value;
                    this.handleScaleChange(e, category, name);
                });
                scaleInput.addEventListener('change', (e) => {
                    scaleSlider.value = e.target.value;
                    this.handleScaleChange(e, category, name);
                });

                // Available textures grid
                const textureGrid = document.createElement('div');
                textureGrid.style.cssText = `
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 5px;
                    margin-top: 10px;
                `;

                const currentTextureUrl = currentTexture?.url || this.availableTextures[category][name][0];

                this.availableTextures[category][name].forEach(texturePath => {
                    const textureOption = document.createElement('div');
                    textureOption.style.cssText = `
                        width: 100%;
                        height: 60px;
                        background-size: cover;
                        background-position: center;
                        border: 1px solid rgba(245, 202, 86, 0.3);
                        border-radius: 4px;
                        cursor: pointer;
                        transition: all 0.3s;
                        ${texturePath === currentTextureUrl ? 'border: 2px solid rgb(245, 202, 86); box-shadow: 0 0 8px rgb(245, 202, 86);' : ''}
                    `;
                    textureOption.style.backgroundImage = `url(${texturePath})`;
                    textureOption.addEventListener('click', () => {
                        // Remove highlight from all options
                        textureGrid.querySelectorAll('div').forEach(div => {
                            div.style.border = '1px solid rgba(245, 202, 86, 0.3)';
                            div.style.boxShadow = 'none';
                        });
                        // Add highlight to selected option
                        textureOption.style.border = '2px solid rgb(245, 202, 86)';
                        textureOption.style.boxShadow = '0 0 8px rgb(245, 202, 86)';
                        this.swapTexture(category, name, texturePath);
                    });
                    textureGrid.appendChild(textureOption);
                });

                textureBox.appendChild(scaleControl);
                textureBox.appendChild(textureGrid);
                section.appendChild(textureBox);
            });

            container.appendChild(section);
        });

        document.body.appendChild(container);
    }

    swapTexture(category, name, texturePath) {
        console.log(`Swapping texture - Category: ${category}, Name: ${name}, Path: ${texturePath}`);
        
        const terrainMaterial = this.scene.getMaterialByName("terrain");
        if (!terrainMaterial) {
            console.error('No terrain material found!');
            return;
        }

        // Create and configure the new texture
        const newTexture = new BABYLON.Texture(texturePath, this.scene);
        newTexture.hasAlpha = true;
        newTexture.wrapU = BABYLON.Texture.WRAP_ADDRESSMODE;
        newTexture.wrapV = BABYLON.Texture.WRAP_ADDRESSMODE;
        
        
        if (category === 'Terrain') {
            switch(name) {
                case 'floor':
                    terrainMaterial.setTexture("pathTexture", newTexture);
                    break;
                case 'rock':
                    terrainMaterial.setTexture("rockTexture", newTexture);
                    break;
                case 'grass':
                    terrainMaterial.setTexture("grassTexture", newTexture);
                    break;
                case 'mix':
                    terrainMaterial.setTexture("transitionTexture", newTexture);
                    break;
            }
        } else if (category === 'Path') {
            switch(name) {
                case 'path':
                    terrainMaterial.setTexture("pathTexture", newTexture);
                    break;
                case 'rock':
                    terrainMaterial.setTexture("rockTexture", newTexture);
                    break;
                case 'transition':
                    terrainMaterial.setTexture("transitionTexture", newTexture);
                    break;
            }
        }

        newTexture.onLoadObservable.addOnce(() => {
            console.log('Texture loaded successfully:', texturePath);
        });
    }

    handleTextureUpload(event, category, name, preview) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const newTexture = new BABYLON.Texture(e.target.result, this.scene);
            if (category === 'Terrain') {
                const terrainMaterial = this.scene.getMaterialByName("terrain");
                if (name === 'floor') terrainMaterial.diffuseTexture1 = newTexture;
                else if (name === 'rock') terrainMaterial.diffuseTexture2 = newTexture;
                else if (name === 'grass') terrainMaterial.diffuseTexture3 = newTexture;
                else if (name === 'mix') terrainMaterial.mixTexture = newTexture;
            } else {
                MESH_LIBRARY.terrain.terrainShader.setTexture(
                    name === 'path' ? 'pathTexture' : 
                    name === 'rock' ? 'rockTexture' : 'transitionTexture',
                    newTexture
                );
            }
            preview.style.backgroundImage = `url(${e.target.result})`;
        };
        reader.readAsDataURL(file);
    }

    handleScaleChange(event, category, name) {
        const scale = parseFloat(event.target.value);
        const scale2 = parseFloat(event.target.value);
        const terrainMaterial = this.scene.getMaterialByName("terrain");
        
        if (!terrainMaterial) return;

        // Find the preview element
        const preview = event.target.closest('.texture-box')?.querySelector('.texture-preview');
        
        const scaleVector = new BABYLON.Vector2(scale, scale2);

        if (category === 'Terrain') {
            switch(name) {
                case 'floor':
                    terrainMaterial.setVector2("pathScale", scaleVector);
                    break;
                case 'rock':
                    terrainMaterial.setVector2("rockScale", scaleVector);
                    break;
                case 'grass':
                    terrainMaterial.setVector2("grassScale", scaleVector);
                    break;
                case 'mix':
                    terrainMaterial.setVector2("transitionScale", scaleVector);
                    break;
            }
        } else if (category === 'Path') {
            switch(name) {
                case 'path':
                    terrainMaterial.setVector2("pathScale", scaleVector);
                    break;
                case 'rock':
                    terrainMaterial.setVector2("rockScale", scaleVector);
                    break;
                case 'transition':
                    terrainMaterial.setVector2("transitionScale", scaleVector);
                    break;
            }
        }

        // Update preview scale
        if (preview) {
            preview.style.backgroundSize = `${scale * 100}%`;
        }
    }
} 