export function initWebGLShader() {
  const canvas = document.getElementById('gl-canvas');
  if (!canvas) return;
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  if (!gl) return;

  const vSrc = `
    attribute vec2 a_pos;
    void main(){ gl_Position = vec4(a_pos,0,1); }
  `;
  const fSrc = `
    precision mediump float;
    uniform vec2 u_res;
    uniform float u_time;
    uniform vec2 u_mouse;

    vec2 hash2(vec2 p){
      p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));
      return -1.0 + 2.0*fract(sin(p)*43758.5453123);
    }
    float noise(vec2 p){
      vec2 i = floor(p); vec2 f = fract(p);
      vec2 u = f*f*(3.0-2.0*f);
      return mix(mix(dot(hash2(i+vec2(0,0)),f-vec2(0,0)),
                     dot(hash2(i+vec2(1,0)),f-vec2(1,0)),u.x),
                 mix(dot(hash2(i+vec2(0,1)),f-vec2(0,1)),
                     dot(hash2(i+vec2(1,1)),f-vec2(1,1)),u.x),u.y);
    }
    float fbm(vec2 p){
      float v=0.0,a=0.5;
      for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.1; a*=0.5; }
      return v;
    }

    void main(){
      vec2 uv = gl_FragCoord.xy / u_res;
      uv.y = 1.0 - uv.y;
      vec2 centered = uv - 0.5;
      float t = u_time * 0.18;

      vec2 mouse = u_mouse / u_res;
      mouse.y = 1.0 - mouse.y;
      float md = length(centered - (mouse - 0.5)) * 2.0;
      float mInfluence = exp(-md * md * 3.0) * 0.15;

      vec2 q = vec2(fbm(uv + t*0.3), fbm(uv + 1.7 + t*0.25));
      vec2 r = vec2(fbm(uv + 1.0*q + 0.5 + t*0.15), fbm(uv + 1.0*q + 0.3 + t*0.12));
      float f = fbm(uv + r + mInfluence);

      vec3 col = mix(
        vec3(0.04, 0.0, 0.08),
        vec3(0.22, 0.06, 0.45),
        clamp(f*f*4.0, 0.0, 1.0)
      );
      col = mix(col, vec3(0.55, 0.08, 0.55), clamp(length(q)*0.8, 0.0, 1.0));
      col = mix(col, vec3(0.80, 0.25, 0.65), clamp(r.x*r.x*0.6, 0.0, 1.0));

      float vign = 1.0 - smoothstep(0.35, 1.0, length(centered)*1.6);
      col *= vign * 0.85;

      col += vec3(0.25, 0.06, 0.45) * (1.0 - smoothstep(0.0, 0.4, md)) * 0.25;

      vec2 starUV = uv * 60.0;
      vec2 si = floor(starUV); vec2 sf = fract(starUV);
      float star = step(0.985, fract(sin(dot(si, vec2(127.1,311.7)))*43758.55));
      star *= smoothstep(0.5, 0.0, length(sf - 0.5));
      star *= 0.5 + 0.5*sin(u_time + dot(si, vec2(5.3,7.1)));
      col += vec3(0.7,0.5,1.0) * star * 0.8;

      gl_FragColor = vec4(col, 1.0);
    }
  `;

  function compileShader(src, type) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    return s;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(vSrc, gl.VERTEX_SHADER));
  gl.attachShader(prog, compileShader(fSrc, gl.FRAGMENT_SHADER));
  gl.linkProgram(prog); gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes   = gl.getUniformLocation(prog, 'u_res');
  const uTime  = gl.getUniformLocation(prog, 'u_time');
  const uMouse = gl.getUniformLocation(prog, 'u_mouse');

  let mouseX = window.innerWidth / 2, mouseY = window.innerHeight / 2;
  document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
  document.addEventListener('touchmove', e => {
    if (e.touches[0]) { mouseX = e.touches[0].clientX; mouseY = e.touches[0].clientY; }
  }, { passive: true });

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width  = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
  }
  resize();
  window.addEventListener('resize', resize);

  let paused = false;
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
    if (!paused) requestAnimationFrame(loop);
  });

  function loop(t) {
    if (paused) return;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, t * 0.001);
    gl.uniform2f(uMouse, mouseX, mouseY);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
