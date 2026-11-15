/**
 * Decorative attack/defense flows for the experimental homepage.
 * Illustrated network behavior only — not real attacks or live telemetry.
 *
 * Three distributed interception hubs; curved, directional packet paths.
 * Honors reduced-motion preferences and pauses in background tabs.
 */
const canvas = document.getElementById('telemetry-bg') as HTMLCanvasElement | null;

if (canvas) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    type Point = { x: number; y: number };
    type Route = { from: Point; c1: Point; c2: Point; to: Point;
      tone: 'attack' | 'defense'; phase: number; speed: number; alpha: number; };
    type Hub = Point & { phase: number };
    type Node = Point & { radius: number };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const palette = { attack: '245,88,119', defense: '73,159,255' };
    let width = 0, height = 0, frame = 0;
    let routes: Route[] = [], hubs: Hub[] = [], nodes: Node[] = [];
    let running = !document.hidden;
    const launched = performance.now();
    const rand = (n: number) => {
      const f = Math.sin(n * 127.13 + 18.73) * 43758.5453;
      return f - Math.floor(f);
    };
    const pt = (x: number, y: number): Point => ({ x:x*width, y:y*height });
    const position = (r: Route, t: number): Point => {
      const u=1-t;
      return {x:u*u*u*r.from.x+3*u*u*t*r.c1.x+3*u*t*t*r.c2.x+t*t*t*r.to.x,
              y:u*u*u*r.from.y+3*u*u*t*r.c1.y+3*u*t*t*r.c2.y+t*t*t*r.to.y};
    };
    const tangent = (r: Route, t: number): Point => {
      const u=1-t;
      return {x:3*u*u*(r.c1.x-r.from.x)+6*u*t*(r.c2.x-r.c1.x)+3*t*t*(r.to.x-r.c2.x),
              y:3*u*u*(r.c1.y-r.from.y)+6*u*t*(r.c2.y-r.c1.y)+3*t*t*(r.to.y-r.c2.y)};
    };
    const route = (from:Point,to:Point,tone:Route['tone'],id:number,curvature:number) => {
      const dx=to.x-from.x,dy=to.y-from.y;
      const length=Math.max(1,Math.hypot(dx,dy));
      const nx=-dy/length,ny=dx/length;
      const bend=Math.min(width,height)*curvature;
      const startOffset=(rand(id+26)-.5)*18;
      const endOffset=(rand(id+64)-.5)*15;
      const a={x:from.x+nx*startOffset,y:from.y+ny*startOffset};
      const b={x:to.x+nx*endOffset,y:to.y+ny*endOffset};
      const x=b.x-a.x,y=b.y-a.y;
      routes.push({
        from:a,to:b,tone,
        c1:{x:a.x+x*.30+nx*bend,y:a.y+y*.30+ny*bend},
        c2:{x:a.x+x*.72+nx*bend*.8,y:a.y+y*.72+ny*bend*.8},
        phase:rand(id*19+7), speed:.000021+rand(id+97)*.000021,
        alpha:.145+rand(id+43)*.11
      });
    };

    const rebuild=()=>{
      width=window.innerWidth;height=window.innerHeight;
      const dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(width*dpr);
      canvas.height=Math.round(height*dpr);
      canvas.style.width=width+'px';
      canvas.style.height=height+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      routes=[];

      // Distinct areas of activity, not a single line running across the page.
      const compact=width<700;
      hubs= (compact
        ? [pt(.83,.22),pt(.22,.68),pt(.82,.86)]
        : [pt(.84,.24),pt(.21,.73),pt(.74,.84)]
      ).map((p,i)=>({...p,phase:i*2.1}));

      // Origins are distributed around each hub; each bundle approaches
      // from a different angle, so curves converge instead of forming roads.
      const sets=[
        {hub:0,attack:[[-.08,.06],[.49,-.09],[1.08,.55]],
          defense:[[.50,.56],[1.05,.08],[.72,.62]]},
        {hub:1,attack:[[.07,.26],[.55,1.10],[-.09,.93]],
          defense:[[.55,.43],[-.06,.52],[.46,.94]]},
        {hub:2,attack:[[1.08,.47],[.47,1.10],[.99,1.10]],
          defense:[[.47,.57],[.49,.94],[1.07,.77]]}
      ];
      let id=0;
      sets.forEach((set,index)=>{
        const destination=hubs[set.hub];
        const add=(origins:number[][],tone:Route['tone'])=>{
          origins.forEach(([x,y],j)=>{
            // Only 1–2 nearby parallel paths per origin: organic but visible.
            const count=compact?1:(j===0?2:1);
            for(let k=0;k<count;k++){
              const shift=(k-(count-1)/2)*.018;
              const origin=pt(x+shift, y+shift*.6);
              const bend=(index%2===0?1:-1)*(.10+.05*rand(id+13))*(j%2===0?1:-1);
              route(origin,destination,tone,++id,bend);
            }
          });
        };
        add(set.attack,'attack');
        add(set.defense,'defense');
      });

      // Small, irregular ambient nodes evoke the organic original background.
      const count=compact?18:37;
      nodes=Array.from({length:count},(_,i)=>({
        ...pt(.015+rand(i+21)*.97,.025+rand(i+101)*.95),
        radius:.65+rand(i+210)*.9
      }));
    };

    const draw=(time:number)=>{
      ctx.clearRect(0,0,width,height);
      const elapsed=time-launched;

      // Quiet background connections; avoid dense triangle meshes.
      nodes.forEach((a,i)=>{
        ctx.beginPath();
        ctx.arc(a.x,a.y,a.radius,0,Math.PI*2);
        ctx.fillStyle='rgba(171,194,212,.20)';
        ctx.fill();
        nodes.forEach((b,j)=>{
          if(j<=i)return;
          const distance=Math.hypot(b.x-a.x,b.y-a.y);
          const max=width<700?120:185;
          if(distance>max || rand(i*73+j*27)>.40)return;
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.lineWidth=.7;
          ctx.strokeStyle='rgba(117,149,183,'+(0.052*(1-distance/max))+')';
          ctx.stroke();
        });
      });

      for(const r of routes){
        const rgb=palette[r.tone];
        ctx.beginPath();ctx.moveTo(r.from.x,r.from.y);
        ctx.bezierCurveTo(r.c1.x,r.c1.y,r.c2.x,r.c2.y,r.to.x,r.to.y);
        ctx.lineWidth=.85;
        ctx.strokeStyle='rgba('+rgb+','+r.alpha+')';
        ctx.stroke();

        const t=reduced.matches?r.phase:(r.phase+elapsed*r.speed)%1;
        const tail=Math.max(0,t-.095);
        const n=10;
        for(let j=0;j<n;j++){
          const a=position(r,tail+(t-tail)*j/n);
          const b=position(r,tail+(t-tail)*(j+1)/n);
          ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);
          ctx.lineWidth=1.5;
          ctx.strokeStyle='rgba('+rgb+','+(.04+.58*j/n)+')';
          ctx.stroke();
        }

        // Directional chevron at the packet's tip: small, not a thick arrow.
        const head=position(r,t), delta=tangent(r,t);
        const angle=Math.atan2(delta.y,delta.x);
        const size=width<700?4:5;
        ctx.beginPath();
        ctx.moveTo(head.x-Math.cos(angle-.55)*size,head.y-Math.sin(angle-.55)*size);
        ctx.lineTo(head.x,head.y);
        ctx.lineTo(head.x-Math.cos(angle+.55)*size,head.y-Math.sin(angle+.55)*size);
        ctx.lineWidth=1.25;
        ctx.strokeStyle='rgba('+rgb+',.78)';
        ctx.stroke();
      }

      // Detection/interception: a small blue ring absorbs red/blue arrivals.
      hubs.forEach((hub,i)=>{
        const phase = reduced.matches ? 0.5 : (Math.sin(elapsed * .0010 + hub.phase) + 1) / 2;
        const size=9+phase*6;
        const halo=ctx.createRadialGradient(hub.x,hub.y,0,hub.x,hub.y,44);
        halo.addColorStop(0,'rgba(101,184,242,'+(.17+phase*.12)+')');
        halo.addColorStop(.42,'rgba(107,138,197,.065)');
        halo.addColorStop(1,'rgba(107,138,197,0)');
        ctx.fillStyle=halo;
        ctx.beginPath();ctx.arc(hub.x,hub.y,44,0,Math.PI*2);ctx.fill();

        ctx.beginPath();ctx.arc(hub.x,hub.y,size,0,Math.PI*2);
        ctx.strokeStyle='rgba(132,195,235,'+(.30+phase*.18)+')';
        ctx.lineWidth=.9;ctx.stroke();
        ctx.beginPath();ctx.arc(hub.x,hub.y,2.6,0,Math.PI*2);
        ctx.fillStyle='rgba(153,210,249,.7)';ctx.fill();
      });

      if(running&&!reduced.matches)frame=requestAnimationFrame(draw);
    };
    const restart=()=>{
      cancelAnimationFrame(frame);
      if(running)draw(performance.now());
    };
    const resize=()=>{rebuild();restart();};
    const visibility=()=>{running=!document.hidden;restart();};
    window.addEventListener('resize',resize,{passive:true});
    document.addEventListener('visibilitychange',visibility);
    reduced.addEventListener('change',restart);
    rebuild();
    restart();
  }
}
