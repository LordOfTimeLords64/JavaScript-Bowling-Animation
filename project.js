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

// Accurate bowling equipment dimensions
var laneParams = {
    surfaceWidth: 41.5,
    surfaceLength: 754 + 3/16,
    firstPinZOffset: 720,
    pinsXOffsets: [
        0,
        -6,
        6,
        -12,
        0,
        12,
        -18,
        -6,
        6,
        18
    ],
    pinsZOffsets: [
        0,
        -Math.sqrt(108),
        -Math.sqrt(108),
        -2 * Math.sqrt(108),
        -2 * Math.sqrt(108),
        -2 * Math.sqrt(108),
        -3 * Math.sqrt(108),
        -3 * Math.sqrt(108),
        -3 * Math.sqrt(108),
        -3 * Math.sqrt(108)
    ],
    pinDotDiameter: 2 + 1/4,

    initX: 0,
    initY: 0,
    initZ:0,
};
var pinParameters = {
    splinePoints: [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(2.031/2, 0, 0),
        new THREE.Vector3(2.25/2, (2.25 - 2.031)/2, 0),
        new THREE.Vector3(2.828/2, 0.750, 0),
        new THREE.Vector3(3.906/2, 2.250, 0),
        new THREE.Vector3(4.510/2, 3.375, 0),
        new THREE.Vector3(4.766/2, 4.500, 0),
        new THREE.Vector3(4.563/2, 5.875, 0),
        new THREE.Vector3(3.703/2, 7.250, 0),
        new THREE.Vector3(2.472/2, 8.625, 0),
        new THREE.Vector3(1.965/2, 9.375, 0),
        new THREE.Vector3(1.797/2, 10, 0),
        new THREE.Vector3(1.870/2, 10.875, 0),
        new THREE.Vector3(2.094/2, 11.750, 0),
        new THREE.Vector3(2.406/2, 12.625, 0),
        new THREE.Vector3(2.547/2, 13.500, 0),
        new THREE.Vector3(1.2735, 15 - 1.2735, 0),
        new THREE.Vector3(1.2735 * Math.cos(1 * Math.PI/16), 15 - 1.2735 + 1.2735 * Math.sin(1 * Math.PI/16), 0),
        new THREE.Vector3(1.2735 * Math.cos(2 * Math.PI/16), 15 - 1.2735 + 1.2735 * Math.sin(2 * Math.PI/16), 0),
        new THREE.Vector3(1.2735 * Math.cos(3 * Math.PI/16), 15 - 1.2735 + 1.2735 * Math.sin(3 * Math.PI/16), 0),
        new THREE.Vector3(1.2735 * Math.cos(4 * Math.PI/16), 15 - 1.2735 + 1.2735 * Math.sin(4 * Math.PI/16), 0),
        new THREE.Vector3(1.2735 * Math.cos(5 * Math.PI/16), 15 - 1.2735 + 1.2735 * Math.sin(5 * Math.PI/16), 0),
        new THREE.Vector3(1.2735 * Math.cos(6 * Math.PI/16), 15 - 1.2735 + 1.2735 * Math.sin(6 * Math.PI/16), 0),
        new THREE.Vector3(1.2735 * Math.cos(7 * Math.PI/16), 15 - 1.2735 + 1.2735 * Math.sin(7 * Math.PI/16), 0),
        new THREE.Vector3(0, 15.000, 0)
    ]
};
var ballParams = {
    radius: ((8.595 + 8.500)/2)/2,

    initX: 12,
    initY: ((8.595 + 8.500)/2)/2 + 1,
    initZ: laneParams.initZ + laneParams.surfaceLength/2 - ((8.595 + 8.500)/2)/2,

    velX: -2,
    velZ: -20 * 12,
}
var spotlightParams = {
    initX: 0,
    initY: 100,
    initZ: 0,

    color: 0xFFFFFF,

    intensity: 0.5,

    angle: Math.PI/8,
}

/////////////////////////////////////////////
// TESTING CODE FOR MOVEMENT GIVEN USER INPUT
// var ballObject = null;
// var moveDirection = {left: 0, right: 0};
// const STATE = {DISABLE_DEACTIVATION: 4};
/////////////////////////////////////////////

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
    // setupEventHandlers();

    var initialLanePos = new THREE.Vector3(
        laneParams.initX,
        laneParams.initY,
        laneParams.initZ
    );

    createLane(initialLanePos, 0, null);

    createTenPins(initialLanePos.x, initialLanePos.y, initialLanePos.z);

    createBall(ballParams.radius, new THREE.Vector3(ballParams.initX, ballParams.initY, ballParams.initZ), 15, null);

    var spotlight = new THREE.SpotLight(spotlightParams.color);
    spotlight.position.set(
        spotlightParams.initX,
        spotlightParams.initY,
        spotlightParams.initZ
    );
    spotlight.target = scene.getObjectByName('theBall');
    spotlight.intensity = spotlightParams.intensity;
    spotlight.angle = spotlightParams.angle;
    spotlight.castShadow = true;
    scene.add(spotlight);

    TW.setKeyboardCallback("f", rollBall, "Roll the ball!");
    TW.setKeyboardCallback("r", resetLane, "Reset the lane!");
    TW.setKeyboardCallback("j", moveBallLeft, "Move the ball to the left!");
    TW.setKeyboardCallback("k", moveBallRight, "Move the ball to the right!");

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
    var ambLight = new THREE.AmbientLight(0x333333, 2);
    scene.add(ambLight);

}

