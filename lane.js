/*
    Principles of Interactive Computer Graphics
    Final Project
    Michael Komnick
    12/11/2023
*/

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
    firction: 6,
};

function createLane(position, mass, rot_quaternion) {
    // THREE.js graphics portion of the lane
    // Making the parent lane object
    let lane = new THREE.Object3D();
    lane.name = 'lane';

    let laneSurface = makeLaneSurface();

    // Adding the lane surface
    lane.add(laneSurface);

    lane.position.set(position.x, position.y, position.z);
    scene.add(lane);

    // Ammo.js physics portion of the lane
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

    RBody.setFriction(laneParams.firction);
    RBody.setRollingFriction(laneParams.friciton);

    physicsUniverse.addRigidBody(RBody);
    lane.userData.physicsBody = RBody;
    rigidBody_List.push(lane);
}

// Returns the lane surface 3D object
function makeLaneSurface() {
    // Making the parent lane surface object
    var laneSurface = new THREE.Object3D();
    laneSurface.name = 'nameSurface';

    // LANE PLANE
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

    // PIN DOTS
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

        pinDots[i].name = 'pinDot' + i;

        laneSurface.add(pinDots[i]);
    }

    return laneSurface;
}