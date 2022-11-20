let canvas = document.getElementById("myCanvas");
let context = canvas.getContext("2d");

let debugInfo = document.getElementById("debugInfo");

let userText = document.getElementById("userText");

let canvasX = 0;
let canvasY = 0;
let pixelX = 0;
let pixelY = 0;
let startTime = 0;
let endTime = 0;
let renderTime = 0;

const MAX_SAMPLE_COUNT = 20;
let sampleCount = 0;

let aspectRatio = 1;
let FOV = 60;
let thetaFOV = FOV * 0.5 * (Math.PI / 180);
let vLen = 1; // height scale
let uLen = 1; // width scale

let colorHistoryArrayLength = 0;
let pixelsColorHistory = [];



window.addEventListener("resize", handleWindowResize)
function handleWindowResize()
{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	aspectRatio = canvas.width / canvas.height;
	vLen = Math.tan(thetaFOV); // height scale
	uLen = vLen * aspectRatio; // width scale

	pixelsColorHistory = [];
	colorHistoryArrayLength = canvas.width * canvas.height * 3;

	for (let index = 0; index < colorHistoryArrayLength; index++)
	{
		pixelsColorHistory[index] = 0;
	}

	if (sampleCount == MAX_SAMPLE_COUNT)
	{
		sampleCount = 0; // reset sampleCount to start a fresh progressive render
		animate(); // also need to restart requestAnimationFrame
	}
	else
		sampleCount = 0; // reset sampleCount to start a fresh progressive render

	// startTime = performance.now();
	// draw();
	// endTime = performance.now();
	// renderTime = (endTime - startTime) * 0.001;

	debugInfo.innerHTML = "canvasW: " + canvas.width + " canvasH: " + canvas.height + "<br>" +
		"Total pixels: " + canvas.width * canvas.height;

	userText.innerHTML = "render time: " + renderTime.toFixed(1) + " seconds";
}

/* function draw()
{
	// 1st pixel in middle of canvas
	// context.fillStyle = "rgb(255,255,255)";
	// context.fillRect(canvas.width / 2, canvas.height / 2, 1, 1);


	// 'row' numbers start at the top of the webpage ( ,0)
	// and go all the way down to the bottom of webpage ( ,canvas.height)
	// As row increases, it moves down 1 row (1 pixel) on each loop iteration
	for (let row = 0; row < canvas.height; row++)
	{
		// 'column' numbers start at the left side of webpage (0, ) 
		// and go all the way to the right side of webpage (canvas.width, )
		// As column increases, it moves right 1 column (1 pixel) on each loop iteration 
		for (let column = 0; column < canvas.width; column++)
		{
			// make both canvasX & canvasY in the range of: 0 to 1
			canvasX = column / (canvas.width - 1);
			canvasY = row / (canvas.height - 1);

			// put both pixelX & pixelY in the range of: -1 to +1
			pixelX = 2 * canvasX - 1;
			pixelY = 2 * canvasY - 1;
			pixelY *= -1;

			// put back in range: 0 to 1, for valid colors showing pixel coordinates
			//pixelX = pixelX * 0.5 + 0.5;
			//pixelY = pixelY * 0.5 + 0.5;

			//r = canvasX * 255;
			r = Math.random() * 256;
			r = Math.floor(r);
			
			//g = canvasY * 255;
			g = Math.random() * 256;
			g = Math.floor(g);
			
			//b = canvasX * 255;
			b = Math.random() * 256;
			b = Math.floor(b);

			context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
			context.fillRect(column, row, 1, 1);

			if (row == 0) // top row only
			{
				// runs every pixel column from left to right, but just for the very first row at the top of screen -
				// starts at top left corner of webpage and goes all the way to right top corner, then stops (a horizontal line)
				///console.log(" 1st row -> r:" + r + " g:" + g + " b:" + b);
			}
		}
		// runs at the end of each row, at the very last pixel column on right side of webpage,
		// starting at top right corner of screen, and continuing straight down to right bottom corner of screen (a vertical line)
		///console.log("last column -> r:" + r + " g:" + g + " b:" + b);
	}
} */

