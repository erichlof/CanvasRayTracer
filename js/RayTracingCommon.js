let ONE_OVER_PI = 1 / Math.PI;
let ONE_OVER_TWO_PI = 1 / (Math.PI * 2);


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

Vec3.prototype.getPointAlongRay = function(rayO, rayD, t)
{
	this.x = rayO.x + (t * rayD.x);
	this.y = rayO.y + (t * rayD.y);
	this.z = rayO.z + (t * rayD.z);
	return this;
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



let k = 0;

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
	//cameraUp.normalize();
}


let m00 = 0, m01 = 0, m02 = 0, m03 = 0;
let m10 = 0, m11 = 0, m12 = 0, m13 = 0;
let m20 = 0, m21 = 0, m22 = 0, m23 = 0;
let m30 = 0, m31 = 0, m32 = 0, m33 = 0;

function Matrix4()
{
	this.elements = new Float32Array(16);
}

Matrix4.prototype.makeIdentity = function ()
{
	const el = this.elements;
	el[0] = 1; el[1] = 0; el[2] = 0; el[3] = 0;
	el[4] = 0; el[5] = 1; el[6] = 0; el[7] = 0;
	el[8] = 0; el[9] = 0; el[10] = 1; el[11] = 0;
	el[12] = 0; el[13] = 0; el[14] = 0; el[15] = 1;
}

/* Matrix4.prototype.set = function (a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
{
	const el = this.elements;
	el[0] = a; el[1] = b; el[2] = c; el[3] = d;
	el[4] = e; el[5] = f; el[6] = g; el[7] = h;
	el[8] = i; el[9] = j; el[10] = k; el[11] = l;
	el[12] = m; el[13] = n; el[14] = o; el[15] = p;
} */

Matrix4.prototype.copy = function (otherMatrix)
{
	const el = this.elements;
	const oel = otherMatrix.elements;

	el[0] = oel[0];
	el[1] = oel[1];
	el[2] = oel[2];
	el[3] = oel[3];
	el[4] = oel[4];
	el[5] = oel[5];
	el[6] = oel[6];
	el[7] = oel[7];
	el[8] = oel[8];
	el[9] = oel[9];
	el[10] = oel[10];
	el[11] = oel[11];
	el[12] = oel[12];
	el[13] = oel[13];
	el[14] = oel[14];
	el[15] = oel[15];
}

