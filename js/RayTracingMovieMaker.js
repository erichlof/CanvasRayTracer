let canvas = document.getElementById("myCanvas");
let context = canvas.getContext("2d");

let debugInfo1 = document.getElementById("debugInfo1");
let debugInfo2 = document.getElementById("debugInfo2");

let userText = document.getElementById("userText");

let canvasX = 0;
let canvasY = 0;
let pixelX = 0;
let pixelY = 0;
let startTime = 0;
let endTime = 0;
let renderTime = 0;

const MAX_SAMPLE_COUNT = 10;
const MAX_ANIMATION_FRAMES = 2;
let sampleCount = 0;
let frameCount = 1;

canvas.width = 1280;//window.innerWidth;
canvas.height = 720;//window.innerHeight;

let aspectRatio = canvas.width / canvas.height;
let FOV = 60;
let thetaFOV = FOV * 0.5 * (Math.PI / 180);
let vLen = Math.tan(thetaFOV); // height scale
let uLen = vLen * aspectRatio; // width scale

let colorHistoryArrayLength = canvas.width * canvas.height * 3;
let pixelsColorHistory = [];
for (let index = 0; index < colorHistoryArrayLength; index++)
{
	pixelsColorHistory[index] = 0;
}


/* window.addEventListener("resize", handleWindowResize)
function handleWindowResize()
{
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	aspectRatio = canvas.width / canvas.height;
	vLen = Math.tan(thetaFOV); // height scale
	uLen = vLen * aspectRatio; // width scale

	cameraPosition.set(0, 4, 0);

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

	debugInfo1.innerHTML = "canvasW: " + canvas.width + " canvasH: " + canvas.height;

	debugInfo2.innerHTML = "total pixels: " + canvas.width * canvas.height;

	userText.innerHTML = "render time: " + renderTime.toFixed(1) + " seconds";

} */

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

let skyColor = new Vec3(0.6, 0.8, 1.0);
let sunColor = new Vec3(1, 1, 1);
let sunPower = 2;
sunColor.multiplyScalar(sunPower);
let directionToSun = new Vec3(-1, 0.7, 0.4);
directionToSun.normalize();
let lightFalloff = 0;
let cameraPosition = new Vec3(0, 4, 22);
let canvasDistanceFromCamera = -1;
let pixelPosition = new Vec3();
let canvasPositionOffset = new Vec3();
let rayOrigin = new Vec3();
let rayDirection = new Vec3();
let pixelColor = new Vec3();
let rayTracedColor = new Vec3();
let rayColorMask = new Vec3();
let isShadowRay = false;

let groundPlaneOrigin = new Vec3(0, 0, 0);
let groundPlaneNormal = new Vec3(0, 1, 0);
groundPlaneNormal.normalize();

let whiteSphereRadius = 3.5;
let whiteSpherePosition = new Vec3(0, whiteSphereRadius, -10);


let testT = Infinity;
let hitPoint = new Vec3();
let tempVec = new Vec3();


function intersectScene()
{
	// clear HitRecord 
	HitRecord.nearestT = Infinity;
	HitRecord.type = -100;

	testT = intersectPlane(groundPlaneOrigin, groundPlaneNormal, rayOrigin, rayDirection);
	if (testT < HitRecord.nearestT)
	{
		HitRecord.nearestT = testT;
		HitRecord.type = DIFFUSE;
		tempVec.copy(rayDirection);
		tempVec.multiplyScalar(HitRecord.nearestT);
		hitPoint.copy(rayOrigin);
		hitPoint.add(tempVec);
		if ((Math.floor(hitPoint.x * 0.4) + Math.floor(hitPoint.z * 0.4)) % 2 == 0)
			HitRecord.color.set(1.0, 0.01, 0.01);
		else
			HitRecord.color.set(1.0, 1.0, 0.01);
		//HitRecord.color.set(0.6, 0.1, 0.01);
		HitRecord.normal.copy(groundPlaneNormal);
	}

	testT = intersectSphere(whiteSphereRadius, whiteSpherePosition, rayOrigin, rayDirection);
	if (testT < HitRecord.nearestT)
	{
		HitRecord.nearestT = testT;
		HitRecord.type = METAL;
		HitRecord.color.set(0.9, 0.9, 0.9);
		tempVec.copy(rayDirection);
		tempVec.multiplyScalar(HitRecord.nearestT);
		hitPoint.copy(rayOrigin);
		hitPoint.add(tempVec);
		HitRecord.normal.copy(hitPoint);
		HitRecord.normal.subtract(whiteSpherePosition);
	}

	return HitRecord.nearestT;
} // end function intersectScene()



