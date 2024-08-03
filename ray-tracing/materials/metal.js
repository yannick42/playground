import { Material } from '../material.js';
import { Ray } from '../ray.js';

function reflect(v, n) {
    return v.sub(n.mul(2 * v.dot(n)));
}

export class Metal extends Material {
    
      constructor(albedo) {
        super();
        this.albedo = albedo;
      }
  
      scatter(rayIn, record) {
          const reflected = reflect(rayIn.direction, record.normal);
          
          const scatteredRay = new Ray(record.p, reflected);
          const attenuation = this.albedo;

          return [true, attenuation, scatteredRay];
      }
  
};
  