import {
  Engine,
  Scene,
  Vector3,
  Color4,
  ArcRotateCamera,
  HemisphericLight,
  GlowLayer,
  Color3,
  MeshBuilder,
  StandardMaterial,
  Texture,
  SolidParticleSystem,
  Mesh,
  Scalar,
  PointLight,
  Animation,
} from "@babylonjs/core";
import { TEXTURES, COLORS, PARTICLE_COUNTS } from "./constants";

export type GameState = "TREE" | "HEART" | "SCATTERED";

export class ChristmasTreeGame {
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  
  // Main morphing particles
  private sps: SolidParticleSystem;
  private particleMesh: Mesh | null = null;
  private targetPositions: Float32Array;
  
  // Snow particles
  private snowSPS: SolidParticleSystem;
  private snowMesh: Mesh | null = null;

  private currentState: GameState = "TREE";
  
  // Interaction callbacks
  public onStateChange: ((state: GameState) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.engine = new Engine(canvas, true);
    this.scene = this.createScene();
    
    // Initialize arrays
    const count = PARTICLE_COUNTS.TREE;
    this.targetPositions = new Float32Array(count * 3);
    
    this.sps = new SolidParticleSystem("SPS", this.scene, { updatable: true });
    this.snowSPS = new SolidParticleSystem("SnowSPS", this.scene, { updatable: true });
    
    this.initMainParticles();
    this.initSnowParticles();
    
    // Start loop
    this.engine.runRenderLoop(() => {
      this.update();
      this.scene.render();
    });

    window.addEventListener("resize", () => {
      this.engine.resize();
    });
  }

  private createScene(): Scene {
    const scene = new Scene(this.engine);
    scene.clearColor = new Color4(0.02, 0.02, 0.05, 1); 

    // Camera
    this.camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 40, Vector3.Zero(), scene);
    this.camera.attachControl(this.engine.getRenderingCanvas(), true);
    this.camera.lowerRadiusLimit = 15;
    this.camera.upperRadiusLimit = 80;
    this.camera.wheelPrecision = 50;
    this.camera.useAutoRotationBehavior = true;
    if (this.camera.autoRotationBehavior) {
        this.camera.autoRotationBehavior.idleRotationSpeed = 0.1;
    }

    // Light
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.3;
    
    // Point light for center
    const pl = new PointLight("pl", Vector3.Zero(), scene);
    pl.intensity = 0.5;
    pl.diffuse = new Color3(1, 0.8, 0.5);

    // Glow Layer
    const gl = new GlowLayer("glow", scene);
    gl.intensity = 1.2;

