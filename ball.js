var ballParams = {
    radius: ((8.595 + 8.500)/2)/2,
    initX: 0,
    initY: ((8.595 + 8.500)/2)/2 + 1,
    initZ: laneParams.initZ + laneParams.surfaceLength/2 - ((8.595 + 8.500)/2)/2,
    x_velocity: 0,
    y_velocity: 0,
    z_velocity: 20 * 12,
    x_angular_velocity: 0,
    y_angular_velocity: 0,
    z_angular_velocity:0,
    friction: 6,
    mass: 15,
};

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

    RBody.setActivationState(STATE.DISABLE_DEACTIVATION);
    
    RBody.setFriction(ballParams.friction);
    RBody.setRollingFriction(ballParams.friction);

    physicsUniverse.addRigidBody(RBody);

    ball.userData.physicsBody = RBody;

    rigidBody_List.push(ball);
}

function moveBall() {
    if (ballWasRolled) {
        return;
    }

    var ball = scene.getObjectByName('theBall');
    var moveX = 20 * (moveDirection.right - moveDirection.left);
    var outOfLaneWidth = (Math.abs(ball.position.x) >= laneParams.initX + laneParams.surfaceWidth/2 - ballParams.radius);
    var goingTooFarRight = (ball.position.x > laneParams.initX && moveX > 0);
    var goingTooFarLeft = (ball.position.x < laneParams.initX && moveX < 0);
    if(outOfLaneWidth && (goingTooFarRight || goingTooFarLeft) ) {
        moveX = 0;
    }

    var resultantImpulse = new Ammo.btVector3(moveX, 0, 0);

    ball.userData.physicsBody.setLinearVelocity(resultantImpulse);
}

function rollBall() {
    if (ballWasRolled) {
        return;
    }

    ballWasRolled = true;
    var ball = scene.getObjectByName('theBall');
    ball.userData.physicsBody.setLinearVelocity(
        new Ammo.btVector3(
            ballParams.x_velocity,
            ballParams.y_velocity,
            (-1) * Math.abs(ballParams.z_velocity)
        )
    );
    ball.userData.physicsBody.setAngularVelocity(
        new Ammo.btVector3(
            ballParams.x_angular_velocity,
            ballParams.y_angular_velocity,
            ballParams.z_angular_velocity
        )
    );
}