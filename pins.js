/*
    Principles of Interactive Computer Graphics
    Final Project
    Michael Komnick
    12/11/2023
*/

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
    ],
    mass: 3.5,
};

function makePin(position, mass, rot_quaternion, objectName) {
    // THREE.js graphics portion of the pin
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

    // Ammo.js physics portion of the pin
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
        makePin(pos, pinParameters.mass, null, pinName);
    }
}