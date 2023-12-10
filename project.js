/*
    Principles of Interactive Computer Graphics
    Final Project
    Michael Komnick
    12/11/2023
*/

// Declaring global variables for later use with physics engine
var physicsUniverse = undefined;
var rigidBody_List = new Array();
var allTenPins = new Array();
var tmpTransformation = undefined;
var clock = undefined;

// Declaring regular THREE.js variables for later
var scene = undefined;
var camera = undefined;
var renderer = undefined;

var pinSpotlightParams = {
    x: 0,
    y: 75,
    z:0,
    color: 0xFFFFFF,
    intensity: 0.5,
    angle: Math.PI/8,
};
var ballSpotlightParams = {
    x: -50,
    y: 50,
    z: 50,
    color: 0xFFFFFF,
    intensity: 0.5,
    angle: Math.PI/16,
};

// Preparing for input to move the ball from its starting position before
// rolling it
var moveDirection = {left: 0, right: 0};
const STATE = {DISABLE_DEACTIVATION: 4};
var ballWasRolled = false;


// Starting the physics engine and calling the start function
// if all textures are loaded
var started = false;
var texturesLoaded = [];
texturesLoaded['ball'] = false;
texturesLoaded['lane'] = false;
var ballTexture = new THREE.TextureLoader().load(
    'red-marble.jpg',
    function() {
        startAfterTextures();
    }
);
var laneTexture = new THREE.TextureLoader().load(
    'laneWood.png',
    function() {
        startAfterTextures();
    }
);
function startAfterTextures() {
    if(!texturesLoaded.includes(false) && !started) {
        Ammo().then(AmmoStart);
        started = true;
    }
}

function AmmoStart() {
    tmpTransformation = new Ammo.btTransform();

    initGraphicsUniverse();
    initPhysiscsUniverse();
    setupEventHandlers();

    var lanePos = new THREE.Vector3(
        laneParams.initX,
        laneParams.initY,
        laneParams.initZ
    );

    createLane(lanePos, 0, null);

    createTenPins(lanePos.x, lanePos.y, lanePos.z);

    createBall(ballParams.radius, new THREE.Vector3(ballParams.initX, ballParams.initY, ballParams.initZ), 15, null);

    createPinsSpotlight();

    createBallSpotlight();

    TW.setKeyboardCallback(" ", rollBall, "Roll the ball!");
    TW.setKeyboardCallback("r", resetLane, "Reset the lane!");
    
    var gui = new dat.GUI();
    gui.add(ballParams, "x_velocity", -12, 12).step(0.25);
    gui.add(ballParams, "z_velocity", 0, 50 * 12).step(0.25);
    gui.add(ballParams, "x_angular_velocity", -50, 50).step(0.25);
    gui.add(ballParams, "y_angular_velocity", -50, 50).step(0.25);
    gui.add(ballParams, "z_angular_velocity", -50, 50).step(0.25);

    render();
}

function initPhysiscsUniverse() {
    // Configure the detection of collisions
    var collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    var dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    var overlappingPairCache = new Ammo.btDbvtBroadphase();
    var solver = new Ammo.btSequentialImpulseConstraintSolver();

    // Setting our dynamic world (physics universe)
    physicsUniverse = new Ammo.btDiscreteDynamicsWorld(
        dispatcher,
        overlappingPairCache,
        solver,
        collisionConfiguration
    );

    // Enabling gravity
    physicsUniverse.setGravity(new Ammo.btVector3(0, -75, 0));
}

function initGraphicsUniverse() {
    clock = new THREE.Clock();

    scene = new THREE.Scene();

    scene.background = new THREE.Color(0x000000);
    renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    TW.mainInit(renderer, scene);

    TW.cameraSetup(
        renderer,
        scene,
        {
            minx: -laneParams.surfaceWidth/2 - 5,
            maxx: laneParams.surfaceWidth/2 + 5,
            miny: -5,
            maxy: 100,
            minz: -laneParams.surfaceLength/2 - 5,
            maxz: laneParams.surfaceLength/2 + 5
        }
    );

    // Adding ambient light
    var ambLight = new THREE.AmbientLight(0x333333, 3);
    scene.add(ambLight);
}

function setupEventHandlers() {
    window.addEventListener('keydown', handleKeyDown, false);
    window.addEventListener('keyup', handleKeyUp, false);
}

function createPinsSpotlight() {
    var targetPinDot = scene.getObjectByName('pinDot4');
    var spotlight = new THREE.SpotLight(pinSpotlightParams.color);
    spotlight.position.set(
        targetPinDot.position.x + pinSpotlightParams.x,
        targetPinDot.position.y + pinSpotlightParams.y,
        targetPinDot.position.z + pinSpotlightParams.z
    );
    spotlight.target = targetPinDot;
    spotlight.intensity = pinSpotlightParams.intensity;
    spotlight.angle = pinSpotlightParams.angle;
    spotlight.castShadow = true;
    spotlight.name = "pinsSpotlight";
    scene.add(spotlight);
}

function createBallSpotlight() {
    var ball = scene.getObjectByName('theBall');
    var spotlight = new THREE.SpotLight(ballSpotlightParams.color);
    spotlight.position.set(
        ball.position.x + ballSpotlightParams.x,
        ball.position.y + ballSpotlightParams.y,
        ball.position.z + ballSpotlightParams.z
    );
    spotlight.target = ball;
    spotlight.intensity = ballSpotlightParams.intensity;
    spotlight.angle = ballSpotlightParams.angle;
    spotlight.castShadow = true;
    spotlight.name = "ballSpotlight";
    scene.add(spotlight);
}

function updatePhysicsUniverse(deltaTime) {
    physicsUniverse.stepSimulation(deltaTime, 10);

    for(i = 0; i < rigidBody_List.length; i++) {

        let Graphics_Obj = rigidBody_List[i];
        let Physics_Obj = Graphics_Obj.userData.physicsBody;

        let motionState = Physics_Obj.getMotionState();
        if(motionState) {
            motionState.getWorldTransform(tmpTransformation);
            let new_pos = tmpTransformation.getOrigin();
            let new_qua = tmpTransformation.getRotation();
            Graphics_Obj.position.set(new_pos.x(), new_pos.y(), new_pos.z());
            Graphics_Obj.quaternion.set(
                new_qua.x(),
                new_qua.y(),
                new_qua.z(),
                new_qua.w()
            );
        }
    }
}

function updateBallSpotlightPos() {
    var ballSpotlight = scene.getObjectByName('ballSpotlight');
    var ball = scene.getObjectByName('theBall');
    ballSpotlight.position.set(
        ball.position.x + ballSpotlightParams.x,
        ball.position.y + ballSpotlightParams.y,
        ball.position.z + ballSpotlightParams.z
    );
}

function render() {
    let deltaTime = clock.getDelta();
    moveBall();
    updatePhysicsUniverse(deltaTime);
    updateBallSpotlightPos();
    // renderer.render(scene, camera);
    TW.render();
    requestAnimationFrame(render);
}

function resetLane() {
    location.reload();
}

function handleKeyDown(event) {
    if (ballWasRolled) {
        return;
    }

    var keyCode = event.keyCode;

    switch(keyCode) {
        case 65: // a
            moveDirection.left = 1;
            break;

        case 68: // d
            moveDirection.right = 1;
            break;
    }
}

function handleKeyUp(event) {
    if (ballWasRolled) {
        return;
    }

    var keyCode = event.keyCode;

    switch(keyCode) {
        case 65: // a
            moveDirection.left = 0;
            break;

        case 68: // d
            moveDirection.right = 0;
            break;
    }
}