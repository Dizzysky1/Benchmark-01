import * as THREE from "three";

// Day/night cycle — rotates a directional "sun" light and updates sky color,
// fog, and ambient. One cycle = `dayLength` seconds.
export class SkySystem {
  constructor(scene, renderer) {
    this.scene = scene;
    this.renderer = renderer;
    this.dayLength = 600; // 10 minutes per full cycle
    this.time = 0.5;      // start at noon (see update() for mapping)

    // Sky dome (big inverted sphere with vertex-color gradient)
    const geo = new THREE.SphereGeometry(400, 32, 16);
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        topColor:    { value: new THREE.Color(0x4488ff) },
        bottomColor: { value: new THREE.Color(0xaed7ff) },
        sunDir:      { value: new THREE.Vector3(0, 1, 0) },
      },
      vertexShader: `
        varying vec3 vWorld;
        void main() {
          vWorld = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 sunDir;
        varying vec3 vWorld;
        void main() {
          float h = clamp(vWorld.y * 0.5 + 0.5, 0.0, 1.0);
          vec3 col = mix(bottomColor, topColor, pow(h, 0.6));
          // Sun glow
          float sun = max(dot(normalize(vWorld), normalize(sunDir)), 0.0);
          col += vec3(1.0, 0.9, 0.65) * pow(sun, 128.0) * 1.6;
          col += vec3(1.0, 0.7, 0.4) * pow(sun, 8.0) * 0.1;
          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });
    this.sky = new THREE.Mesh(geo, mat);
    this.sky.renderOrder = -1;
    scene.add(this.sky);

    // Lights
    this.sun = new THREE.DirectionalLight(0xffffff, 1.0);
    scene.add(this.sun);
    this.ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(this.ambient);

    // Fog
    this.scene.fog = new THREE.Fog(0xaed7ff, 40, 120);

    // Moon - secondary light
    this.moon = new THREE.DirectionalLight(0x88aaff, 0);
    scene.add(this.moon);
  }

  update(dt) {
    this.time = (this.time + dt / this.dayLength) % 1;

    // Sun angle: 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
    const ang = this.time * Math.PI * 2;
    const sunX = Math.cos(ang - Math.PI/2);
    const sunY = Math.sin(ang - Math.PI/2);
    this.sun.position.set(sunX * 100, sunY * 100, 30);
    this.sun.target.position.set(0, 0, 0);

    const moonAng = ang + Math.PI;
    this.moon.position.set(Math.cos(moonAng - Math.PI/2) * 100, Math.sin(moonAng - Math.PI/2) * 100, 30);

    // Compute daylight factor
    const daylight = Math.max(0, Math.sin(ang - Math.PI/2)); // 0 at night, 1 at noon
    const dusk = Math.max(0, 1 - Math.abs(Math.sin(ang - Math.PI/2))) * Math.max(0, Math.cos(ang - Math.PI/2)); // around sunset

    // Colors
    const dayTop = new THREE.Color(0x4488ff);
    const dayBot = new THREE.Color(0xaed7ff);
    const nightTop = new THREE.Color(0x050814);
    const nightBot = new THREE.Color(0x0a1428);
    const duskTop = new THREE.Color(0x3a2550);
    const duskBot = new THREE.Color(0xff8844);

    // Blend day ↔ night with dusk interpolation
    let top, bot;
    if (daylight > 0.1) {
      top = dayTop.clone().lerp(duskTop, 1 - daylight);
      bot = dayBot.clone().lerp(duskBot, 1 - daylight);
    } else {
      top = duskTop.clone().lerp(nightTop, 1 - Math.max(0, daylight * 10 + 1));
      bot = duskBot.clone().lerp(nightBot, 1 - Math.max(0, daylight * 10 + 1));
    }
    this.sky.material.uniforms.topColor.value.copy(top);
    this.sky.material.uniforms.bottomColor.value.copy(bot);
    this.sky.material.uniforms.sunDir.value.set(sunX, sunY, 0.3);

    // Light intensities
    this.sun.intensity = Math.max(0.05, daylight) * 1.1;
    this.moon.intensity = Math.max(0, -Math.sin(ang - Math.PI/2)) * 0.25;
    this.ambient.intensity = 0.2 + daylight * 0.35;

    // Fog color follows horizon
    this.scene.fog.color.copy(bot);
    this.renderer.setClearColor(bot);
  }

  getTimeOfDay() {
    // Hours 0-24
    return this.time * 24;
  }
}
