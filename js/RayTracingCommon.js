function Vec3(x = 0, y = 0, z = 0)
{
	this.x = x;
	this.y = y;
	this.z = z;
}

Vec3.prototype.set = function (x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;
};

Vec3.prototype.copy = function (otherVec)
{
	this.x = otherVec.x;
	this.y = otherVec.y;
	this.z = otherVec.z;
};

Vec3.prototype.add = function (otherVec)
{
	this.x += otherVec.x;
	this.y += otherVec.y;
	this.z += otherVec.z;
};

Vec3.prototype.subtract = function (otherVec)
{
	this.x -= otherVec.x;
	this.y -= otherVec.y;
	this.z -= otherVec.z;
};
// useful for color vec3(r,g,b) multiplication by another color vec3(r,g,b)
Vec3.prototype.multiplyColor = function (otherColorVec)
{
	this.x *= otherColorVec.x;
	this.y *= otherColorVec.y;
	this.z *= otherColorVec.z;
};

Vec3.prototype.multiplyScalar = function (scalar)
{
	this.x *= scalar;
	this.y *= scalar;
	this.z *= scalar;
};

Vec3.prototype.mix = function (vecA, vecB, amount)
{
	amount = Math.max(0, amount); // clamp supplied amount to 0-1 range
	amount = Math.min(1, amount); // clamp supplied amount to 0-1 range
	this.x = (vecA.x * (1 - amount)) + (vecB.x * amount);
	this.y = (vecA.y * (1 - amount)) + (vecB.y * amount);
	this.z = (vecA.z * (1 - amount)) + (vecB.z * amount);
};

Vec3.prototype.dot = function (otherVec)
{
	return (this.x * otherVec.x) + (this.y * otherVec.y) + (this.z * otherVec.z);
};

Vec3.prototype.crossVectors = function (vecA, vecB)
{
	this.x = (vecA.y * vecB.z) - (vecA.z * vecB.y);
	this.y = (vecA.z * vecB.x) - (vecA.x * vecB.z);
	this.z = (vecA.x * vecB.y) - (vecA.y * vecB.x);
};

Vec3.prototype.magnitude = function ()
{
	return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
};

let magnitude = 0;
let oneOverMagnitude = 0;

Vec3.prototype.normalize = function ()
{
	magnitude = this.magnitude();
	oneOverMagnitude = 1 / magnitude;

	this.x *= oneOverMagnitude;
	this.y *= oneOverMagnitude;
	this.z *= oneOverMagnitude;
};

let IdotN = 0;

Vec3.prototype.reflect = function (surfaceNormal)
{
	/* GLSL reflect() implementation
	R = I - (N * 2 * IdotN); 
	*/

	// 'tempVec' represents N in the above equation
	// 'this' represents I in the above equation
	tempVec.copy(surfaceNormal);
	IdotN = this.dot(surfaceNormal);
	tempVec.multiplyScalar(2 * IdotN);
	this.subtract(tempVec);
};



let k = 0.0;

Vec3.prototype.refract = function (surfaceNormal, eta)
{
	/* GLSL refract() implementation
	k = eta * eta * (1.0 - IdotN * IdotN);  
	T = eta * I - (eta * IdotN + sqrt(1.0 - k)) * N; 
	*/

	// T = eta * I - (N * eta * IdotN + sqrt(1 - (eta * eta * (1 - IdotN * IdotN))))
	// 'tempVec' represents N in the above equation
	// 'this' represents I in the above equation
	tempVec.copy(surfaceNormal);
	IdotN = this.dot(surfaceNormal);
	k = (eta * eta) * (1 - IdotN * IdotN);
	tempVec.multiplyScalar(eta * IdotN + Math.sqrt(1 - k));
	this.multiplyScalar(eta);
	this.subtract(tempVec);
};


let worldUp = new Vec3(0, 1, 0);
let cameraRight = new Vec3();
let cameraUp = new Vec3();
let cameraForward = new Vec3();

function setUpCameraFrame()
{
	cameraForward.copy(cameraPosition);
	cameraForward.subtract(cameraTarget);
	cameraForward.normalize();

	cameraRight.crossVectors(worldUp, cameraForward);
	cameraRight.normalize();

	cameraUp.crossVectors(cameraForward, cameraRight);
	cameraUp.normalize();
}