let skyColor = new Vec3(0.2, 0.7, 1.0);
skyColor.multiplyScalar(2);
let sunColor = new Vec3(1, 1, 1);
let sunPower = 4;
sunColor.multiplyScalar(sunPower);
let directionToSun = new Vec3(-1, 0.7, 0.4);
directionToSun.normalize();
let diffuseFalloff = 0;
let cameraPosition = new Vec3(0, 4, 0);
let cameraTarget = new Vec3(0, 4, -1);
let canvasOffsetZFromCamera = -1;
let pixelPosition = new Vec3();
let canvasPositionOffset = new Vec3();
let rayOrigin = new Vec3();
let rayDirection = new Vec3();
let rightVector = new Vec3();
let upVector = new Vec3();
let pixelColor = new Vec3();
let colorPlusOne = new Vec3();
let inverseColor = new Vec3();
let rayTracedColor = new Vec3();
let rayColorMask = new Vec3();
let reflectionRayColorMask = new Vec3();
let isShadowRay = false;
let willNeedReflectionRay = false;

let groundRectangleOrigin = new Vec3(0, 0, 0);
let groundRectangleNormal = new Vec3(0, 1, 0);
groundRectangleNormal.normalize();
let groundRectRadiusU = 100;
let groundRectRadiusV = 100;
let checkerboardColor1 = new Vec3(0.4, 0.4, 0.4);//Vec3(0.5, 0.01, 0.01);
let checkerboardColor2 = new Vec3(0.05, 0.05, 0.05);//Vec3(0.8, 0.8, 0.01);

let checkerSphereRadius = 3.5;
let checkerSpherePosition = new Vec3(0, checkerSphereRadius, -15);

let diffuseSphereRadius = 2;
let diffuseSpherePosition = new Vec3(-8, diffuseSphereRadius, -10);

let metalSphereRadius = 3;
let metalSpherePosition = new Vec3(-8, metalSphereRadius, -18);

let coatSphereRadius = 2.5;
let coatSpherePosition = new Vec3(8, coatSphereRadius, -15);


let testT = Infinity;
let hitPoint = new Vec3();
let tempVec = new Vec3();
let U = 0;
let V = 0;
let textureScaleU = 1;
let textureScaleV = 1;
let imgTextureIndex = 0;

