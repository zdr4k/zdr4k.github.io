/**
 * Abstract defensive-telemetry artwork. Curving blue and red streams
 * are decorative, not live attacks or real security events.
 */
const canvas = document.getElementById('telemetry-bg') as HTMLCanvasElement | null;

if (canvas) {
  const context = canvas.getContext('2d');
  if (context) {
    type Stream = {
      startX: number; startY: number; endX: number; endY: number;
      controlX: number; controlY: number;
      tint: 'blue' | 'red'; phase: number; duration: number; opacity: number;
    };

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let streams: Stream[] = [];
    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = !document.hidden;
    let startedAt = performance.now();

    const pointOnCurve = (stream: Stream, t: number) => {
      const a = (1 - t) * (1 - t);
      const b = 2 * (1 - t) * t;
      const c = t * t;
      return {
        x: a * stream.startX + b * stream.controlX + c * stream.endX,
        y: a * stream.startY + b * stream.controlY + c * stream.endY,
      };
    };

    const createStreams = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = width < 700 ? 8 : 17;
      streams = Array.from({ length: count }, (_, i) => {
        const direction = i % 2 === 0 ? 1 : -1;
        const row = (i * 0.61803398875) % 1;
        const startX = direction > 0 ? -width * 0.2 : width * 1.2;
        const endX = direction > 0 ? width * 1.2 : -width * 0.2;
        const startY = height * (0.13 + row * 0.76);
        const endY = height * (0.12 + ((row + 0.23 + (i % 3) * 0.13) % 0.78));
        return {
          startX, startY, endX, endY,
          controlX: width * (0.30 + (i % 4) * 0.14),
          controlY: height * (0.10 + ((i * 0.37) % 0.78)),
          tint: i % 4 === 0 ? 'red' as const : 'blue' as const,
          phase: (i * 0.381966) % 1,
          duration: 18000 + (i % 5) * 3400,
          opacity: i % 4 === 0 ? 0.09 : 0.11,
        };
      });
    };

    const render = (now: number) => {
      context.clearRect(0, 0, width, height);
      for (const stream of streams) {
        const red = stream.tint === 'red';
        const rgb = red ? '243,89,117' : '61,143,245';
        context.beginPath();
        context.moveTo(stream.startX, stream.startY);
        context.quadraticCurveTo(stream.controlX, stream.controlY, stream.endX, stream.endY);
        context.strokeStyle = 'rgba(' + rgb + ',' + stream.opacity + ')';
        context.lineWidth = 0.9;
        context.stroke();

        const t = reducedMotion.matches ? stream.phase : (stream.phase + (now - startedAt) / stream.duration) % 1;
        const p = pointOnCurve(stream, t);
        const trail = pointOnCurve(stream, Math.max(0, t - 0.045));
        const gradient = context.createLinearGradient(trail.x, trail.y, p.x, p.y);
        gradient.addColorStop(0, 'rgba(' + rgb + ',0)');
        gradient.addColorStop(1, 'rgba(' + rgb + ',0.50)');
        context.beginPath();
        context.moveTo(trail.x, trail.y);
        context.lineTo(p.x, p.y);
        context.strokeStyle = gradient;
        context.lineWidth = 1.5;
        context.stroke();

        context.beginPath();
        context.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        context.fillStyle = 'rgba(' + rgb + ',0.38)';
        context.fill();
      }
      if (!reducedMotion.matches && visible) frame = requestAnimationFrame(render);
    };

    const restart = () => {
      cancelAnimationFrame(frame);
      render(performance.now());
    };
    const resize = () => { createStreams(); restart(); };
    const handleVisibility = () => { visible = !document.hidden; restart(); };

    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    reducedMotion.addEventListener('change', restart);
    createStreams();
    restart();
  }
}