let m00 = 0, m01 = 0, m02 = 0, m03 = 0;
let m10 = 0, m11 = 0, m12 = 0, m13 = 0;
let m20 = 0, m21 = 0, m22 = 0, m23 = 0;
let m30 = 0, m31 = 0, m32 = 0, m33 = 0;

function Matrix4()
{
	this.elements =
	       [1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1];
}

Matrix4.prototype.makeIdentity = function ()
{
	this.elements[0] = 1; this.elements[1] = 0; this.elements[2] = 0; this.elements[3] = 0;
	this.elements[4] = 0; this.elements[5] = 1; this.elements[6] = 0; this.elements[7] = 0;
	this.elements[8] = 0; this.elements[9] = 0; this.elements[10] = 1; this.elements[11] = 0;
	this.elements[12] = 0; this.elements[13] = 0; this.elements[14] = 0; this.elements[15] = 1;
}

/* Matrix4.prototype.set = function (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
{
	this.elements[0] = a; this.elements[1] = b; this.elements[2] = c; this.elements[3] = d;
	this.elements[4] = e; this.elements[5] = f; this.elements[6] = g; this.elements[7] = h;
	this.elements[8] = i; this.elements[9] = j; this.elements[10] = k; this.elements[11] = l;
	this.elements[12] = m; this.elements[13] = n; this.elements[14] = o; this.elements[15] = p;
} */

Matrix4.prototype.copy = function (otherMatrix)
{
	this.elements[0] = otherMatrix.elements[0];
	this.elements[1] = otherMatrix.elements[1];
	this.elements[2] = otherMatrix.elements[2];
	this.elements[3] = otherMatrix.elements[3];
	this.elements[4] = otherMatrix.elements[4];
	this.elements[5] = otherMatrix.elements[5];
	this.elements[6] = otherMatrix.elements[6];
	this.elements[7] = otherMatrix.elements[7];
	this.elements[8] = otherMatrix.elements[8];
	this.elements[9] = otherMatrix.elements[9];
	this.elements[10] = otherMatrix.elements[10];
	this.elements[11] = otherMatrix.elements[11];
	this.elements[12] = otherMatrix.elements[12];
	this.elements[13] = otherMatrix.elements[13];
	this.elements[14] = otherMatrix.elements[14];
	this.elements[15] = otherMatrix.elements[15];
}

Matrix4.prototype.transpose = function ()
{
	m00 = this.elements[0]; m01 = this.elements[1]; m02 = this.elements[2]; m03 = this.elements[3];
	m10 = this.elements[4]; m11 = this.elements[5]; m12 = this.elements[6]; m13 = this.elements[7];
	m20 = this.elements[8]; m21 = this.elements[9]; m22 = this.elements[10]; m23 = this.elements[11];
	m30 = this.elements[12]; m31 = this.elements[13]; m32 = this.elements[14]; m33 = this.elements[15];

	this.elements[0] = m00; this.elements[1] = m10; this.elements[2] = m20; this.elements[3] = m30;
	this.elements[4] = m01; this.elements[5] = m11; this.elements[6] = m21; this.elements[7] = m31;
	this.elements[8] = m02; this.elements[9] = m12; this.elements[10] = m22; this.elements[11] = m32;
	this.elements[12] = m03; this.elements[13] = m13; this.elements[14] = m23; this.elements[15] = m33;
}

let tmp_0 = 0, tmp_1 = 0, tmp_2 = 0, tmp_3 = 0;
let tmp_4 = 0, tmp_5 = 0, tmp_6 = 0, tmp_7 = 0;
let tmp_8 = 0, tmp_9 = 0, tmp_10 = 0, tmp_11 = 0;
let tmp_12 = 0, tmp_13 = 0, tmp_14 = 0, tmp_15 = 0;
let tmp_16 = 0, tmp_17 = 0, tmp_18 = 0, tmp_19 = 0;
let tmp_20 = 0, tmp_21 = 0, tmp_22 = 0, tmp_23 = 0;

let t_0 = 0, t_1 = 0, t_2 = 0, t_3 = 0;
let d = 0;