Matrix4.prototype.transpose = function ()
{
	const el = this.elements;

	m00 = el[0]; m01 = el[1]; m02 = el[2]; m03 = el[3];
	m10 = el[4]; m11 = el[5]; m12 = el[6]; m13 = el[7];
	m20 = el[8]; m21 = el[9]; m22 = el[10]; m23 = el[11];
	m30 = el[12]; m31 = el[13]; m32 = el[14]; m33 = el[15];

	el[0] = m00; el[1] = m10; el[2] = m20; el[3] = m30;
	el[4] = m01; el[5] = m11; el[6] = m21; el[7] = m31;
	el[8] = m02; el[9] = m12; el[10] = m22; el[11] = m32;
	el[12] = m03; el[13] = m13; el[14] = m23; el[15] = m33;
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
	const el = this.elements;

	m00 = el[0]; m01 = el[1]; m02 = el[2]; m03 = el[3];
	m10 = el[4]; m11 = el[5]; m12 = el[6]; m13 = el[7];
	m20 = el[8]; m21 = el[9]; m22 = el[10]; m23 = el[11];
	m30 = el[12]; m31 = el[13]; m32 = el[14]; m33 = el[15];

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

	el[0] = d * t_0;
	el[1] = d * t_1;
	el[2] = d * t_2;
	el[3] = d * t_3;
	el[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
		(tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
	el[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
		(tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
	el[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
		(tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
	el[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
		(tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
	el[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
		(tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
	el[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
		(tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
	el[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
		(tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
	el[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
		(tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
	el[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
		(tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
	el[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
		(tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
	el[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
		(tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
	el[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
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
	const el = this.elements;
	const ael = MatrixA.elements;
	const bel = MatrixB.elements;
	a00 = ael[0]; a01 = ael[1]; a02 = ael[2]; a03 = ael[3];
	a10 = ael[4]; a11 = ael[5]; a12 = ael[6]; a13 = ael[7];
	a20 = ael[8]; a21 = ael[9]; a22 = ael[10]; a23 = ael[11];
	a30 = ael[12]; a31 = ael[13]; a32 = ael[14]; a33 = ael[15];

	b00 = bel[0]; b01 = bel[1]; b02 = bel[2]; b03 = bel[3];
	b10 = bel[4]; b11 = bel[5]; b12 = bel[6]; b13 = bel[7];
	b20 = bel[8]; b21 = bel[9]; b22 = bel[10]; b23 = bel[11];
	b30 = bel[12]; b31 = bel[13]; b32 = bel[14]; b33 = bel[15];

	el[0] = a00 * b00 + a10 * b01 + a20 * b02 + a30 * b03;
	el[1] = a01 * b00 + a11 * b01 + a21 * b02 + a31 * b03;
	el[2] = a02 * b00 + a12 * b01 + a22 * b02 + a32 * b03;
	el[3] = a03 * b00 + a13 * b01 + a23 * b02 + a33 * b03;
	el[4] = a00 * b10 + a10 * b11 + a20 * b12 + a30 * b13;
	el[5] = a01 * b10 + a11 * b11 + a21 * b12 + a31 * b13;
	el[6] = a02 * b10 + a12 * b11 + a22 * b12 + a32 * b13;
	el[7] = a03 * b10 + a13 * b11 + a23 * b12 + a33 * b13;
	el[8] = a00 * b20 + a10 * b21 + a20 * b22 + a30 * b23;
	el[9] = a01 * b20 + a11 * b21 + a21 * b22 + a31 * b23;
	el[10] = a02 * b20 + a12 * b21 + a22 * b22 + a32 * b23;
	el[11] = a03 * b20 + a13 * b21 + a23 * b22 + a33 * b23;
	el[12] = a00 * b30 + a10 * b31 + a20 * b32 + a30 * b33;
	el[13] = a01 * b30 + a11 * b31 + a21 * b32 + a31 * b33;
	el[14] = a02 * b30 + a12 * b31 + a22 * b32 + a32 * b33;
	el[15] = a03 * b30 + a13 * b31 + a23 * b32 + a33 * b33;
}

Matrix4.prototype.makeTranslation = function (v3)
{
	const el = this.elements;
	el[0] = 1; el[1] = 0; el[2] = 0; el[3] = 0;
	el[4] = 0; el[5] = 1; el[6] = 0; el[7] = 0;
	el[8] = 0; el[9] = 0; el[10] = 1; el[11] = 0;
	el[12] = v3.x; el[13] = v3.y; el[14] = v3.z; el[15] = 1;
}

let cos, sin;
Matrix4.prototype.makeRotationX = function (angleInRadians)
{
	const el = this.elements;
	cos = Math.cos(angleInRadians);
	sin = Math.sin(angleInRadians);

	el[0] = 1; el[1] = 0; el[2] = 0; el[3] = 0;
	el[4] = 0; el[5] = cos; el[6] = sin; el[7] = 0;
	el[8] = 0; el[9] = -sin; el[10] = cos; el[11] = 0;
	el[12] = 0; el[13] = 0; el[14] = 0; el[15] = 1;
}

Matrix4.prototype.makeRotationY = function (angleInRadians)
{
	const el = this.elements;
	cos = Math.cos(angleInRadians);
	sin = Math.sin(angleInRadians);

	el[0] = cos; el[1] = 0; el[2] = -sin; el[3] = 0;
	el[4] = 0; el[5] = 1; el[6] = 0; el[7] = 0;
	el[8] = sin; el[9] = 0; el[10] = cos; el[11] = 0;
	el[12] = 0; el[13] = 0; el[14] = 0; el[15] = 1;
}

Matrix4.prototype.makeRotationZ = function (angleInRadians)
{
	const el = this.elements;
	cos = Math.cos(angleInRadians);
	sin = Math.sin(angleInRadians);

	el[0] = cos; el[1] = sin; el[2] = 0; el[3] = 0;
	el[4] = -sin; el[5] = cos; el[6] = 0; el[7] = 0;
	el[8] = 0; el[9] = 0; el[10] = 1; el[11] = 0;
	el[12] = 0; el[13] = 0; el[14] = 0; el[15] = 1;
}

Matrix4.prototype.makeScaling = function (x, y, z)
{
	const el = this.elements;
	el[0] = x; el[1] = 0; el[2] = 0; el[3] = 0;
	el[4] = 0; el[5] = y; el[6] = 0; el[7] = 0;
	el[8] = 0; el[9] = 0; el[10] = z; el[11] = 0;
	el[12] = 0; el[13] = 0; el[14] = 0; el[15] = 1;
}

Matrix4.prototype.makeShearing = function (XbyY, XbyZ, YbyX, YbyZ, ZbyX, ZbyY)
{
	const el = this.elements;
	el[0] = 1; el[1] = YbyX; el[2] = ZbyX; el[3] = 0;
	el[4] = XbyY; el[5] = 1; el[6] = ZbyY; el[7] = 0;
	el[8] = XbyZ; el[9] = YbyZ; el[10] = 1; el[11] = 0;
	el[12] = 0; el[13] = 0; el[14] = 0; el[15] = 1;
}

let xAxis = new Vec3();
let yAxis = new Vec3();
let zAxis = new Vec3();

Matrix4.prototype.makeLookAt = function (v3_eyePos, v3_target)
{
	const el = this.elements;

	zAxis.copy(v3_target);
	zAxis.subtract(v3_eyePos);
	zAxis.normalize();

	xAxis.crossVectors(worldUp, zAxis);
	xAxis.normalize();

	yAxis.crossVectors(zAxis, xAxis);
	yAxis.normalize();

	el[0] = xAxis.x; el[1] = xAxis.y; el[2] = xAxis.z; el[3] = 0;
	el[4] = yAxis.x; el[5] = yAxis.y; el[6] = yAxis.z; el[7] = 0;
	el[8] = zAxis.x; el[9] = zAxis.y; el[10] = zAxis.z; el[11] = 0;
	el[12] = v3_eyePos.x; el[13] = v3_eyePos.y; el[14] = v3_eyePos.z; el[15] = 1;
}


let vx, vy, vz;

Vec3.prototype.transformPoint = function (m4_Matrix)
{
	const el = m4_Matrix.elements;
	vx = this.x;
	vy = this.y;
	vz = this.z;

	d = vx * el[3] + vy * el[7] + vz * el[11] + el[15];

	this.x = (vx * el[0] + vy * el[4] + vz * el[8] + el[12]) / d;
	this.y = (vx * el[1] + vy * el[5] + vz * el[9] + el[13]) / d;
	this.z = (vx * el[2] + vy * el[6] + vz * el[10] + el[14]) / d;
}

Vec3.prototype.transformDirection = function (m4_Matrix)
{
	const el = m4_Matrix.elements;
	vx = this.x;
	vy = this.y;
	vz = this.z;

	this.x = vx * el[0] + vy * el[4] + vz * el[8];
	this.y = vx * el[1] + vy * el[5] + vz * el[9];
	this.z = vx * el[2] + vy * el[6] + vz * el[10];
}

Vec3.prototype.transformNormalByMatInverse = function (m4_MatInverse)
{
	const el = m4_MatInverse.elements;
	vx = this.x;
	vy = this.y;
	vz = this.z;

	this.x = vx * el[0] + vy * el[1] + vz * el[2];
	this.y = vx * el[4] + vy * el[5] + vz * el[6];
	this.z = vx * el[8] + vy * el[9] + vz * el[10];
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
	cosTheta = 1 - Math.max(0, -rayDir.dot(normal));
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

	hitPoint.getPointAlongRay(rayO, rayD, t);

	if (t > 0 && Math.abs(rectangleOrigin.x - hitPoint.x) < radiusU &&
		Math.abs(rectangleOrigin.z - hitPoint.z) < radiusV)
	{
		return t;
	}

	return Infinity;
}

let inverseDir = new Vec3();
let near = new Vec3();
let far = new Vec3();
let tmin = new Vec3();
let tmax = new Vec3();

function intersectBox(minCorner, maxCorner, rayO, rayD, normal)
{
	inverseDir.set(1 / rayD.x, 1 / rayD.y, 1 / rayD.z);
	near.copy(minCorner);
	near.subtract(rayO);
	near.multiplyColor(inverseDir);
	far.copy(maxCorner);
	far.subtract(rayO);
	far.multiplyColor(inverseDir);
	tmin.set(Math.min(near.x, far.x), Math.min(near.y, far.y), Math.min(near.z, far.z));
	tmax.set(Math.max(near.x, far.x), Math.max(near.y, far.y), Math.max(near.z, far.z));
	t0 = Math.max( Math.max(tmin.x, tmin.y), tmin.z);
	t1 = Math.min( Math.min(tmax.x, tmax.y), tmax.z);
	if (t0 > t1) 
		return Infinity;
	let eps = 0.00001;

	if (t0 > 0.0) // if we are outside the box
	{
		hitPoint.getPointAlongRay(rayO, rayD, t0);
		normal.set(1,0,0);
		     if (Math.abs(hitPoint.x - maxCorner.x) < eps) normal.set(1, 0, 0);
		else if (Math.abs(hitPoint.y - maxCorner.y) < eps) normal.set(0, 1, 0);
		else if (Math.abs(hitPoint.z - maxCorner.z) < eps) normal.set(0, 0, 1);
		else if (Math.abs(hitPoint.x - minCorner.x) < eps) normal.set(-1, 0, 0);
		else if (Math.abs(hitPoint.y - minCorner.y) < eps) normal.set(0, -1, 0);
		else if (Math.abs(hitPoint.z - minCorner.z) < eps) normal.set(0, 0, -1);
		
		return t0;
	}
	if (t1 > 0.0) // if we are inside the box
	{
		hitPoint.getPointAlongRay(rayO, rayD, t1);
		normal.set(1,0,0);
		     if (Math.abs(hitPoint.x - maxCorner.x) < eps) normal.set(1, 0, 0);
		else if (Math.abs(hitPoint.y - maxCorner.y) < eps) normal.set(0, 1, 0);
		else if (Math.abs(hitPoint.z - maxCorner.z) < eps) normal.set(0, 0, 1);
		else if (Math.abs(hitPoint.x - minCorner.x) < eps) normal.set(-1, 0, 0);
		else if (Math.abs(hitPoint.y - minCorner.y) < eps) normal.set(0, -1, 0);
		else if (Math.abs(hitPoint.z - minCorner.z) < eps) normal.set(0, 0, -1);

		return t1;
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

function intersectSphere(radius, position, rayO, rayD, normal)
{
	L.copy(rayO);
	L.subtract(position);
	// Sphere implicit equation
	// X^2 + Y^2 + Z^2 - r^2 = 0
	a = rayD.dot(rayD);
	b = 2 * rayD.dot(L);
	c = L.dot(L) - (radius * radius);

	if (solveQuadratic(a, b, c) == false)
	{
		return Infinity;
	}

	if (t0 > 0)
	{
		normal.getPointAlongRay(rayO, rayD, t0);
		normal.subtract(position);
		// if (normal.dot(rayD) > 0)
		// 	normal.multiplyScalar(-1);
		return t0;
	}
	if (t1 > 0)
	{
		normal.getPointAlongRay(rayO, rayD, t1);
		normal.subtract(position);
		// if (normal.dot(rayD) > 0)
		// 	normal.multiplyScalar(-1);
		return t1;
	}

	return Infinity;
}

function intersectUnitSphere(rayO, rayD, normal)
{
	// Unit Sphere implicit equation
	// X^2 + Y^2 + Z^2 - 1 = 0
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
		normal.getPointAlongRay(rayO, rayD, t0);
		return t0;
	}
	if (t1 > 0)
	{
		normal.getPointAlongRay(rayO, rayD, t1);
		return t1;
	}

	return Infinity;
}

function intersectCylinder(widthRadius, heightRadius, position, rayO, rayD, normal)
{
	L.copy(rayO);
	L.subtract(position);
	// Cylinder implicit equation
	// X^2 + Z^2 - r^2 = 0
	a = (rayD.x * rayD.x) + (rayD.z * rayD.z);
	b = 2 * ((rayD.x * L.x) + (rayD.z * L.z));
	c = (L.x * L.x) + (L.z * L.z) - (widthRadius * widthRadius);

	if (solveQuadratic(a, b, c) == false)
	{
		return Infinity;
	}

	hitPoint.getPointAlongRay(rayO, rayD, t0);
	if (t0 > 0 && hitPoint.y > (position.y - heightRadius) && hitPoint.y < (position.y + heightRadius))
	{
		hitPoint.subtract(position);
		normal.set(hitPoint.x, 0, hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t0;
	}

	hitPoint.getPointAlongRay(rayO, rayD, t1);
	if (t1 > 0 && hitPoint.y > (position.y - heightRadius) && hitPoint.y < (position.y + heightRadius))
	{
		hitPoint.subtract(position);
		normal.set(hitPoint.x, 0, hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t1;
	}

	return Infinity;
}

function intersectCone(heightRadius, position, rayO, rayD, normal)
{
	L.copy(rayO);
	L.subtract(position);
	L.y -= heightRadius;// this chops off the top half of the standard double-cone shape
	k = 3;// this will shrink the X and Z components of the cone, so that its opening has unit radius of 1
	// Cone implicit equation
	// X^2 - Y^2 + Z^2 = 0
	a = k * (rayD.x * rayD.x) - (rayD.y * rayD.y) + k * (rayD.z * rayD.z);
	b = 2 * (k * (rayD.x * L.x) - (rayD.y * L.y) + k * (rayD.z * L.z));
	c = k * (L.x * L.x) - (L.y * L.y) + k * (L.z * L.z);

	if (solveQuadratic(a, b, c) == false)
	{
		return Infinity;
	}

	hitPoint.getPointAlongRay(rayO, rayD, t0);
	if (t0 > 0 && hitPoint.y > (position.y - heightRadius) && hitPoint.y < (position.y + heightRadius))
	{
		hitPoint.subtract(position);
		hitPoint.y -= heightRadius;
		normal.set(k * hitPoint.x, -hitPoint.y, k * hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t0;
	}

	hitPoint.getPointAlongRay(rayO, rayD, t1);
	if (t1 > 0 && hitPoint.y > (position.y - heightRadius) && hitPoint.y < (position.y + heightRadius))
	{
		hitPoint.subtract(position);
		hitPoint.y -= heightRadius;
		normal.set(k * hitPoint.x, -hitPoint.y, k * hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t1;
	}

	return Infinity;
}

function intersectParaboloid(heightRadius, position, rayO, rayD, normal)
{
	L.copy(rayO);
	L.subtract(position);
	L.y += heightRadius;// this moves the paraboloid down so that its 
	// position(origin) is at its own center of gravity (rather than at the bottom apex)
	k = 1.5;// this will shrink the X and Z components of the paraboloid, so that its opening has unit radius of 1
	// Paraboloid implicit equation
	// X^2 - Y + Z^2 = 0
	a = k * (rayD.x * rayD.x) + k * (rayD.z * rayD.z);
	b = 2 * (k * (rayD.x * L.x) + k * (rayD.z * L.z)) - rayD.y;
	c = k * (L.x * L.x) - L.y + k * (L.z * L.z);

	if (solveQuadratic(a, b, c) == false)
	{
		return Infinity;
	}
	
	hitPoint.getPointAlongRay(rayO, rayD, t0);
	if (t0 > 0 && hitPoint.y < (position.y + heightRadius))
	{
		hitPoint.subtract(position);
		normal.set(k * 2 * hitPoint.x, -1, k * 2 * hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t0;
	}

	hitPoint.getPointAlongRay(rayO, rayD, t1);
	if (t1 > 0 && hitPoint.y < (position.y + heightRadius))
	{
		hitPoint.subtract(position);
		normal.set(k * 2 * hitPoint.x, -1, k * 2 * hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t1;
	}

	return Infinity;
}

function intersectHyperboloid(innerRadius, heightRadius, position, rayO, rayD, normal)
{
	L.copy(rayO);
	L.subtract(position);
	// Hyperboloid (1 sheet) implicit equation
	// X^2 - Y^2 + Z^2 - r^2 = 0
	// Hyperboloid (2 sheets) implicit equation
	// X^2 - Y^2 + Z^2 + r^2 = 0
	a = (rayD.x * rayD.x) - (rayD.y * rayD.y) + (rayD.z * rayD.z);
	b = 2 * ((rayD.x * L.x) - (rayD.y * L.y) + (rayD.z * L.z));
	c = (L.x * L.x) - (L.y * L.y) + (L.z * L.z) - (innerRadius * innerRadius); // (1 sheet)
	//c = (L.x * L.x) - (L.y * L.y) + (L.z * L.z) + (innerRadius * innerRadius); // (2 sheets)

	if (solveQuadratic(a, b, c) == false)
	{
		return Infinity;
	}

	hitPoint.getPointAlongRay(rayO, rayD, t0);
	if (t0 > 0 && hitPoint.y > (position.y - heightRadius) && hitPoint.y < (position.y + heightRadius))
	{
		hitPoint.subtract(position);
		normal.set(hitPoint.x, -hitPoint.y, hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t0;
	}

	hitPoint.getPointAlongRay(rayO, rayD, t1);
	if (t1 > 0 && hitPoint.y > (position.y - heightRadius) && hitPoint.y < (position.y + heightRadius))
	{
		hitPoint.subtract(position);
		normal.set(hitPoint.x, -hitPoint.y, hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t1;
	}

	return Infinity;
}

function intersectHyperbolicParaboloid(radius, position, rayO, rayD, normal)
{
	L.copy(rayO);
	L.subtract(position);
	k = 1 / radius;// this scales up the unit HyperbolicParaboloid(radius=1) by the supplied radius
	// Hyperbolic Paraboloid implicit equation
	// X^2 - Y - Z^2 = 0
	a = k * ((rayD.x * rayD.x) - (rayD.z * rayD.z));
	b = k * 2 * ((rayD.x * L.x) - (rayD.z * L.z)) - rayD.y;
	c = k * ((L.x * L.x) - (L.z * L.z)) - L.y;

	if (solveQuadratic(a, b, c) == false)
	{
		return Infinity;
	}
	
	hitPoint.getPointAlongRay(rayO, rayD, t0);
	if (t0 > 0 && hitPoint.x < (position.x + radius) && hitPoint.x > (position.x - radius) &&
		hitPoint.z < (position.z + radius) && hitPoint.z > (position.z - radius))
	{
		hitPoint.subtract(position);
		normal.set(2 * hitPoint.x, -1 * radius, -2 * hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t0;
	}

	hitPoint.getPointAlongRay(rayO, rayD, t1);
	if (t1 > 0 && hitPoint.x < (position.x + radius) && hitPoint.x > (position.x - radius) &&
		hitPoint.z < (position.z + radius) && hitPoint.z > (position.z - radius))
	{
		hitPoint.subtract(position);
		normal.set(2 * hitPoint.x, -1 * radius, -2 * hitPoint.z);
		if (normal.dot(rayD) > 0)
			normal.multiplyScalar(-1);
		return t1;
	}

	return Infinity;
}

let theta = 0;
let phi = 0;
let normalizedPoint = new Vec3();

function calcSphereUV(pointOnSphere, sphereRadius, spherePosition)
{
	normalizedPoint.copy(pointOnSphere);
	normalizedPoint.subtract(spherePosition);
	normalizedPoint.multiplyScalar(1 / sphereRadius);

	phi = Math.atan2(-normalizedPoint.z, normalizedPoint.x);
	theta = Math.acos(normalizedPoint.y);
	U = phi * ONE_OVER_TWO_PI + 0.5;
	V = theta * ONE_OVER_PI;
}

function calcRectangleUV(pointOnRectangle, rectRadiusU, rectRadiusV, rectPosition)
{
	normalizedPoint.copy(pointOnRectangle);
	normalizedPoint.subtract(rectPosition);
	normalizedPoint.x /= (rectRadiusU * 2);
	// use Z component instead of Y, because this rect is in the X-Z plane
	normalizedPoint.z /= (rectRadiusV * 2);
	U = normalizedPoint.x + 0.5;
	V = normalizedPoint.z + 0.5;
}

function calcCylinderUV(pointOnCylinder, cylinderHeightRadius, cylinderPosition)
{
	normalizedPoint.copy(pointOnCylinder);
	normalizedPoint.subtract(cylinderPosition);
	// must compute theta before normalizing the intersection point
	theta = normalizedPoint.y / (cylinderHeightRadius * 2);
	normalizedPoint.normalize();
	phi = Math.atan2(-normalizedPoint.z, normalizedPoint.x);
	U = phi * ONE_OVER_TWO_PI + 0.5;
	V = -theta + 0.5; // -theta flips upside-down texture images
}

let hitPoint = new Vec3();
let normal = new Vec3();
let tempVec = new Vec3();
let U = 0;
let V = 0;
let W = 0;

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