function intersectScene()
{
	// clear HitRecord.nearestT 
	HitRecord.nearestT = Infinity;

	testT = intersectRectangle(groundRectangleOrigin, groundRectangleNormal, 
			groundRectRadiusU, groundRectRadiusV, rayOrigin, rayDirection);
	if (testT < HitRecord.nearestT)
	{
		HitRecord.nearestT = testT;
		HitRecord.type = CLEARCOAT_DIFFUSE;
		tempVec.copy(rayDirection);
		tempVec.multiplyScalar(HitRecord.nearestT);
		hitPoint.copy(rayOrigin);
		hitPoint.add(tempVec);
		/* U = Math.floor(hitPoint.x * 0.4);
		V = Math.floor(hitPoint.z * 0.4);
		if ((U + V) % 2 == 0)
			HitRecord.color.copy(checkerboardColor1);
		else
			HitRecord.color.copy(checkerboardColor2); */

		textureScaleU = 10;
		textureScaleV = 10;
		calcRectangleUV(hitPoint, groundRectRadiusU, groundRectRadiusV, groundRectangleOrigin);
		U *= img.width;
		U = Math.floor(U * textureScaleU) % img.width;
		
		V *= img.height;
		V = Math.floor(V * textureScaleV) % img.height;

		imgTextureIndex = (V * img.width + U) * 4;
		HitRecord.color.set(textureImageData.data[imgTextureIndex + 0] / 255,
			textureImageData.data[imgTextureIndex + 1] / 255,
			textureImageData.data[imgTextureIndex + 2] / 255);
		HitRecord.color.x = Math.pow(HitRecord.color.x, 2.2);
		HitRecord.color.y = Math.pow(HitRecord.color.y, 2.2);
		HitRecord.color.z = Math.pow(HitRecord.color.z, 2.2);

		HitRecord.normal.copy(groundRectangleNormal);
	}

	testT = intersectSphere(checkerSphereRadius, checkerSpherePosition, rayOrigin, rayDirection);
	if (testT < HitRecord.nearestT)
	{
		HitRecord.nearestT = testT;
		HitRecord.type = CLEARCOAT_DIFFUSE;

		tempVec.copy(rayDirection);
		tempVec.multiplyScalar(HitRecord.nearestT);
		hitPoint.copy(rayOrigin);
		hitPoint.add(tempVec);
		calcSphereUV(hitPoint, checkerSphereRadius, checkerSpherePosition);
		/* U = Math.floor(U * 12);
		V = Math.floor(V * 6);
		if ((U + V) % 2 == 0)
			HitRecord.color.set(0.8, 0.8, 0.8);
		else
			HitRecord.color.set(0.5, 0, 0); */
		textureScaleU = 1;
		textureScaleV = 1;
		U *= img.width;
		U = Math.floor(U * textureScaleU * 2) % img.width;
		
		V *= img.height;
		V = Math.floor(V * textureScaleV) % img.height;

		imgTextureIndex = (V * img.width + U) * 4;
		HitRecord.color.set(textureImageData.data[imgTextureIndex + 0] / 255,
			textureImageData.data[imgTextureIndex + 1] / 255,
			textureImageData.data[imgTextureIndex + 2] / 255);
		HitRecord.color.x = Math.pow(HitRecord.color.x, 2.2);
		HitRecord.color.y = Math.pow(HitRecord.color.y, 2.2);
		HitRecord.color.z = Math.pow(HitRecord.color.z, 2.2);

		HitRecord.normal.copy(hitPoint);
		HitRecord.normal.subtract(checkerSpherePosition);
	}

	testT = intersectSphere(diffuseSphereRadius, diffuseSpherePosition, rayOrigin, rayDirection);
	if (testT < HitRecord.nearestT)
	{
		HitRecord.nearestT = testT;
		HitRecord.type = DIFFUSE;
		HitRecord.color.set(0.7, 0.01, 0.01);
		tempVec.copy(rayDirection);
		tempVec.multiplyScalar(HitRecord.nearestT);
		hitPoint.copy(rayOrigin);
		hitPoint.add(tempVec);
		HitRecord.normal.copy(hitPoint);
		HitRecord.normal.subtract(diffuseSpherePosition);
	}

	testT = intersectSphere(metalSphereRadius, metalSpherePosition, rayOrigin, rayDirection);
	if (testT < HitRecord.nearestT)
	{
		HitRecord.nearestT = testT;
		HitRecord.type = METAL;
		HitRecord.color.set(0.7, 0.7, 0.7);//(0.955008, 0.637427, 0.538163);
		tempVec.copy(rayDirection);
		tempVec.multiplyScalar(HitRecord.nearestT);
		hitPoint.copy(rayOrigin);
		hitPoint.add(tempVec);
		HitRecord.normal.copy(hitPoint);
		HitRecord.normal.subtract(metalSpherePosition);
	}

	testT = intersectSphere(coatSphereRadius, coatSpherePosition, rayOrigin, rayDirection);
	if (testT < HitRecord.nearestT)
	{
		HitRecord.nearestT = testT;
		HitRecord.type = CLEARCOAT_DIFFUSE;
		HitRecord.color.set(0.01, 0.01, 0.8);
		tempVec.copy(rayDirection);
		tempVec.multiplyScalar(HitRecord.nearestT);
		hitPoint.copy(rayOrigin);
		hitPoint.add(tempVec);
		HitRecord.normal.copy(hitPoint);
		HitRecord.normal.subtract(coatSpherePosition);
	}

	return HitRecord.nearestT;
} // end function intersectScene()