// function setupEventHandlers() {
//     window.addEventListener('keydown', handleKeyDown, false);
//     window.addEventListener('keyup', handleKeyUp, false);
// }

function createLane(position, mass, rot_quaternion) {

    ///////////////////////////////
    // REGULAR THREE.js GRAPHICS //
    ///////////////////////////////

    // Making the parent lane object
    let lane = new THREE.Object3D();
    lane.name = 'lane';

    let laneSurface = makeLaneSurface();

    // Adding the lane surface
    lane.add(laneSurface);

    lane.position.set(position.x, position.y, position.z);
    scene.add(lane);

    /////////////////////////////
    // Ammo.js RIGID BODY CODE //
    /////////////////////////////

    let collisionBoxHeight = 0.1;

    let quaternion = undefined;

    if (rot_quaternion == null) {
        quaternion = {x: 0, y: 0, z:0, w: 1};
    } else {
        quaternion = rot_quaternion;
    }

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(
        new Ammo.btQuaternion(
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w
        )
    );
    let defaultMotionState = new Ammo.btDefaultMotionState(transform);

    let structColShape = new Ammo.btBoxShape(
        new Ammo.btVector3(laneParams.surfaceWidth * .5, collisionBoxHeight * .5, laneParams.surfaceLength * .5)
    );
    structColShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    structColShape.calculateLocalInertia(mass, localInertia);

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo(
        mass,
        defaultMotionState,
        structColShape,
        localInertia
    );
    let RBody = new Ammo.btRigidBody(RBody_Info);

    physicsUniverse.addRigidBody(RBody);

    lane.userData.physicsBody = RBody;

    rigidBody_List.push(lane);
    
}

// Returns the lane surface 3D object
function makeLaneSurface() {
    // Making the parent lane surface object
    var laneSurface = new THREE.Object3D();
    laneSurface.name = 'nameSurface';

    ////////////////
    // LANE PLANE //
    ////////////////
    var width = laneParams.surfaceWidth;
    var length = laneParams.surfaceLength;

    // Basic lane plane
    var laneGeom = new THREE.PlaneGeometry(width, length, 100, 100);

    // Lane texture
    laneTexture.wrapS = THREE.RepeatWrapping;
    laneTexture.repeat.set(2, 0);

    // Lane material
    var b = 1;
    var s = 1;
    var laneMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(b, b, b),
        specular: new THREE.Color( s, s, s),
        shininess: 20,
        map: laneTexture
    });

    var laneMesh = new THREE.Mesh(laneGeom, laneMat);
    laneMesh.rotation.x = -Math.PI/2;
    laneMesh.receiveShadow = true;

    laneSurface.add(laneMesh);

    //////////////
    // PIN DOTS //
    //////////////

    var radius = laneParams.pinDotDiameter/2;
    
    var pinDotMat = new THREE.MeshPhongMaterial({
        color: 0x000000,
        specular: new THREE.Color( s, s, s),
        shininess: 20,
    });

    var pinDots = [];
    for(i = 0; i < 10; i++) {
        pinDots[i] = new THREE.Mesh(
            new THREE.CircleGeometry(radius, 50),
            pinDotMat
        );

        pinDots[i].position.set(
            laneParams.pinsXOffsets[i],
            0.001,
            laneParams.pinsZOffsets[i] - laneParams.firstPinZOffset + length/2
        );
        pinDots[i].rotation.x = -Math.PI/2;
        pinDots.receiveShadow = true;

        laneSurface.add(pinDots[i]);
    }

    return laneSurface;
}

function makePin(position, mass, rot_quaternion, objectName) {

    ///////////////////////////////
    // REGULAR THREE.js GRAPHICS //
    ///////////////////////////////

    var pin = new THREE.Object3D();
    pin.name = objectName;
    var pinHeight = 15;
    var pinMaxRadius = 4.766/2;

    // Making a curve to lathe on the y axis to make a pin mesh
    var curve = new THREE.CatmullRomCurve3(pinParameters.splinePoints);

    var pinGeom = new THREE.LatheGeometry(curve.getPoints(100));
    var pinMat = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        shininess: 20,
        specular: 0xFFFFFF,
    });
    var pinMesh = new THREE.Mesh(pinGeom, pinMat);
    pinMesh.castShadow = true;
    pinMesh.position.set(0, -pinHeight/2, 0);
    pin.add(pinMesh);

    pin.position.set(position.x, position.y + pinHeight/2, position.z)
    scene.add(pin);

    /////////////////////////////
    // Ammo.js RIGID BODY CODE //
    /////////////////////////////

    let quaternion = undefined;

    if (rot_quaternion == null) {
        quaternion = {x: 0, y: 0, z:0, w: 1};
    } else {
        quaternion = rot_quaternion;
    }

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y + pinHeight/2, position.z));
    transform.setRotation(
        new Ammo.btQuaternion(
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w
        )
    );
    let defaultMotionState = new Ammo.btDefaultMotionState(transform);

    let structColShape = new Ammo.btCylinderShape(
        new Ammo.btVector3(pinMaxRadius, pinHeight/2, pinMaxRadius)
    );
    structColShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    structColShape.calculateLocalInertia(mass, localInertia);

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo(
        mass,
        defaultMotionState,
        structColShape,
        localInertia
    );
    let RBody = new Ammo.btRigidBody(RBody_Info);

    physicsUniverse.addRigidBody(RBody);

    pin.userData.physicsBody = RBody;

    rigidBody_List.push(pin);
    allTenPins.push(pin);

}

