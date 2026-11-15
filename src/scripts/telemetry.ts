/**
 * Original Underground Labs particle network, with sparse colored links.
 * Most links remain neutral. A few blue/red links represent abstract traffic.
 * No attack simulation, route animation, arrows, halos, or fixed destinations.
 */
const canvas = document.getElementById('telemetry-bg') as HTMLCanvasElement | null;

if (canvas) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    type Particle = { x:number; y:number; vx:number; vy:number; r:number };
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mouse = { x:-9999, y:-9999 };
    let width=0, height=0, raf=0, particles:Particle[]=[];
    let running=!document.hidden;
    let last=0;

    const random=(min:number,max:number)=>Math.random()*(max-min)+min;

    // Stable assignments, so blue and red are PART of the mesh, not an overlay.
    const linkKind=(i:number,j:number)=>{
      const code=((i+1)*43+(j+1)*67+(i*j)*17)%101;
      if(code<4)return 'red';
      if(code<11)return 'blue';
      return 'neutral';
    };

    function resize(){
      width=window.innerWidth;
      height=window.innerHeight;
      const ratio=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.round(width*ratio);
      canvas.height=Math.round(height*ratio);
      canvas.style.width=width+'px';
      canvas.style.height=height+'px';
      ctx.setTransform(ratio,0,0,ratio,0,0);
      const count=width<768?42:78;
      particles=Array.from({length:count},()=>({
        x:random(0,width),y:random(0,height),
        vx:random(-.18,.18),vy:random(-.18,.18),
        r:random(.7,1.8)
      }));
    }

    function background(){
      const grad=ctx.createLinearGradient(0,0,width,height);
      grad.addColorStop(0,'#06070a');
      grad.addColorStop(.5,'#090b12');
      grad.addColorStop(1,'#050608');
      ctx.fillStyle=grad;
      ctx.fillRect(0,0,width,height);
    }

    function animate(){
      const distanceLimit=width<768?120:150;
      background();
      if(!reduced.matches){
        for(const p of particles){
          p.x+=p.vx;
          p.y+=p.vy;
          if(p.x<=0||p.x>=width)p.vx*=-1;
          if(p.y<=0||p.y>=height)p.vy*=-1;
          const dx=mouse.x-p.x,dy=mouse.y-p.y;
          const distance=Math.hypot(dx,dy);
          if(distance<140&&distance>0){
            const force=(140-distance)/140;
            p.x-=dx/distance*force*.35;
            p.y-=dy/distance*force*.35;
          }
        }
      }

      for(let i=0;i<particles.length;i++){
        for(let j=i+1;j<particles.length;j++){
          const a=particles[i], b=particles[j];
          const dist=Math.hypot(a.x-b.x,a.y-b.y);
          if(dist>=distanceLimit)continue;

          const proximity=1-dist/distanceLimit;
          const kind=linkKind(i,j);
          // Neutral links retain the look of the original animation.
          // Rare colored links are slightly clearer, but have no glow.
          if(kind==='red'){
            ctx.strokeStyle='rgba(230,89,110,'+(proximity*.32)+')';
            ctx.lineWidth=.9;
          }else if(kind==='blue'){
            ctx.strokeStyle='rgba(71,153,241,'+(proximity*.32)+')';
            ctx.lineWidth=.9;
          }else{
            ctx.strokeStyle='rgba(170,190,255,'+(proximity*.16)+')';
            ctx.lineWidth=.7;
          }
          ctx.beginPath();
          ctx.moveTo(a.x,a.y);
          ctx.lineTo(b.x,b.y);
          ctx.stroke();
        }
      }
      for(const p of particles){
        ctx.fillStyle='rgba(220,228,255,.38)';
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
        ctx.fill();
      }
    }

    const draw=(time:number)=>{
      // Cap frame rate slightly; preserve the original gentle particle velocity.
      if(time-last>=1000/40){
        animate();
        last=time;
      }
      if(running&&!reduced.matches)raf=requestAnimationFrame(draw);
    };
    const restart=()=>{
      cancelAnimationFrame(raf);
      last=0;
      if(running){
        animate();
        if(!reduced.matches)raf=requestAnimationFrame(draw);
      }
    };
    const handleVisibility=()=>{running=!document.hidden;restart();};
    window.addEventListener('resize',()=>{resize();restart();},{passive:true});
    window.addEventListener('mousemove',(event:MouseEvent)=>{mouse.x=event.clientX;mouse.y=event.clientY;},{passive:true});
    window.addEventListener('mouseleave',()=>{mouse.x=-9999;mouse.y=-9999;});
    document.addEventListener('visibilitychange',handleVisibility);
    reduced.addEventListener('change',restart);
    resize();
    restart();
  }
}