let ambientColor = new Vec3();
let diffuseColor = new Vec3();
let specularColor = new Vec3(1, 1, 1);
let tempColor = new Vec3();
let reflectionRayOrigin = new Vec3();
let reflectionRayDirection = new Vec3();
let isReflectionTime = false;
let fresnelReflectance = 0;
let fresnelTransparency = 0;
let whiteColor = new Vec3(1, 1, 1);

function rayTrace()
{
	rayTracedColor.set(0, 0, 0);
	ambientColor.set(0, 0, 0);
	diffuseColor.set(0, 0, 0);
	specularColor.set(1, 1, 1);
	rayColorMask.set(1, 1, 1);
	specularFalloff = 0;
	diffuseFalloff = 0;

	isShadowRay = false;
	willNeedReflectionRay = false;
	isReflectionTime = false;
	previousIntersectionWasMetal = false;

	for (let bounces = 0; bounces < 6; bounces++)
	{
		// handles when the ray doesn't hit anything / hits the background or sky
		if (intersectScene() == Infinity)
		{
			if (isShadowRay)
			{
				// ambient contribution
				ambientColor.copy(rayColorMask);
				ambientColor.multiplyScalar(0.1);
				// diffuse contribution
				diffuseColor.copy(rayColorMask);
				diffuseColor.multiplyColor(sunColor);
				diffuseColor.multiplyScalar(diffuseFalloff);
				// specular contribution
				specularColor.set(1, 1, 1);
				specularColor.multiplyColor(sunColor);
				specularColor.multiplyScalar(specularFalloff);

				rayTracedColor.add(ambientColor);
				rayTracedColor.add(diffuseColor);
				rayTracedColor.add(specularColor);
			}
			else // either camera ray or reflection ray hit the background/sky
			{
				tempColor.copy(rayColorMask);
				tempColor.multiplyColor(skyColor);
				rayTracedColor.add(tempColor);

				// specular contribution
				tempColor.copy(rayColorMask);
				tempColor.multiplyColor(sunColor);
				tempColor.multiplyScalar(specularFalloff);
				rayTracedColor.add(tempColor);
			}

			if (willNeedReflectionRay)
			{
				rayOrigin.copy(reflectionRayOrigin);
				rayDirection.copy(reflectionRayDirection);
				rayColorMask.copy(reflectionRayColorMask);
				willNeedReflectionRay = false;
				isShadowRay = false;
				isReflectionTime = true;
				continue;
			}

			break;
		} // end if (intersectScene() == Infinity)


		// handles when a shadowRay hits another object before reaching the light or Infinity
		if (isShadowRay)
		{
			// ambient contribution
			ambientColor.copy(rayColorMask);
			ambientColor.multiplyScalar(0.1);

			rayTracedColor.add(ambientColor);

			if (willNeedReflectionRay)
			{
				rayOrigin.copy(reflectionRayOrigin);
				rayDirection.copy(reflectionRayDirection);
				rayColorMask.copy(reflectionRayColorMask);
				willNeedReflectionRay = false;
				isShadowRay = false;
				isReflectionTime = true;
				continue;
			}

			break;
		}

		// useful data
		HitRecord.normal.normalize();
		HitRecord.intersectionPoint.copy(rayOrigin);
		tempVec.copy(rayDirection);
		tempVec.multiplyScalar(HitRecord.nearestT);
		HitRecord.intersectionPoint.add(tempVec);


		if (HitRecord.type == DIFFUSE)
		{
			//fresnelReflectance = calcFresnelReflectance(0.02, rayDirection, HitRecord.normal);
			fresnelReflectance = rFresnel(rayDirection, HitRecord.normal, 1.0, 1.1);
			fresnelTransparency = 1 - fresnelReflectance;

			whiteColor.set(1, 1, 1);
			whiteColor.multiplyScalar(fresnelReflectance);
			HitRecord.color.multiplyScalar(fresnelTransparency);
			HitRecord.color.mix(HitRecord.color, whiteColor, fresnelReflectance);
			rayColorMask.multiplyColor(HitRecord.color);


			diffuseFalloff = HitRecord.normal.dot(directionToSun);
			specularFalloff = 0;

			rayDirection.copy(directionToSun);
			rayOrigin.copy(HitRecord.intersectionPoint);
			HitRecord.normal.multiplyScalar(0.0001);
			rayOrigin.add(HitRecord.normal);

			isShadowRay = true;
			continue;
		}
		else if (HitRecord.type == METAL)
		{
			//fresnelReflectance = calcFresnelReflectance(0.04, rayDirection, HitRecord.normal);
			fresnelReflectance = rFresnel(rayDirection, HitRecord.normal, 1.0, 2.0);
			fresnelTransparency = 1 - fresnelReflectance;

			whiteColor.set(1, 1, 1);
			//whiteColor.multiplyScalar(fresnelReflectance);
			// HitRecord.color.multiplyScalar(fresnelTransparency);
			HitRecord.color.mix(HitRecord.color, whiteColor, fresnelReflectance);
			rayColorMask.multiplyColor(HitRecord.color);

			diffuseFalloff = 0;
			// evaluate Blinn-Phong reflection model at this surface point
			specularFalloff = calcSpecularReflectance(rayDirection, directionToSun, HitRecord.normal, 1000);

			rayDirection.reflect(HitRecord.normal);
			rayOrigin.copy(HitRecord.intersectionPoint);
			HitRecord.normal.multiplyScalar(0.0001);
			rayOrigin.add(HitRecord.normal);

			isShadowRay = false;
			if (bounces == 0)
				previousIntersectionWasMetal = true;
			continue;
		}
		else if (HitRecord.type == CLEARCOAT_DIFFUSE)
		{
			//fresnelReflectance = calcFresnelReflectance(0.04, rayDirection, HitRecord.normal);
			fresnelReflectance = rFresnel(rayDirection, HitRecord.normal, 1.0, 1.5);
			fresnelTransparency = 1 - fresnelReflectance;

			if (bounces == 0 || previousIntersectionWasMetal)
			{
				reflectionRayColorMask.copy(rayColorMask);
				reflectionRayColorMask.multiplyScalar(fresnelReflectance);
				reflectionRayDirection.copy(rayDirection);
				reflectionRayDirection.reflect(HitRecord.normal);
			}

			HitRecord.color.multiplyScalar(fresnelTransparency);
			rayColorMask.multiplyColor(HitRecord.color);

			diffuseFalloff = HitRecord.normal.dot(directionToSun);
			// evaluate Blinn-Phong reflection model at this surface point
			specularFalloff = calcSpecularReflectance(rayDirection, directionToSun, HitRecord.normal, 1000);

			rayDirection.copy(directionToSun);
			rayOrigin.copy(HitRecord.intersectionPoint);
			HitRecord.normal.multiplyScalar(0.0001);
			rayOrigin.add(HitRecord.normal);

			if (bounces == 0 || previousIntersectionWasMetal)
			{
				reflectionRayOrigin.copy(rayOrigin);
				willNeedReflectionRay = true;
				previousIntersectionWasMetal = false;
			}

			isShadowRay = true;

			continue;
		}

	} // end for (let bounces = 0; bounces < 6; bounces++)

	return rayTracedColor;
} // end function rayTrace()


