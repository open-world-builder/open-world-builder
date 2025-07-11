let DEBUG = false;

let SCENE_MANAGER = {};

let RIGHT_HAND = {};
let PLAYER = {};
let DUMMY = {};

var DMGPOP = {};

let HPBAR = {};

let VFX = {};

let SHADERS = {};

let GRID = {};

let MESH_LIBRARY = {};
// Contains:
//   'Plants'
//     'Grass'
//     'Tree'
//   'Buildings'
//     'BuildingType'
//     'Wall'
//     'Roof'

// array of 9 grids, to load in dynamically around the player
let GRIDS;

let TOOLS;

let targetBaseOnCameraView = true; // if false target based on character rotation
// use touch joystick for mobile options

let DYNAMIC_CAMERA = false;
// Used for game controller on pc and shows joystick on mobile.
// Emulates KOA smooth camera follow effect
let ON_MOBILE = true;
let CANVASES = []; //One canvas For Game, one for Mobile Input Detection

// todo move this from global. used for mobile input
let inputMap = {};

let FAST_RELOAD = false; //Enable for fast development, disable for prod

// Graphics Settings
let WEBGPU = false; //otherwise use WebGL

let GODRAYS;

let OPTIONS;

let SKILL_BAR;
let SPELLBOOK;
let SKILL_TREE;
let CLASS;
let PLAYER_DATA = null;

let MULTIPLAYER;

let MOVEMENT_OVERIDE_MOBILE = false;
let MOVEMENT_OVERIDE_MOBILE_DIRECTION_X = 0;
let MOVEMENT_OVERIDE_MOBILE_DIRECTION_Y = 0;

let MODE = 0; //"0 = EDIT" or "1 = ADVENTURE"
let PRESSED_WASD = false; //used for tutorial

let COLOR_CORRECTION; //Used for second camera

let PICKED_MESH = null;

let TERRAIN_EDITOR;

let CURRENT_INTERACT_BUTTON = 0; //0 == keyboard, 1 == phone, 2 == controller

let CHARACTER_DATA = null;

// Performance Options Control
let SSAO_GLOBAL = null;
let SHADOW_GENERATOR = null;

let NAVIGATION_PLUGIN = null;

let CROWD = null;

let IS_IN_CONVERSATION = false;

let AUDIO_ENGINE = null;

let NPC_DATA = null;

let IS_SLIDING = false;
