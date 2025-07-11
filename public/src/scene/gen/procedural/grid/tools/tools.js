import Tool from "./Tool.js";
import Add from "./add/add.js";
import Settings from "./settings/settings.js";
import Raise from "./terrain/raise.js";
import TextureTool from "./texture/textureTool.js";


export function createTools(scene, meshes, gridTracker, grid) {
    document.getElementById('toolBar').innerHTML = '';


    let tools = {
        tools: {},
        selectedTool: null,
        setSelectedTool: function (toolName) {
            if (this.tools[toolName]) {
                this.selectedTool = this.tools[toolName];
            }
        }
    };

    const raiseSubTools = [
        { name: 'Raise' },
        { name: 'Lower' },
        { name: 'Flatten' },
        { name: 'Path' }
        // new Raise("Raise", scene, meshes, grid, tools, "./assets/util/ui/icons/path.png", {}),
        // new Raise("Lower", scene, meshes, grid, tools, "./assets/util/ui/icons/path.png", {}),
        // new Raise("Flatten", scene, meshes, grid, tools, "./assets/util/ui/icons/path.png", {}),
    ];

    const addSubTools = [
        // { name: 'Inn' },
        // { name: 'Door' }
    ];

    const settingsSubTools = [
        // { name: 'Load' },
        // { name: 'Load World' },
        { name: 'Save' }
        // { name: 'Door' }
    ];

    // let raise = new Tool("Raise");
    // let add = new Tool("Place");
    tools.tools.place = new Add("Place", scene, meshes, grid, tools, "./assets/util/ui/icons/path.png", addSubTools);
    tools.tools.raise = new Raise("Raise", scene, meshes, grid, tools, "./assets/util/ui/icons/tree.png", raiseSubTools);
    tools.tools.settings = new Settings("Settings", scene, meshes, grid, tools, "./assets/util/ui/icons/gear.png", settingsSubTools);
    tools.tools.texture = new TextureTool("Texture", scene, meshes, grid, tools, "./assets/util/ui/icons/tree.png");

    // Set the initial selected tool
    tools.selectedTool = tools.tools.place;
    // console.log(tools);


    return tools;
}
