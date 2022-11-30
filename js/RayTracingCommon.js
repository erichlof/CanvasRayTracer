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

Vec3.prototype.refract = function(surfaceNormal, eta)
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