function rayTrace()
{
	rayTracedColor.set(0, 0, 0);
	rayColorMask.set(1, 1, 1);
	isShadowRay = false;

	for (let bounces = 0; bounces < 3; bounces++)
	{
		if (intersectScene() == Infinity)
		{
			if (isShadowRay)
			{
				rayTracedColor.copy(rayColorMask);
				rayTracedColor.multiplyColor(sunColor);
				lightFalloff = HitRecord.normal.dot(directionToSun);
				rayTracedColor.multiplyScalar(Math.max(0, lightFalloff));
			}
			else
			{
				rayTracedColor.copy(rayColorMask);
				rayTracedColor.multiplyColor(skyColor);
			}

			break;
		}

		if (isShadowRay)
		{
			rayColorMask.multiplyScalar(0.3);
			rayTracedColor.copy(rayColorMask);
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
			rayColorMask.multiplyColor(HitRecord.color);

			rayOrigin.copy(HitRecord.intersectionPoint);
			tempVec.copy(HitRecord.normal);
			tempVec.multiplyScalar(0.0001);
			rayOrigin.add(tempVec);
			rayDirection.copy(directionToSun);
			isShadowRay = true;
			continue;
		}
		else if (HitRecord.type == METAL)
		{
			rayColorMask.multiplyColor(HitRecord.color)

			rayOrigin.copy(HitRecord.intersectionPoint);
			tempVec.copy(HitRecord.normal);
			tempVec.multiplyScalar(0.0001);
			rayOrigin.add(tempVec);
			rayDirection.reflect(HitRecord.normal);
			//rayDirection.normalize();
			isShadowRay = false;
			continue;
		}

	} // end for (let bounces = 0; bounces < 3; bounces++)


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

	for (let row = 0; row < canvas.height; row++)
	{
		for (let column = 0; column < canvas.width; column++)
		{
			tentFilterOffsetX = tentFilter(Math.random());
			tentFilterOffsetY = tentFilter(Math.random());
			canvasX = (column + tentFilterOffsetX) / (canvas.width - 1);
			canvasY = (row + tentFilterOffsetY) / (canvas.height - 1);

			canvasX = (canvasX * 2) - 1;
			canvasY = (canvasY * 2) - 1;
			canvasY *= -1;

			//canvasX *= aspectRatio;

			canvasPositionOffset.set(canvasX * uLen, canvasY * vLen, canvasDistanceFromCamera);
			pixelPosition.copy(cameraPosition);
			pixelPosition.add(canvasPositionOffset);

			rayOrigin.copy(cameraPosition);
			rayDirection.copy(pixelPosition);
			rayDirection.subtract(cameraPosition);
			rayDirection.normalize();

			pixelColor.set(0, 0, 0);

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

			pixelColor.x *= 255;
			pixelColor.x = Math.floor(pixelColor.x);
			pixelColor.x = Math.min(pixelColor.x, 255);

			pixelColor.y *= 255;
			pixelColor.y = Math.floor(pixelColor.y);
			pixelColor.y = Math.min(pixelColor.y, 255);

			pixelColor.z *= 255;
			pixelColor.z = Math.floor(pixelColor.z);
			pixelColor.z = Math.min(pixelColor.z, 255);

			// g = Math.abs(rayDirection.y) * 255;
			// g = Math.floor(g);

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
//handleWindowResize();

let tmpLink = document.createElement('a');
document.body.appendChild(tmpLink);

function animate() 
{
	draw();

	userText.innerHTML = "Samples: " + sampleCount + " / " + MAX_SAMPLE_COUNT + "<br>" +
				"Anim. Frame: " + frameCount + " / " + MAX_ANIMATION_FRAMES;

	if (sampleCount < MAX_SAMPLE_COUNT)
		requestAnimationFrame(animate);

	if (sampleCount == MAX_SAMPLE_COUNT)
	{
		tmpLink.download = "renderFrame_" + frameCount + ".png";
		tmpLink.href = canvas.toDataURL();
		tmpLink.click();

		for (let index = 0; index < colorHistoryArrayLength; index++)
		{
			pixelsColorHistory[index] = 0;
		}

		// update animation
		cameraPosition.z -= 0.5;

		frameCount++;
		sampleCount = 0;

		if (frameCount <= MAX_ANIMATION_FRAMES)
			requestAnimationFrame(animate);
	}
}

animate();