    return scene;
  }

  private initMainParticles() {
    // Create a base shape 
    const shape = MeshBuilder.CreatePlane("p", { size: 0.25 }, this.scene);
    
    // Material with texture
    const mat = new StandardMaterial("mat", this.scene);
    mat.diffuseTexture = new Texture(TEXTURES.SNOWFLAKE, this.scene);
    mat.diffuseTexture.hasAlpha = true;
    mat.opacityTexture = mat.diffuseTexture;
    mat.backFaceCulling = false;
    mat.emissiveColor = new Color3(1, 1, 1);
    mat.disableLighting = true; 
    
    shape.material = mat;

    // Add particles
    this.sps.addShape(shape, PARTICLE_COUNTS.TREE);
    shape.dispose(); 

    this.particleMesh = this.sps.buildMesh();
    this.particleMesh.hasVertexAlpha = true;
    
    // Initial positions (Tree)
    this.calculateTreePositions();
    
    // Initialize SPS particles
    this.sps.initParticles = () => {
      for (let i = 0; i < this.sps.nbParticles; i++) {
        const p = this.sps.particles[i];
        p.position.x = this.targetPositions[i * 3];
        p.position.y = this.targetPositions[i * 3 + 1];
        p.position.z = this.targetPositions[i * 3 + 2];
        
        // Random color mix
        // 10% Gold (Lights), 90% Green/White variants
        const isLight = Math.random() > 0.9;
        
        if (isLight) {
            p.color = new Color4(COLORS.GOLD.r, COLORS.GOLD.g, COLORS.GOLD.b, 1);
            p.scale = new Vector3(1.5, 1.5, 1.5); // Bigger lights
            // Store "isLight" in a property if possible, or deduce from color later
        } else {
            const variant = Math.random();
            if (variant > 0.3) {
                p.color = new Color4(COLORS.TREE_GREEN.r, COLORS.TREE_GREEN.g, COLORS.TREE_GREEN.b, 0.9);
            } else {
                p.color = new Color4(COLORS.TREE_DARK_GREEN.r, COLORS.TREE_DARK_GREEN.g, COLORS.TREE_DARK_GREEN.b, 0.9);
            }
            p.scale = new Vector3(0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4, 0.8 + Math.random() * 0.4);
        }
        
        p.rotation.z = Math.random() * Math.PI * 2;
        
        // Use velocity to store some random offsets for animation
        p.velocity.x = (Math.random() - 0.5) * 0.02; // wobble speed
        p.velocity.y = (Math.random() - 0.5) * 0.02;
        p.velocity.z = Math.random() * Math.PI * 2; // phase
      }
    };
    
    this.sps.initParticles();
    this.sps.setParticles();
  }
  
  private initSnowParticles() {
      const shape = MeshBuilder.CreatePlane("snow", { size: 0.15 }, this.scene);
      const mat = new StandardMaterial("snowMat", this.scene);
      mat.diffuseTexture = new Texture(TEXTURES.SNOWFLAKE, this.scene);
      mat.diffuseTexture.hasAlpha = true;
      mat.opacityTexture = mat.diffuseTexture;
      mat.emissiveColor = Color3.White();
      mat.disableLighting = true;
      shape.material = mat;
      
      this.snowSPS.addShape(shape, PARTICLE_COUNTS.SNOW);
      shape.dispose();
      
      this.snowMesh = this.snowSPS.buildMesh();
      this.snowMesh.hasVertexAlpha = true;
      
      this.snowSPS.initParticles = () => {
          for (let i = 0; i < this.snowSPS.nbParticles; i++) {
              const p = this.snowSPS.particles[i];
              this.resetSnowParticle(p);
              // Scramble initial y to fill screen
              p.position.y = Math.random() * 40 - 20;
          }
      };
      
      this.snowSPS.initParticles();
      this.snowSPS.setParticles();
  }
  
  private resetSnowParticle(p: any) {
      p.position.x = (Math.random() - 0.5) * 40;
      p.position.y = 20;
      p.position.z = (Math.random() - 0.5) * 40;
      p.velocity.y = -0.05 - Math.random() * 0.1; // Fall speed
      p.velocity.x = (Math.random() - 0.5) * 0.02; // Drift
      p.velocity.z = (Math.random() - 0.5) * 0.02;
      p.color = new Color4(1, 1, 1, 0.5 + Math.random() * 0.5);
  }

  // --- Formation Calculations ---

  private calculateTreePositions() {
    for (let i = 0; i < PARTICLE_COUNTS.TREE; i++) {
      const h = (i / PARTICLE_COUNTS.TREE) * 20 - 10;
      const r = (10 - h) * 0.6 * Math.random(); 
      const theta = Math.random() * Math.PI * 2; // Random distribution
      
      // Add spiral structure
      // const theta = h * 2 + Math.random();
      
      this.targetPositions[i * 3] = r * Math.cos(theta);
      this.targetPositions[i * 3 + 1] = h;
      this.targetPositions[i * 3 + 2] = r * Math.sin(theta);
    }
  }

  private calculateHeartPositions() {
    for (let i = 0; i < PARTICLE_COUNTS.TREE; i++) {
        const t = Math.random() * Math.PI * 2;
        
        // Parametric Heart
        // x = 16 sin^3(t)
        // y = 13 cos(t) - 5 cos(2t) - 2 cos(3t) - cos(4t)
        
        const scale = 0.05 + Math.random() * 0.25; // Fill volume
        
        const xRaw = 16 * Math.pow(Math.sin(t), 3);
        const yRaw = 13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t);
        
        const zThickness = 3;
        const z = (Math.random() - 0.5) * zThickness;

        this.targetPositions[i * 3] = xRaw * scale * 2; // Scale up a bit
        this.targetPositions[i * 3 + 1] = yRaw * scale * 2 + 5; 
        this.targetPositions[i * 3 + 2] = z * 2;
    }
  }

  private calculateScatteredPositions() {
    for (let i = 0; i < PARTICLE_COUNTS.TREE; i++) {
        const r = 10 + Math.random() * 25;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        
        this.targetPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        this.targetPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        this.targetPositions[i * 3 + 2] = r * Math.cos(phi);
    }
  }

  // --- Update Loop ---

  public setShape(state: GameState) {
    if (this.currentState === state) return;
    this.currentState = state;
    if (this.onStateChange) this.onStateChange(state);

    if (state === "TREE") this.calculateTreePositions();
    else if (state === "HEART") this.calculateHeartPositions();
    else if (state === "SCATTERED") this.calculateScatteredPositions();
  }

  private update() {
    const lerpFactor = 0.05;
    const time = performance.now() * 0.001;
    
    // Update Morphing Particles
    for (let i = 0; i < this.sps.nbParticles; i++) {
        const p = this.sps.particles[i];
        
        const tx = this.targetPositions[i * 3];
        const ty = this.targetPositions[i * 3 + 1];
        const tz = this.targetPositions[i * 3 + 2];
        
        p.position.x = Scalar.Lerp(p.position.x, tx, lerpFactor);
        p.position.y = Scalar.Lerp(p.position.y, ty, lerpFactor);
        p.position.z = Scalar.Lerp(p.position.z, tz, lerpFactor);
        
        // Gentle wobble
        p.position.x += Math.sin(time + p.velocity.z) * 0.01;
        p.position.y += Math.cos(time + p.velocity.z) * 0.01;
        
        // Rotation
        p.rotation.z += 0.02;
        
        // Color transition
        if (this.currentState === "HEART") {
             p.color.r = Scalar.Lerp(p.color.r, 1, 0.03); // Red
             p.color.g = Scalar.Lerp(p.color.g, 0.1, 0.03);
             p.color.b = Scalar.Lerp(p.color.b, 0.3, 0.03);
        } else if (this.currentState === "TREE") {
            // Restore approximate original colors
            // Use velocity.z (phase) to randomize restore speed
            if (p.scale.x > 1.2) { // Was a light
                 // Blink lights
                 const blink = Math.sin(time * 3 + p.velocity.z * 10) > 0.5 ? 1 : 0.5;
                 p.color.r = COLORS.GOLD.r * blink;
                 p.color.g = COLORS.GOLD.g * blink;
                 p.color.b = COLORS.GOLD.b * blink;
            } else {
                 // Green
                 p.color.r = Scalar.Lerp(p.color.r, COLORS.TREE_GREEN.r, 0.03);
                 p.color.g = Scalar.Lerp(p.color.g, COLORS.TREE_GREEN.g, 0.03);
                 p.color.b = Scalar.Lerp(p.color.b, COLORS.TREE_GREEN.b, 0.03);
            }
        } else { // SCATTERED
             // Blue/White/Magical
             p.color.r = Scalar.Lerp(p.color.r, 0.5, 0.03);
             p.color.g = Scalar.Lerp(p.color.g, 0.8, 0.03);
             p.color.b = Scalar.Lerp(p.color.b, 1.0, 0.03);
        }
    }
    this.sps.setParticles();
    
    // Update Snow
    for (let i = 0; i < this.snowSPS.nbParticles; i++) {
        const p = this.snowSPS.particles[i];
        p.position.addInPlace(p.velocity);
        
        if (p.position.y < -20) {
            this.resetSnowParticle(p);
        }
    }
    this.snowSPS.setParticles();
  }
  
  public dispose() {
    this.engine.dispose();
    window.removeEventListener("resize", () => this.engine.resize());
  }
}