let pixelIndex = 0;
let tentFilterOffsetX = 0;
let tentFilterOffsetY = 0;

function tentFilter(x)
{
	if (x < 0.5)
		return Math.sqrt(2 * x) - 1;
	else
		return 1 - Math.sqrt(2 - (2 * x));
}

function draw()
{
	sampleCount++;

	setUpCameraFrame();

	for (let row = 0; row < canvas.height; row++)
	{
		for (let column = 0; column < canvas.width; column++)
		{
			tentFilterOffsetX = tentFilter(Math.random());
			tentFilterOffsetY = tentFilter(Math.random());
			canvasX = (column + tentFilterOffsetX) / canvas.width;
			canvasY = (row + tentFilterOffsetY) / canvas.height;

			canvasX = (canvasX * 2) - 1;
			canvasY = (canvasY * 2) - 1;
			canvasY *= -1;


			/* canvasPositionOffset.set(canvasX * uLen, canvasY * vLen, canvasOffsetZFromCamera);
			pixelPosition.copy(cameraPosition);
			pixelPosition.add(canvasPositionOffset);

			rayOrigin.copy(cameraPosition);
			rayDirection.copy(pixelPosition);
			rayDirection.subtract(cameraPosition);
			rayDirection.normalize(); */


			rayOrigin.copy(cameraPosition);

			rightVector.copy(cameraRight);
			rightVector.multiplyScalar(canvasX * uLen);
			upVector.copy(cameraUp);
			upVector.multiplyScalar(canvasY * vLen);

			rayDirection.copy(cameraForward);
			rayDirection.add(rightVector);
			rayDirection.add(upVector);
			rayDirection.normalize();


			pixelColor.copy(rayTrace());
			pixelIndex = (row * canvas.width) + column;
			pixelIndex *= 3;
			pixelsColorHistory[pixelIndex + 0] += pixelColor.x;
			pixelsColorHistory[pixelIndex + 1] += pixelColor.y;
			pixelsColorHistory[pixelIndex + 2] += pixelColor.z;

			pixelColor.set(pixelsColorHistory[pixelIndex + 0],
				pixelsColorHistory[pixelIndex + 1],
				pixelsColorHistory[pixelIndex + 2]);

			pixelColor.multiplyScalar(1 / sampleCount);

			// apply Reinhard tonemapping (brings unbounded linear color values into 0-1 range)
			colorPlusOne.set(pixelColor.x + 1, pixelColor.y + 1, pixelColor.z + 1);
			inverseColor.set(1 / colorPlusOne.x, 1 / colorPlusOne.y, 1 / colorPlusOne.z);
			pixelColor.multiplyColor(inverseColor);

			// do gamma correction
			pixelColor.set(Math.pow(pixelColor.x, 0.4545), Math.pow(pixelColor.y, 0.4545), Math.pow(pixelColor.z, 0.4545));
			//pixelColor.set(Math.sqrt(pixelColor.x), Math.sqrt(pixelColor.y), Math.sqrt(pixelColor.z));

			pixelColor.multiplyScalar(255);
			pixelColor.set(Math.floor(pixelColor.x), Math.floor(pixelColor.y), Math.floor(pixelColor.z));

			context.fillStyle = "rgb(" + pixelColor.x + "," + pixelColor.y + "," + pixelColor.z + ")";
			context.fillRect(column, row, 1, 1);
			/* if (row == 0)
			{
				//console.log(column + ", " + row);
				//console.log("canvasX: " + canvasX);
				console.log("rayDir.x: " + rayDirection.x + "rayDir.y: " + 
					rayDirection.y + "rayDir.z: " + rayDirection.z);
			} */

		}
		//console.log("g: " + g);
	}

} // end function draw()

// jumpstart getting canvas dimensions with a call to handleWindowResize()
handleWindowResize();

function animate() 
{
	draw();

	userText.innerHTML = "Samples: " + sampleCount + " / " + MAX_SAMPLE_COUNT;

	if (sampleCount < MAX_SAMPLE_COUNT)
		requestAnimationFrame(animate);
}

//animate();

const img = new Image();
img.crossOrigin = "anonymous";
img.src = "images/uvgrid1.png";

let offscreenCanvas = document.createElement("canvas");
let offscreenContext = offscreenCanvas.getContext("2d");

let textureImageData = null;

img.addEventListener("load", function ()
{
	offscreenCanvas.width = img.width;
	offscreenCanvas.height = img.height;
	offscreenContext.drawImage(img, 0, 0);
	textureImageData = offscreenContext.getImageData(0, 0, img.width, img.height);
	img.style.display = "none";

	animate();
});