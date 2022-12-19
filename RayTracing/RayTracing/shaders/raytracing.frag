#version 430

#define EPSILON 0.001
#define BIG 1000000.0

const int DIFFUSE = 1;
const int REFLECTION = 2;
const int REFRACTION = 3;
const int DIFFUSE_REFLECTION = 1;
const int MIRROR_REFLECTION = 2;
const int REFRACTION_REFLECTION = 3;

const float REFR_COEF = 1;

in vec3 glPosition;
out vec4 FragColor;

/*** DATA STRUCTURES ***/
struct SCamera
{
    vec3 Position;
    vec3 View;
    vec3 Up;
    vec3 Side;
    vec2 Scale;
};

struct SRay
{
    vec3 Origin;
    vec3 Direction;
};

struct SSphere
{
    vec3 Center;
    float Radius;
    int MaterialIdx;
};

struct STriangle
{
    vec3 v1;
    vec3 v2;
    vec3 v3;
    int MaterialIdx;
};

struct SMaterial
{
    //diffuse color
    vec3 Color;
    // ambient, diffuse and specular coeffs
    vec4 LightCoeffs;
    // 0 - non-reflection, 1 - mirror
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

struct SIntersection
{
    float Time;
    vec3 Point;
    vec3 Normal;
    vec3 Color;
    vec4 LightCoeffs;
    // 0 - non-reflection, 1 - mirror
    float ReflectionCoef;
    float RefractionCoef;
    int MaterialType;
};

struct SLight
{
    vec3 Position;
};

struct STracingRay
{
	SRay ray;
	float contribution;
	int depth;
};

/*** *************************** ***/

SCamera initializeDefaultCamera()
{
    //** CAMERA **//
    SCamera camera;
    camera.Position = vec3(0.0, 0.0, -8.0);
    camera.View = vec3(0.0, 0.0, 1.0);
    camera.Up = vec3(0.0, 1.0, 0.0);
    camera.Side = vec3(1.0, 0.0, 0.0);
    camera.Scale = vec2(1.0);
    return camera;
}

void initializeDefaultScene(out STriangle triangles[10], out SSphere spheres[2])
{
	/** TRIANGLES **/
	/* left wall */
	triangles[0].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[0].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[0].v3 = vec3(-5.0, 5.0,-5.0);
	triangles[0].MaterialIdx = 0;

	triangles[1].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[1].v2 = vec3(-5.0,-5.0, 5.0);
	triangles[1].v3 = vec3(-5.0, 5.0, 5.0);
	triangles[1].MaterialIdx = 0;

	/* back wall */
	triangles[2].v1 = vec3(-5.0,-5.0, 5.0);
    triangles[2].v2 = vec3( 5.0,-5.0, 5.0);
	triangles[2].v3 = vec3(-5.0, 5.0, 5.0);
	triangles[2].MaterialIdx = 2;

	triangles[3].v1 = vec3( 5.0, 5.0, 5.0);
	triangles[3].v2 = vec3(-5.0, 5.0, 5.0);
	triangles[3].v3 = vec3( 5.0,-5.0, 5.0);
	triangles[3].MaterialIdx = 2;

    /* right wall */
    triangles[4].v1 = vec3( 5.0,-5.0, 5.0);
	triangles[4].v2 = vec3( 5.0,-5.0,-5.0);
	triangles[4].v3 = vec3( 5.0, 5.0, 5.0);
	triangles[4].MaterialIdx = 0;

	triangles[5].v1 = vec3( 5.0,-5.0,-5.0);
	triangles[5].v2 = vec3( 5.0, 5.0,-5.0);
	triangles[5].v3 = vec3( 5.0, 5.0, 5.0);
	triangles[5].MaterialIdx = 0;
	
    /* top wall */
    triangles[6].v1 = vec3(-5.0, 5.0, 5.0);
	triangles[6].v2 = vec3( 5.0, 5.0, 5.0);
	triangles[6].v3 = vec3(-5.0, 5.0,-5.0);
	triangles[6].MaterialIdx = 3;

	triangles[7].v1 = vec3( 5.0, 5.0,-5.0);
	triangles[7].v2 = vec3(-5.0, 5.0,-5.0);
	triangles[7].v3 = vec3( 5.0, 5.0, 5.0);
	triangles[7].MaterialIdx = 3;

    /* bottom wall */
    triangles[8].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[8].v2 = vec3( 5.0,-5.0, 5.0);
	triangles[8].v3 = vec3(-5.0,-5.0, 5.0);
	triangles[8].MaterialIdx = 3;

	triangles[9].v1 = vec3(-5.0,-5.0,-5.0);
	triangles[9].v2 = vec3( 5.0,-5.0,-5.0);
	triangles[9].v3 = vec3( 5.0,-5.0, 5.0);
	triangles[9].MaterialIdx = 3;

	/** SPHERES **/
	spheres[0].Center = vec3(-1.0, -1.0, -2.0);
	spheres[0].Radius = 2.0;
	spheres[0].MaterialIdx = 5;

	spheres[1].Center = vec3(2.0, 1.0, 2.0);
	spheres[1].Radius = 1.0;
	spheres[1].MaterialIdx = 1;
}

void initializeDefaultLightMaterials(out SLight light, out SMaterial materials[6])
{
    //** LIGHT **//
    light.Position = vec3(0.0, 2.0, -4.0f);

    /** MATERIALS **/
    vec4 lightCoefs = vec4(0.4, 0.9, 0.0, 512.0);

    materials[0].Color = vec3(0.0, 0.7, 0.0);
    materials[0].LightCoeffs = vec4(lightCoefs);
    materials[0].ReflectionCoef = 0.5;
    materials[0].RefractionCoef = 1.0;
    materials[0].MaterialType = DIFFUSE; 

    materials[1].Color = vec3(0.0, 0.0, 1.0);
    materials[1].LightCoeffs = vec4(lightCoefs);
    materials[1].ReflectionCoef = 0.5;
    materials[1].RefractionCoef = 1.0;
    materials[1].MaterialType = DIFFUSE;

    materials[2].Color = vec3(0.8, 0.0, 0.0);
    materials[2].LightCoeffs = vec4(lightCoefs);
    materials[2].ReflectionCoef = 0.5;
    materials[2].RefractionCoef = 1.0;
    materials[2].MaterialType = DIFFUSE;

    materials[3].Color = vec3(1.0, 1.0, 1.0);
    materials[3].LightCoeffs = vec4(lightCoefs);
    materials[3].ReflectionCoef = 0.5;
    materials[3].RefractionCoef = 1.0;
    materials[3].MaterialType = DIFFUSE;

    materials[4].Color = vec3(1.0, 1.0, 1.0);
    materials[4].LightCoeffs = vec4(lightCoefs);
    materials[4].ReflectionCoef = 0.5;
    materials[4].RefractionCoef = 1.0;
    materials[4].MaterialType = REFLECTION;

    materials[5].Color = vec3(1.0, 1.0, 1.0);
    materials[5].LightCoeffs = vec4(lightCoefs);
    materials[5].ReflectionCoef = 0.5;
    materials[5].RefractionCoef = 3.5;
    materials[5].MaterialType = REFRACTION;
}

SRay GenerateRay (in SCamera uCamera)
{
	vec2 coords = glPosition.xy * uCamera.Scale;
	vec3 direction = uCamera.View + uCamera.Side * coords.x + uCamera.Up * coords.y;
	return SRay ( uCamera.Position, normalize(direction) );
}

bool IntersectSphere ( SSphere sphere, SRay ray, float start, float final, out float time )
{
    ray.Origin -= sphere.Center;
    float A = dot ( ray.Direction, ray.Direction );
    float B = dot ( ray.Direction, ray.Origin );
    float C = dot ( ray.Origin, ray.Origin ) - sphere.Radius * sphere.Radius;
    float D = B * B - A * C;
    if ( D > 0.0 )
	{
        D = sqrt ( D );
        //time = min ( max ( 0.0, ( -B - D ) / A ), ( -B + D ) / A );
		float t1 = ( -B - D ) / A;
        float t2 = ( -B + D ) / A;
        if(t1 < 0 && t2 < 0)
			return false;
        
		if(min(t1, t2) < 0)
		{
            time = max(t1,t2);
            return true;
        }
		time = min(t1, t2);
        return true;
	}
	return false;
}

bool IntersectTriangle (SRay ray, vec3 v1, vec3 v2, vec3 v3, out float time )
{
    time = -1;
    vec3 A = v2 - v1;
    vec3 B = v3 - v1;

    vec3 N = cross(A, B);
    float NdotRayDirection = dot(N, ray.Direction);
    if (abs(NdotRayDirection) < EPSILON) 
        return false;

    float d = dot(N, v1);
    float t = -(dot(N, ray.Origin) - d) / NdotRayDirection;
    if (t < 0) 
	    return false;

    vec3 P = ray.Origin + t * ray.Direction;
    vec3 C;
    vec3 edge1 = v2 - v1;
    vec3 VP1 = P - v1;
    C = cross(edge1, VP1);
    if (dot(N, C) < 0)
        return false;

    vec3 edge2 = v3 - v2;
    vec3 VP2 = P - v2;
    C = cross(edge2, VP2);
    if (dot(N, C) < 0) 
        return false;

    vec3 edge3 = v1 - v3;
    vec3 VP3 = P - v3;
    C = cross(edge3, VP3);
    if (dot(N, C) < 0) 
        return false;

    time = t;
    return true;
}

bool Raytrace ( SRay ray, SSphere spheres[2], STriangle triangles[10], SMaterial materials[6],
    float start, float final, inout SIntersection intersect )
{
    bool result = false;
    float test = start;
    intersect.Time = final;

    //calculate intersect with spheres
    for (int i = 0; i < 2; i++)
    {
        SSphere sphere = spheres[i];
        if( IntersectSphere (sphere, ray, start, final, test ) && test < intersect.Time )
        {
            intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = normalize ( intersect.Point - spheres[i].Center );
            /*intersect.Color = vec3(1, 0, 0);
            intersect.LightCoeffs =   vec4(0, 0, 0, 0);
            intersect.ReflectionCoef = 0;
            intersect.RefractionCoef = 0;
            intersect.MaterialType =   0;*/
            intersect.Color = materials[sphere.MaterialIdx].Color;
            intersect.LightCoeffs = materials[sphere.MaterialIdx].LightCoeffs;
            intersect.ReflectionCoef = materials[sphere.MaterialIdx].ReflectionCoef;
            intersect.RefractionCoef = materials[sphere.MaterialIdx].RefractionCoef;
            intersect.MaterialType =   materials[sphere.MaterialIdx].MaterialType;
            result = true;
        }
    }

    //calculate intersect with triangles
    for (int i = 0; i < 10; i++)
    {
        STriangle triangle = triangles[i];

        if(IntersectTriangle(ray, triangle.v1, triangle.v2, triangle.v3, test) &&
            test < intersect.Time)
        {
            intersect.Time = test;
            intersect.Point = ray.Origin + ray.Direction * test;
            intersect.Normal = 
                normalize(cross(triangle.v1 - triangle.v2, triangle.v3 - triangle.v2));
            /*intersect.Color = vec3(1, 0, 0);
            intersect.LightCoeffs =   vec4(0, 0, 0, 0);
            intersect.ReflectionCoef = 0; 
            intersect.RefractionCoef = 0;
            intersect.MaterialType =   0;*/
            intersect.Color = materials[triangle.MaterialIdx].Color;
            intersect.LightCoeffs = materials[triangle.MaterialIdx].LightCoeffs;
            intersect.ReflectionCoef = materials[triangle.MaterialIdx].ReflectionCoef;
            intersect.RefractionCoef = materials[triangle.MaterialIdx].RefractionCoef;
            intersect.MaterialType =   materials[triangle.MaterialIdx].MaterialType;
            result = true;
        }

    }
    return result;
}

float Shadow(SSphere spheres[2], STriangle triangles[10],
    SMaterial materials[6], SLight currLight, SIntersection intersect)
{
    // Point is lighted
    float shadowing = 1.0;
    // Vector to the light source
    vec3 direction = normalize(currLight.Position - intersect.Point);
    // Distance to the light source
    float distanceLight = distance(currLight.Position, intersect.Point);
    // Generation shadow ray for this light source
    SRay shadowRay = SRay(intersect.Point + direction * EPSILON, direction);
    // ...test intersection this ray with each scene object
    SIntersection shadowIntersect;
    shadowIntersect.Time = BIG;
    // trace ray from shadow ray begining to light source position
    if(Raytrace(shadowRay, spheres, triangles, materials, 0, distanceLight,
                shadowIntersect))
    {
        // this light source is invisible in the intercection point
        shadowing = 0.0;
    }
    return shadowing;
}

vec3 Phong ( SRay ray, SIntersection intersect, SLight currLight, float shadowing)
{
    vec3 lightDir = normalize ( currLight.Position - intersect.Point );
    float diffuse = max(dot(lightDir, intersect.Normal), 0.0);
    vec3 view = normalize(-ray.Direction);
    vec3 reflected = reflect( view, intersect.Normal );
    float specular = pow(max(dot(reflected, lightDir), 0.0), intersect.LightCoeffs.w);

    return intersect.LightCoeffs.x * intersect.Color +
	       intersect.LightCoeffs.y * diffuse * intersect.Color * shadowing +
	       intersect.LightCoeffs.z * specular * vec3(1.0);
}

void main (void)
{
    STriangle triangles[10];
    SSphere spheres[2];
    SLight light;
    SMaterial materials[6];
    
    float start = 0;
    float final = BIG;
    bool notEmpty = true;
    vec3 resultColor = vec3(0,0,0);
    int crossCount = 0;
    
    initializeDefaultScene(triangles, spheres);
    initializeDefaultLightMaterials(light, materials);

    SCamera uCamera = initializeDefaultCamera();
    SRay ray = GenerateRay(uCamera);

    SIntersection intersect;
    intersect.Time = BIG;

    float oldRefractionCoef = REFR_COEF;

    STracingRay trRayCurrent = STracingRay(ray, 1, 0);

    while(notEmpty)
    {
        STracingRay trRay = trRayCurrent;
        notEmpty = false;
        ray = trRay.ray;

        if (Raytrace(ray, spheres, triangles, materials, start, final, intersect)) 
        {
            switch(intersect.MaterialType)
            {
                case DIFFUSE_REFLECTION:
                {
                    float shadowing = Shadow(spheres, triangles, materials, light, intersect);
                    resultColor += trRay.contribution * Phong ( ray, intersect, light, shadowing );
                    break;
                }
	            case MIRROR_REFLECTION: 
	            {
                    if(intersect.ReflectionCoef < 1)
	                {
                        float contribution = trRay.contribution * (1 - intersect.ReflectionCoef);
                        float shadowing = Shadow(spheres, triangles, materials, light, intersect);
                        resultColor += contribution * Phong(ray, intersect, light, shadowing);
	                }
	                vec3 reflectDirection = reflect(ray.Direction, intersect.Normal);
	                // creare reflection ray
	                float contribution = trRay.contribution * intersect.ReflectionCoef;
	                STracingRay reflectRay = STracingRay(
                                SRay(intersect.Point + reflectDirection * EPSILON, reflectDirection),
                                contribution, trRay.depth + 1);
                    trRayCurrent = reflectRay;
                    notEmpty = true;
	                break;
                }
                case REFRACTION_REFLECTION:
                {
                    crossCount++;
                    float eta = oldRefractionCoef / intersect.RefractionCoef;
                    //float eta = 0.26;
                    float contribution = trRay.contribution * intersect.RefractionCoef;
                    float shadowing = Shadow(spheres, triangles, materials, light, intersect);

                    if (crossCount == 3)
                    {
                        resultColor += Phong(ray, intersect, light, shadowing);
                        crossCount = 0;
                    }
                    if (crossCount == 2)
                    {
                        intersect.Normal *= -1;
                        eta = 1 / eta;
                    }

                    vec3 refractDirection = refract(ray.Direction, intersect.Normal, eta);

	                STracingRay refractRay = STracingRay(
                                SRay(intersect.Point + refractDirection * EPSILON, refractDirection),
                                1, trRay.depth + 1);
                    trRayCurrent = refractRay;
                    notEmpty = true;
                    break;
                }
	        }
	    }
    }

    /*
    float start = 0;
    float final = BIG;

    initializeDefaultScene(triangles, spheres); 
    initializeDefaultLightMaterials(light, materials);

    SCamera uCamera = initializeDefaultCamera();
    SRay ray = GenerateRay(uCamera);
    SIntersection intersect;
    intersect.Time = BIG;

    vec3 resultColor = vec3(0,0,0);
    
    if ( Raytrace(ray, spheres, triangles, materials, start, final, intersect) )
    { 
        resultColor += Phong(ray, intersect, light);
    }*/
    FragColor = vec4 (resultColor, 1.0);
}