function createTenPins(laneX, laneY, laneZ) {
    var pos;
    for(i = 0; i < 10; i++) {
        pos = new THREE.Vector3(
            laneX + laneParams.pinsXOffsets[i],
            laneY + 0.3,
            laneZ + laneParams.pinsZOffsets[i] - laneParams.firstPinZOffset + laneParams.surfaceLength/2
        );
        pinName = 'pin' + i;
        makePin(pos, 3.5, null, pinName);
    }
}

function createBall(radius, position, mass, rot_quaternion) {

    let quaternion = undefined;

    if (rot_quaternion == null) {
        quaternion = {x: 0, y: 0, z:0, w: 1};
    } else {
        quaternion = rot_quaternion;
    }

    var ballGeom = new THREE.SphereGeometry(radius, 30, 30);
    var ballMat = new THREE.MeshPhongMaterial({
        color: new THREE.Color(1, 1, 1),
        specular: new THREE.Color( 1, 1, 1),
        shininess: 20,
        map: ballTexture
    });
    // var ball = ballObject = new THREE.Mesh(ballGeom, ballMat);
    var ball = new THREE.Mesh(ballGeom, ballMat);
    ball.castShadow = true;
    ball.position.set(position.x, position.y, position.x);
    ball.name = 'theBall';
    scene.add(ball);

    let transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(
        new Ammo.btQuaternion(
            quaternion.x,
            quaternion.y,
            quaternion.z,
            quaternion.w
        )
    );
    let defaultMotionState = new Ammo.btDefaultMotionState(transform);

    let structColShape = new Ammo.btSphereShape(radius);
    structColShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    structColShape.calculateLocalInertia(mass, localInertia);

    let RBody_Info = new Ammo.btRigidBodyConstructionInfo(
        mass,
        defaultMotionState,
        structColShape,
        localInertia
    );
    let RBody = new Ammo.btRigidBody(RBody_Info);

    ////////////////////
    // MOVE BALL TESTING
    // RBody.setActivationState(STATE.DISABLE_DEACTIVATION);
    ////////////////////

    physicsUniverse.addRigidBody(RBody);

    ball.userData.physicsBody = RBody;

    rigidBody_List.push(ball);

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

function render() {

    let deltaTime = clock.getDelta();
    // moveBall();
    updatePhysicsUniverse(deltaTime);

    // renderer.render(scene, camera);
    TW.render();
    requestAnimationFrame(render);

}

function rollBall() {
    var ball = scene.getObjectByName('theBall');
    ball.userData.physicsBody.setLinearVelocity(
        new Ammo.btVector3(ballParams.velX, 0, ballParams.velZ)
    );
}

function moveBallLeft() {
    var ball = scene.getObjectByName('theBall');
    ball.userData.physicsBody.setLinearVelocity(
        new Ammo.btVector3(-5, 0, 0)
    );
    console.log(ball.userData.physicsBody.getLinearVelocity().x);
}

function moveBallRight() {
    var ball = scene.getObjectByName('theBall');
    ball.userData.physicsBody.setLinearVelocity(
        new Ammo.btVector3(5, 0, 0)
    );
}

function resetLane() {
    location.reload();
}

// function handleKeyDown(event) {
//     var keyCode = event.keyCode;

//     switch(keyCode) {
//         case 67: // c
//             moveDirection.left = 1;
//             break;

//         case 86: // v
//             moveDirection.right = 1;
//             break;
//     }
//     // moveBall();
// }

// function handleKeyUp(event) {
//     var keyCode = event.keyCode;

//     switch(keyCode) {
//         case 67: // c
//             moveDirection.left = 0;
//             break;

//         case 86: // v
//             moveDirection.right = 0;
//             break;
//     }
//     // moveBall();
// }

// function moveBall() {
//     var moveX = moveDirection.right - moveDirection.left;
//     moveX = moveX * 20;

//     // var oldVel = ballObject.userData.physicsBody.getLinearVelocity();
//     // var resultantImpulse = new Ammo.btVector3(moveX, oldVel.y, oldVel.z);

//     var resultantImpulse = new Ammo.btVector3(moveX, 0, 0);

//     ballObject.userData.physicsBody.setLinearVelocity(resultantImpulse);
// }