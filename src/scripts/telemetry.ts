/**
 * Decorative attack/defense-inspired background.
 * Organic network + parallel blue/red streams + subtle interception glows.
 * This is illustrative artwork; it does NOT show real attacks or telemetry.
 */
const canvas = document.getElementById('telemetry-bg') as HTMLCanvasElement | null;

if (canvas) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    type Pt = { x: number; y: number };
    type Beam = {
      start: Pt; ctrl1: Pt; ctrl2: Pt; end: Pt;
      color: 'blue' | 'red'; alpha: number; phase: number; speed: number;
    };
    type Node = Pt & { radius: number };
    type Clash = Pt & { phase: number };
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const blue = '68,157,245';
    const red = '235,76,115';
    let w = 0, h = 0, dpr = 1, raf = 0, running = !document.hidden;
    let beams: Beam[] = [];
    let nodes: Node[] = [];
    let clashes: Clash[] = [];
    const started = performance.now();

    // Deterministic, irregular spacing: the composition remains stable on resize.
    const noise = (seed: number) => {
      const x = Math.sin(seed * 127.1 + 31.7) * 43758.5453;
      return x - Math.floor(x);
    };
    const px = (x: number, y: number): Pt => ({ x: x * w, y: y * h });
    const bezier = (b: Beam, t: number): Pt => {
      const q = 1 - t;
      return {
        x: q*q*q*b.start.x + 3*q*q*t*b.ctrl1.x + 3*q*t*t*b.ctrl2.x + t*t*t*b.end.x,
        y: q*q*q*b.start.y + 3*q*q*t*b.ctrl1.y + 3*q*t*t*b.ctrl2.y + t*t*t*b.end.y,
      };
    };

    const build = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // A sparse, uneven network beneath the colored streams.
      const nodeCount = w < 680 ? 17 : 32;
      nodes = Array.from({ length: nodeCount }, (_, i) => ({
        ...px(0.03 + noise(i + 14) * .94, 0.04 + noise(i + 72) * .92),
        radius: 0.65 + noise(i + 150) * 0.85
      }));

      // Two interception points, favoring the edges over readable text areas.
      const focal = w < 680
        ? [px(.78,.28), px(.23,.75)]
        : [px(.75,.30), px(.29,.76)];
      clashes = focal.map((p,i)=>({...p,phase:i * 2.7}));
      beams = [];

      // Four organically arranged bundles, each made of near-parallel arcs.
      // Red/blue flows converge and sometimes cross at the interception areas.
      const bundles = [
        { from: px(-.10,.12), to: focal[0], color: 'blue' as const, bend: -.18 },
        { from: px(1.10,.05), to: focal[0], color: 'red' as const, bend: .15 },
        { from: px(-.08,.96), to: focal[1], color: 'red' as const, bend: -.19 },
        { from: px(1.09,.89), to: focal[1], color: 'blue' as const, bend: .15 },
        { from: focal[0], to: px(1.12,.64), color: 'blue' as const, bend: -.12 },
        { from: focal[1], to: px(-.12,.42), color: 'blue' as const, bend: .10 }
      ];

      for (let group = 0; group < bundles.length; group++) {
        const b = bundles[group];
        const count = w < 680 ? 3 : (group < 4 ? 6 : 4);
        const dx = b.to.x - b.from.x, dy = b.to.y - b.from.y;
        const magnitude = Math.max(1, Math.hypot(dx,dy));
        const normalX = -dy / magnitude, normalY = dx / magnitude;
        for (let i = 0; i < count; i++) {
          const spread = (i - (count - 1)/2) * (w < 680 ? 6 : 9);
          const jitter = (noise(group*31+i*7)-.5)*8;
          const offset = spread+jitter;
          const start = { x:b.from.x+normalX*offset*1.5, y:b.from.y+normalY*offset*1.5 };
          const end = { x:b.to.x+normalX*offset*.35, y:b.to.y+normalY*offset*.35 };
          const bend = b.bend * Math.min(w,h);
          beams.push({
            start, end,
            ctrl1: {x:start.x+dx*.32+normalX*bend,y:start.y+dy*.32+normalY*bend},
            ctrl2: {x:start.x+dx*.7+normalX*bend*.85,y:start.y+dy*.7+normalY*bend*.85},
            color:b.color,
            alpha: .075+noise(group*12+i)*.075,
            phase:noise(group*50+i*17),
            speed: .000028 + noise(group*41+i*3)*.000028
          });
        }
      }
    };

    const stroke = (b: Beam) => {
      ctx.beginPath();
      ctx.moveTo(b.start.x,b.start.y);
      ctx.bezierCurveTo(b.ctrl1.x,b.ctrl1.y,b.ctrl2.x,b.ctrl2.y,b.end.x,b.end.y);
      ctx.stroke();
    };

    const draw = (now: number) => {
      ctx.clearRect(0,0,w,h);

      // Ghosted underlying network — subtle and non-uniform.
      for (let i=0;i<nodes.length;i++) {
        const a=nodes[i];
        ctx.fillStyle='rgba(155,174,194,.13)';
        ctx.beginPath();ctx.arc(a.x,a.y,a.radius,0,Math.PI*2);ctx.fill();
        for (let j=i+1;j<nodes.length;j++) {
          const b=nodes[j];
          const dist=Math.hypot(a.x-b.x,a.y-b.y);
          const limit=w < 680 ? 115 : 190;
          if (dist>limit || noise(i*73+j*17)>.67) continue;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.strokeStyle='rgba(111,138,158,'+(0.018*(1-dist/limit))+')';
          ctx.lineWidth=.65;ctx.stroke();
        }
      }

      const elapsed = now-started;
      for (const b of beams) {
        const rgb=b.color==='red' ? red : blue;
        ctx.strokeStyle='rgba('+rgb+','+b.alpha+')';
        ctx.lineWidth=.7;
        stroke(b);

        // A short luminous packet follows each curve rather than a whole-line sweep.
        const t=media.matches ? b.phase : (b.phase+elapsed*b.speed)%1;
        const from=Math.max(0,t-.07);
        const steps=7;
        for(let i=0;i<steps;i++) {
          const t1=from+(t-from)*i/steps;
          const t2=from+(t-from)*(i+1)/steps;
          const p1=bezier(b,t1),p2=bezier(b,t2);
          ctx.beginPath();ctx.moveTo(p1.x,p1.y);ctx.lineTo(p2.x,p2.y);
          ctx.lineWidth=1.15;
          ctx.strokeStyle='rgba('+rgb+','+(.035+i/steps*.24)+')';
          ctx.stroke();
        }
      }

      // Interception glows: pulses meet and fade, without artificial dashboard elements.
      for (const clash of clashes) {
        const oscillation=media.matches ? .35 : (Math.sin(elapsed*.0011+clash.phase)+1)/2;
        const radius=8+oscillation*10;
        const halo=ctx.createRadialGradient(clash.x,clash.y,0,clash.x,clash.y,radius*2.7);
        halo.addColorStop(0,'rgba(166,201,229,'+(.07+oscillation*.09)+')');
        halo.addColorStop(.45,'rgba(109,142,202,.035)');
        halo.addColorStop(1,'rgba(109,142,202,0)');
        ctx.fillStyle=halo;
        ctx.beginPath();ctx.arc(clash.x,clash.y,radius*2.7,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='rgba(149,185,215,'+(.04+oscillation*.1)+')';
        ctx.lineWidth=.7;
        ctx.beginPath();ctx.arc(clash.x,clash.y,radius,0,Math.PI*2);ctx.stroke();
      }

      if(running && !media.matches) raf=requestAnimationFrame(draw);
    };

    const restart=()=>{cancelAnimationFrame(raf);if(running)draw(performance.now());};
    const resize=()=>{build();restart();};
    const visibility=()=>{running=!document.hidden;restart();};
    window.addEventListener('resize',resize,{passive:true});
    document.addEventListener('visibilitychange',visibility);
    media.addEventListener('change',restart);
    build();
    restart();
  }
}