Matrix4.prototype.invert = function ()
{
	m00 = this.elements[0]; m01 = this.elements[1]; m02 = this.elements[2]; m03 = this.elements[3];
	m10 = this.elements[4]; m11 = this.elements[5]; m12 = this.elements[6]; m13 = this.elements[7];
	m20 = this.elements[8]; m21 = this.elements[9]; m22 = this.elements[10]; m23 = this.elements[11];
	m30 = this.elements[12]; m31 = this.elements[13]; m32 = this.elements[14]; m33 = this.elements[15];

	tmp_0 = m22 * m33; tmp_1 = m32 * m23; tmp_2 = m12 * m33; tmp_3 = m32 * m13;
	tmp_4 = m12 * m23; tmp_5 = m22 * m13; tmp_6 = m02 * m33; tmp_7 = m32 * m03;
	tmp_8 = m02 * m23; tmp_9 = m22 * m03; tmp_10 = m02 * m13; tmp_11 = m12 * m03;
	tmp_12 = m20 * m31; tmp_13 = m30 * m21; tmp_14 = m10 * m31; tmp_15 = m30 * m11;
	tmp_16 = m10 * m21; tmp_17 = m20 * m11; tmp_18 = m00 * m31; tmp_19 = m30 * m01;
	tmp_20 = m00 * m21; tmp_21 = m20 * m01; tmp_22 = m00 * m11; tmp_23 = m10 * m01;

	t_0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
		(tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
	t_1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
		(tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
	t_2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
		(tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
	t_3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
		(tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

	d = 1.0 / (m00 * t_0 + m10 * t_1 + m20 * t_2 + m30 * t_3);

	this.elements[0] = d * t_0;
	this.elements[1] = d * t_1;
	this.elements[2] = d * t_2;
	this.elements[3] = d * t_3;
	this.elements[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
		(tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
	this.elements[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
		(tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
	this.elements[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
		(tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
	this.elements[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
		(tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
	this.elements[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
		(tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
	this.elements[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
		(tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
	this.elements[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
		(tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
	this.elements[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
		(tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
	this.elements[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
		(tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
	this.elements[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
		(tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
	this.elements[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
		(tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
	this.elements[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
		(tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));
}

let a00 = 0, a01 = 0, a02 = 0, a03 = 0;
let a10 = 0, a11 = 0, a12 = 0, a13 = 0;
let a20 = 0, a21 = 0, a22 = 0, a23 = 0;
let a30 = 0, a31 = 0, a32 = 0, a33 = 0;

let b00 = 0, b01 = 0, b02 = 0, b03 = 0;
let b10 = 0, b11 = 0, b12 = 0, b13 = 0;
let b20 = 0, b21 = 0, b22 = 0, b23 = 0;
let b30 = 0, b31 = 0, b32 = 0, b33 = 0;

Matrix4.prototype.multiplyMatrices = function (MatrixA, MatrixB)
{
	a00 = MatrixA.elements[0]; a01 = MatrixA.elements[1]; a02 = MatrixA.elements[2]; a03 = MatrixA.elements[3];
	a10 = MatrixA.elements[4]; a11 = MatrixA.elements[5]; a12 = MatrixA.elements[6]; a13 = MatrixA.elements[7];
	a20 = MatrixA.elements[8]; a21 = MatrixA.elements[9]; a22 = MatrixA.elements[10]; a23 = MatrixA.elements[11];
	a30 = MatrixA.elements[12]; a31 = MatrixA.elements[13]; a32 = MatrixA.elements[14]; a33 = MatrixA.elements[15];

	b00 = MatrixB.elements[0]; b01 = MatrixB.elements[1]; b02 = MatrixB.elements[2]; b03 = MatrixB.elements[3];
	b10 = MatrixB.elements[4]; b11 = MatrixB.elements[5]; b12 = MatrixB.elements[6]; b13 = MatrixB.elements[7];
	b20 = MatrixB.elements[8]; b21 = MatrixB.elements[9]; b22 = MatrixB.elements[10]; b23 = MatrixB.elements[11];
	b30 = MatrixB.elements[12]; b31 = MatrixB.elements[13]; b32 = MatrixB.elements[14]; b33 = MatrixB.elements[15];

	this.elements[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
	this.elements[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
	this.elements[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
	this.elements[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
	this.elements[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
	this.elements[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
	this.elements[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
	this.elements[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
	this.elements[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
	this.elements[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
	this.elements[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
	this.elements[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
	this.elements[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
	this.elements[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
	this.elements[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
	this.elements[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
}

Matrix4.prototype.makeTranslation = function (v3)
{
	this.elements[0] = 1; this.elements[1] = 0; this.elements[2] = 0; this.elements[3] = 0;
	this.elements[4] = 0; this.elements[5] = 1; this.elements[6] = 0; this.elements[7] = 0;
	this.elements[8] = 0; this.elements[9] = 0; this.elements[10] = 1; this.elements[11] = 0;
	this.elements[12] = v3.x; this.elements[13] = v3.y; this.elements[14] = v3.z; this.elements[15] = 1;
}

let cos, sin;
Matrix4.prototype.makeRotationX = function (angleInRadians)
{
	cos = Math.cos(angleInRadians);
	sin = Math.sin(angleInRadians);

	this.elements[0] = 1; this.elements[1] = 0; this.elements[2] = 0; this.elements[3] = 0;
	this.elements[4] = 0; this.elements[5] = cos; this.elements[6] = sin; this.elements[7] = 0;
	this.elements[8] = 0; this.elements[9] = -sin; this.elements[10] = cos; this.elements[11] = 0;
	this.elements[12] = 0; this.elements[13] = 0; this.elements[14] = 0; this.elements[15] = 1;
}

Matrix4.prototype.makeRotationY = function (angleInRadians)
{
	cos = Math.cos(angleInRadians);
	sin = Math.sin(angleInRadians);

	this.elements[0] = cos; this.elements[1] = 0; this.elements[2] = -sin; this.elements[3] = 0;
	this.elements[4] = 0; this.elements[5] = 1; this.elements[6] = 0; this.elements[7] = 0;
	this.elements[8] = sin; this.elements[9] = 0; this.elements[10] = cos; this.elements[11] = 0;
	this.elements[12] = 0; this.elements[13] = 0; this.elements[14] = 0; this.elements[15] = 1;
}

Matrix4.prototype.makeRotationZ = function (angleInRadians)
{
	cos = Math.cos(angleInRadians);
	sin = Math.sin(angleInRadians);

	this.elements[0] = cos; this.elements[1] = sin; this.elements[2] = 0; this.elements[3] = 0;
	this.elements[4] = -sin; this.elements[5] = cos; this.elements[6] = 0; this.elements[7] = 0;
	this.elements[8] = 0; this.elements[9] = 0; this.elements[10] = 1; this.elements[11] = 0;
	this.elements[12] = 0; this.elements[13] = 0; this.elements[14] = 0; this.elements[15] = 1;
}

Matrix4.prototype.makeScaling = function (x, y, z)
{
	this.elements[0] = x; this.elements[1] = 0; this.elements[2] = 0; this.elements[3] = 0;
	this.elements[4] = 0; this.elements[5] = y; this.elements[6] = 0; this.elements[7] = 0;
	this.elements[8] = 0; this.elements[9] = 0; this.elements[10] = z; this.elements[11] = 0;
	this.elements[12] = 0; this.elements[13] = 0; this.elements[14] = 0; this.elements[15] = 1;
}

Matrix4.prototype.makeShearing = function (XbyY, XbyZ, YbyX, YbyZ, ZbyX, ZbyY)
{
	this.elements[0] = 1; this.elements[1] = YbyX; this.elements[2] = ZbyX; this.elements[3] = 0;
	this.elements[4] = XbyY; this.elements[5] = 1; this.elements[6] = ZbyY; this.elements[7] = 0;
	this.elements[8] = XbyZ; this.elements[9] = YbyZ; this.elements[10] = 1; this.elements[11] = 0;
	this.elements[12] = 0; this.elements[13] = 0; this.elements[14] = 0; this.elements[15] = 1;
}

let xAxis = new Vec3();
let yAxis = new Vec3();
let zAxis = new Vec3();

Matrix4.prototype.makeLookAt = function (v3_eyePos, v3_target)
{
	zAxis.copy(v3_target);
	zAxis.subtract(v3_eyePos);
	zAxis.normalize();

	xAxis.crossVectors(worldUp, zAxis);
	xAxis.normalize();

	yAxis.crossVectors(zAxis, xAxis);
	yAxis.normalize();

	this.elements[0] = xAxis.x; this.elements[1] = xAxis.y; this.elements[2] = xAxis.z; this.elements[3] = 0;
	this.elements[4] = yAxis.x; this.elements[5] = yAxis.y; this.elements[6] = yAxis.z; this.elements[7] = 0;
	this.elements[8] = zAxis.x; this.elements[9] = zAxis.y; this.elements[10] = zAxis.z; this.elements[11] = 0;
	this.elements[12] = v3_eyePos.x; this.elements[13] = v3_eyePos.y; this.elements[14] = v3_eyePos.z; this.elements[15] = 1;
}


let vx, vy, vz;

Vec3.prototype.transformPoint = function (m4_Matrix)
{
	vx = this.x;
	vy = this.y;
	vz = this.z;

	d = vx * m4_Matrix.elements[3] + vy * m4_Matrix.elements[7] + vz * m4_Matrix.elements[11] + m4_Matrix.elements[15];

	this.x = (vx * m4_Matrix.elements[0] + vy * m4_Matrix.elements[4] + vz * m4_Matrix.elements[8] + m4_Matrix.elements[12]) / d;
	this.y = (vx * m4_Matrix.elements[1] + vy * m4_Matrix.elements[5] + vz * m4_Matrix.elements[9] + m4_Matrix.elements[13]) / d;
	this.z = (vx * m4_Matrix.elements[2] + vy * m4_Matrix.elements[6] + vz * m4_Matrix.elements[10] + m4_Matrix.elements[14]) / d;
}

Vec3.prototype.transformDirection = function (m4_Matrix)
{
	vx = this.x;
	vy = this.y;
	vz = this.z;

	this.x = vx * m4_Matrix.elements[0] + vy * m4_Matrix.elements[4] + vz * m4_Matrix.elements[8];
	this.y = vx * m4_Matrix.elements[1] + vy * m4_Matrix.elements[5] + vz * m4_Matrix.elements[9];
	this.z = vx * m4_Matrix.elements[2] + vy * m4_Matrix.elements[6] + vz * m4_Matrix.elements[10];
}

Vec3.prototype.transformNormalByMatInverse = function (m4_MatInverse)
{
	vx = this.x;
	vy = this.y;
	vz = this.z;

	this.x = vx * m4_MatInverse.elements[0] + vy * m4_MatInverse.elements[1] + vz * m4_MatInverse.elements[2];
	this.y = vx * m4_MatInverse.elements[4] + vy * m4_MatInverse.elements[5] + vz * m4_MatInverse.elements[6];
	this.z = vx * m4_MatInverse.elements[8] + vy * m4_MatInverse.elements[9] + vz * m4_MatInverse.elements[10];
}





let halfDir = new Vec3();
let specAngle = 0;
let specularFalloff = 0;

function calcSpecularReflectance(rayDirection, sunDirection, normal, shininessExp)
{
	halfDir.copy(rayDirection);
	halfDir.x *= -1;
	halfDir.y *= -1;
	halfDir.z *= -1;
	halfDir.add(sunDirection);
	halfDir.normalize();

	specAngle = Math.max(0.0, halfDir.dot(normal));

	return Math.pow(specAngle, shininessExp);
}

let cosTheta = 0;

function calcFresnelEffect(r0, rayDir, normal)
{
	r0 *= r0;
	halfDir.copy(rayDir);
	halfDir.x *= -1;
	halfDir.y *= -1;
	halfDir.z *= -1;

	cosTheta = 1 - Math.max(0, halfDir.dot(normal));
	return (r0 + ((1 - r0) * cosTheta * cosTheta * cosTheta * cosTheta * cosTheta));
}

// reflectance using Fresnel equation.
let temp = 0.0;
let cosi = 0.0;
let sint2 = 0.0;
let cost = 0.0;
let Rs = 0.0;
let Rp = 0.0;
function calcFresnelReflectance(rayDirection, surfaceNormal, etai, etat)
{
	temp = etai;
	cosi = rayDirection.dot(surfaceNormal);
	if (cosi > 0.0)
	{
		etai = etat;
		etat = temp;
	}

	ratioIoR = etai / etat;
	sint2 = ratioIoR * ratioIoR * (1 - (cosi * cosi));
	if (sint2 > 1)
		return 1; // total internal reflection

	cost = Math.sqrt(1 - sint2);
	cosi = Math.abs(cosi);
	Rs = ((etat * cosi) - (etai * cost)) / ((etat * cosi) + (etai * cost));
	Rp = ((etai * cosi) - (etat * cost)) / ((etai * cosi) + (etat * cost));

	return ((Rs * Rs) + (Rp * Rp)) * 0.5;
}



let pOrO = new Vec3();
let denom = 0;
let t = Infinity;

function intersectRectangle(rectangleOrigin, rectangleNormal, radiusU, radiusV, rayO, rayD)
{
	denom = rayD.dot(rectangleNormal);
	if (denom >= 0)
	{
		return Infinity;
	}
	pOrO.copy(rectangleOrigin);
	pOrO.subtract(rayO);

	t = pOrO.dot(rectangleNormal) / denom;

	tempVec.copy(rayD);
	tempVec.multiplyScalar(t);
	hitPoint.copy(rayO);
	hitPoint.add(tempVec);

	if (t > 0 && Math.abs(rectangleOrigin.x - hitPoint.x) < radiusU &&
		Math.abs(rectangleOrigin.z - hitPoint.z) < radiusV)
	{
		return t;
	}

	return Infinity;
}

let invA, neg_halfB, u2, u;
let t0, t1;
function solveQuadratic(A, B, C)
{
	invA = 1 / A;
	B *= invA;
	C *= invA;
	neg_halfB = -B * 0.5;
	u2 = neg_halfB * neg_halfB - C;
	if (u2 < 0)
	{
		return false;
	}
	u = Math.sqrt(u2);
	t0 = neg_halfB - u;
	t1 = neg_halfB + u;

	return true;
}

let L = new Vec3();
let a = 0;
let b = 0;
let c = 0;

function intersectSphere(radius, spherePosition, rayO, rayD)
{
	t0 = 0;
	t1 = 0;

	L.copy(rayO);
	L.subtract(spherePosition);

	a = rayD.dot(rayD);
	b = 2 * rayD.dot(L);
	c = L.dot(L) - (radius * radius);

	if (solveQuadratic(a, b, c) == false)
	{
		return Infinity;
	}

	t = Infinity;
	if (t1 > 0)
	{
		t = t1;
	}

	if (t0 > 0)
	{
		t = t0;
	}

	return t;
}

function intersectUnitSphere(rayO, rayD, normal)
{
	t0 = 0;
	t1 = 0;

	a = rayD.dot(rayD);
	b = 2 * rayD.dot(rayO);
	c = rayO.dot(rayO) - 1;

	if (solveQuadratic(a, b, c) == false)
	{
		return Infinity;
	}

	t = Infinity;
	
	if (t0 > 0)
	{
		t = t0;
	}
	else if (t1 > 0)
	{
		t = t1;
	}

	normal.copy(rayO);
	tempVec.copy(rayD);
	tempVec.multiplyScalar(t);
	normal.add(tempVec);

	return t;
}

let theta = 0;
let phi = 0;
let normalizedPoint = new Vec3();

function calcSphereUV(pointOnSphere, sphereRadius, spherePosition)
{
	normalizedPoint.copy(pointOnSphere);
	normalizedPoint.subtract(spherePosition);
	normalizedPoint.multiplyScalar(1 / sphereRadius);

	theta = Math.atan2(normalizedPoint.x, normalizedPoint.z);
	phi = Math.acos(normalizedPoint.y);
	U = (theta / (2 * Math.PI)) + 0.5;
	V = (phi / Math.PI);
}

function calcRectangleUV(pointOnRectangle, rectRadiusU, rectRadiusV, rectPosition)
{
	tempVec.copy(pointOnRectangle);
	tempVec.subtract(rectPosition);
	tempVec.x /= (rectRadiusU * 2);
	// use Z component instead of Y, because this rect is in the X-Z plane
	tempVec.z /= (rectRadiusV * 2);
	U = tempVec.x + 0.5;
	V = tempVec.z + 0.5;
}

const LIGHT = -1;
const DIFFUSE = 0;
const METAL = 1;
const TRANSPARENT = 2;
const CLEARCOAT_DIFFUSE = 3;

let HitRecord = {};
HitRecord.nearestT = Infinity;
HitRecord.color = new Vec3();
HitRecord.type = -100;
HitRecord.intersectionPoint = new Vec3();
HitRecord.normal = new Vec3();
