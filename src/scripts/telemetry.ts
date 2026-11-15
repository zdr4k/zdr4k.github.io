/**
 * Organic defensive-telemetry illustration.
 * Blue/rose paths flow toward gently drifting interception areas.
 * This is decorative artwork, not a map of real network attacks.
 */
const canvas = document.getElementById('telemetry-bg') as HTMLCanvasElement | null;

if (canvas) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    type Point = { x: number; y: number };
    type Node = Point & { vx: number; vy: number; size: number };
    type Focus = Point & { seed: number };
    type Flow = {
      origin: Point; target: number; color: 'blue' | 'red';
      arc: number; secondArc: number; seed: number;
      speed: number; alpha: number; start: number;
    };

    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colors = { blue: '74,158,251', red: '242,93,132' };
    const started = performance.now();
    let width = 0, height = 0, frame = 0;
    let nodes: Node[] = [], foci: Focus[] = [], flows: Flow[] = [];
    let visible = !document.hidden;

    // Stable pseudo-random distribution: no flicker or layout changes per frame.
    function random(n: number) {
      const v = Math.sin(n * 91.731 + 47.319) * 43758.5453;
      return v - Math.floor(v);
    }
    const at = (x: number, y: number): Point => ({ x:x*width, y:y*height });
    const mix = (a: number, b: number, t: number) => a+(b-a)*t;

    function makeScene() {
      width = window.innerWidth;
      height = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width*scale);
      canvas.height = Math.round(height*scale);
      canvas.style.width = width+'px';
      canvas.style.height = height+'px';
      ctx.setTransform(scale,0,0,scale,0,0);

      const mobile = width<700;
      // Focal areas deliberately don't form one rigid horizontal/diagonal line.
      foci = (mobile
        ? [[.81,.20],[.15,.66],[.79,.88]]
        : [[.79,.22],[.18,.72],[.77,.83],[.53,.56]])
        .map(([x,y],i) => ({ ...at(x,y), seed:i*1.67+1 }));

      nodes = Array.from({length:mobile?25:59},(_,i) => {
        const p=at(.01+random(i+2)*.98,.018+random(i+110)*.965);
        return { ...p, vx:random(i+32)*2-1, vy:random(i+92)*2-1,
                 size:.65+random(i+302)*1.05 };
      });

      flows=[];
      const origins = mobile
        ? [[-.14,.04],[1.13,.03],[-.14,.44],[1.10,.48],[-.1,.94],[1.15,1.05]]
        : [[-.1,.08],[.4,-.13],[1.1,.05],[1.13,.4],[-.12,.46],[-.09,.93],[.38,1.15],[1.13,.94],[.54,.96]];
      origins.forEach(([x,y],i) => {
        const focus = i%foci.length;
        const color:Flow['color'] = i%3===0 || i%4===1 ? 'red' : 'blue';
        const count = mobile?2:(i%3===0?4:3);
        for(let j=0;j<count;j++) {
          flows.push({
            origin: at(x+(j-(count-1)/2)*.013,y+(j-(count-1)/2)*.016),
            target:focus, color,
            arc:(random(i*19+j*7+13)-.5)*.56,
            secondArc:(random(i*31+j*11+25)-.5)*.44,
            seed:i*2.9+j*.44,
            alpha:.10+random(i*19+j*17)*.075,
            speed:.000015+random(i*11+j*5)*.000018,
            start:random(i*23+j*13)
          });
        }
      });
      // Branching paths between nearby defensive areas: never a global road grid.
      if(!mobile)for(let i=0;i<6;i++) {
        const a=foci[i%foci.length];
        flows.push({
          origin: {x:a.x+(random(i+600)-.5)*34,y:a.y+(random(i+650)-.5)*34},
          target:(i+1)%foci.length, color:'blue',
          arc:(random(i+700)-.5)*.43,secondArc:(random(i+720)-.5)*.37,
          seed:100+i,alpha:.075+random(i+750)*.065,
          speed:.000012+random(i+760)*.000015,start:random(i+800)
        });
      }
    }

    function focusPosition(f: Focus, time: number): Point {
      // Slow drift preserves the composition while making it feel alive.
      const t=time*.00008;
      return {
        x:f.x+Math.sin(t+f.seed)*Math.min(14,width*.011),
        y:f.y+Math.cos(t*.81+f.seed*1.3)*Math.min(15,height*.02)
      };
    }

    function curve(flow:Flow,time:number) {
      const dest=focusPosition(foci[flow.target],time);
      const dx=dest.x-flow.origin.x,dy=dest.y-flow.origin.y;
      const length=Math.max(1,Math.hypot(dx,dy));
      const normal={x:-dy/length,y:dx/length};
      const amplitude=Math.min(width,height);
      const drift=Math.sin(time*.00012+flow.seed)*.055;
      const b1=(flow.arc+drift)*amplitude;
      const b2=(flow.secondArc+drift*.8)*amplitude;
      return {
        p0:flow.origin,
        p1:{x:flow.origin.x+dx*.32+normal.x*b1,y:flow.origin.y+dy*.32+normal.y*b1},
        p2:{x:flow.origin.x+dx*.72+normal.x*b2,y:flow.origin.y+dy*.72+normal.y*b2},
        p3:dest
      };
    }

    type Curve = ReturnType<typeof curve>;
    function point(c:Curve,t:number): Point {
      const u=1-t;
      return {
        x:u*u*u*c.p0.x+3*u*u*t*c.p1.x+3*u*t*t*c.p2.x+t*t*t*c.p3.x,
        y:u*u*u*c.p0.y+3*u*u*t*c.p1.y+3*u*t*t*c.p2.y+t*t*t*c.p3.y
      };
    }
    function drawCurve(c:Curve) {
      ctx.beginPath();
      ctx.moveTo(c.p0.x,c.p0.y);
      ctx.bezierCurveTo(c.p1.x,c.p1.y,c.p2.x,c.p2.y,c.p3.x,c.p3.y);
    }

    function paint(now:number) {
      ctx.clearRect(0,0,width,height);
      const mobile=width<700;
      const sceneTime=motion.matches?started:now;

      // Irregular connected particles: faint, breathable, slightly mobile.
      const positions=nodes.map((n,i)=>({
        x:n.x+Math.sin(sceneTime*.00017+i)*5*n.vx,
        y:n.y+Math.cos(sceneTime*.00014+i*.7)*6*n.vy,
        size:n.size
      }));
      for(let i=0;i<positions.length;i++) {
        const a=positions[i];
        ctx.beginPath();ctx.arc(a.x,a.y,a.size,0,Math.PI*2);
        ctx.fillStyle='rgba(176,193,213,.19)';ctx.fill();
        for(let j=i+1;j<positions.length;j++) {
          const b=positions[j];
          const distance=Math.hypot(a.x-b.x,a.y-b.y);
          const max=mobile?125:180;
          if(distance>=max || random(i*61+j*37)>.55)continue;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.lineWidth=.65;
          ctx.strokeStyle='rgba(130,155,184,'+(.052*(1-distance/max))+')';
          ctx.stroke();
        }
      }

      // A translucent band protects hero legibility without hiding all motion.
      for(const flow of flows) {
        const c=curve(flow,sceneTime);
        const rgb=colors[flow.color];
        const foreground=point(c,.52);
        const behindText=foreground.x<width*.46 && foreground.y>height*.20 && foreground.y<height*.71;
        const strength=behindText?.58:1;
        drawCurve(c);
        ctx.strokeStyle='rgba('+rgb+','+(flow.alpha*strength)+')';
        ctx.lineWidth=.8;
        ctx.stroke();

        const t=motion.matches?flow.start:(flow.start+(now-started)*flow.speed)%1;
        const previous=Math.max(0,t-.075);
        // Short tapered streak rather than synchronized rows of arrows.
        const length=8;
        for(let k=0;k<length;k++) {
          const a=point(c,mix(previous,t,k/length));
          const b=point(c,mix(previous,t,(k+1)/length));
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.lineWidth=.95+k/length*.85;
          ctx.strokeStyle='rgba('+rgb+','+((.025+.42*k/length)*strength)+')';
          ctx.stroke();
        }
        const tip=point(c,t);
        // Only occasional tiny direction markers; dots are the default.
        if(flow.seed%3<1) {
          const back=point(c,Math.max(0,t-.01));
          const angle=Math.atan2(tip.y-back.y,tip.x-back.x);
          const size=3.5;
          ctx.beginPath();ctx.moveTo(tip.x-Math.cos(angle-.58)*size,tip.y-Math.sin(angle-.58)*size);
          ctx.lineTo(tip.x,tip.y);
          ctx.lineTo(tip.x-Math.cos(angle+.58)*size,tip.y-Math.sin(angle+.58)*size);
          ctx.lineWidth=.85;ctx.strokeStyle='rgba('+rgb+','+(.62*strength)+')';ctx.stroke();
        } else {
          ctx.beginPath();ctx.arc(tip.x,tip.y,1.05,0,Math.PI*2);
          ctx.fillStyle='rgba('+rgb+','+(.62*strength)+')';ctx.fill();
        }
      }

      // Soft focal glow replaces fixed radar / target rings.
      for(const f of foci) {
        const p=focusPosition(f,sceneTime);
        const intensity=(Math.sin(sceneTime*.0007+f.seed)+1)/2;
        const glow=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,46);
        glow.addColorStop(0,'rgba(121,177,235,'+(.12+intensity*.12)+')');
        glow.addColorStop(.34,'rgba(110,157,214,.045)');
        glow.addColorStop(1,'rgba(110,157,214,0)');
        ctx.beginPath();ctx.arc(p.x,p.y,46,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
        ctx.beginPath();ctx.arc(p.x,p.y,1.9+intensity*.8,0,Math.PI*2);
        ctx.fillStyle='rgba(157,197,238,.55)';ctx.fill();
      }

      if(visible&&!motion.matches) frame=requestAnimationFrame(paint);
    }

    function restart() {
      cancelAnimationFrame(frame);
      if(visible)paint(performance.now());
    }
    const onResize=()=>{makeScene();restart();};
    const onVisibility=()=>{visible=!document.hidden;restart();};
    window.addEventListener('resize',onResize,{passive:true});
    document.addEventListener('visibilitychange',onVisibility);
    motion.addEventListener('change',restart);
    makeScene();
    restart();
  }
}
