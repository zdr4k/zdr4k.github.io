// Decorative telemetry paths: an illustrative animation, not actual threat activity.
const canvas=document.getElementById('telemetry-bg') as HTMLCanvasElement | null;
if(canvas){
  const ctx=canvas.getContext('2d');
  if(ctx){
    const mq=window.matchMedia('(prefers-reduced-motion: reduce)');
    type Route={x1:number;y1:number;x2:number;y2:number;phase:number;speed:number;alpha:number};
    let routes:Route[]=[];
    let w=0,h=0,dpr=1,raf=0;
    let isVisible=true;
    const build=()=>{
      w=window.innerWidth;h=window.innerHeight;
      dpr=Math.min(window.devicePixelRatio||1,2);
      canvas.width=Math.floor(w*dpr);canvas.height=Math.floor(h*dpr);
      canvas.style.width=w+'px';canvas.style.height=h+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const cols=w<700?5:9;
      const rows=h<550?4:7;
      routes=[];
      for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
        const x1=(i+.2)/cols*w;
        const y1=(j+.3)/rows*h;
        if((i+j)%3===0){
          routes.push({x1,y1,x2:x1+(w/cols)*(1.1+((i+j)%2)*.45),y2:y1+(h/rows)*((i%2)?-.5:.55),phase:((i*11+j*7)%23)/23,speed:.00007+((i+j)%4)*.000025,alpha:.05+((i+j)%3)*.018});
        }
      }
      render(0,true);
    };
    const render=(time:number,staticFrame=false)=>{
      if(!ctx)return;
      ctx.clearRect(0,0,w,h);
      for(const line of routes){
        ctx.strokeStyle='rgba(113,169,182,'+line.alpha+')';
        ctx.lineWidth=.75;
        ctx.beginPath();ctx.moveTo(line.x1,line.y1);ctx.lineTo(line.x2,line.y2);ctx.stroke();
        const t=(line.phase+time*line.speed)%1;
        const x=line.x1+(line.x2-line.x1)*t,y=line.y1+(line.y2-line.y1)*t;
        ctx.beginPath();ctx.fillStyle='rgba(139,204,189,.28)';ctx.arc(x,y,1.6,0,Math.PI*2);ctx.fill();
      }
      if(!staticFrame&&!mq.matches&&isVisible)raf=requestAnimationFrame(t=>render(t));
    };
    const start=()=>{cancelAnimationFrame(raf);render(0,mq.matches||!isVisible);};
    const handleVisibility=()=>{isVisible=!document.hidden;start();};
    window.addEventListener('resize',build,{passive:true});
    document.addEventListener('visibilitychange',handleVisibility);
    mq.addEventListener('change',start);
    build();start();
  }
}
