// Exact animated background from main, with only a few line colors changed.
(() => {
        const canvas = document.getElementById('telemetry-bg');
        if (!canvas) return;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
    
        let width = 0;
        let height = 0;
        let animationFrame = 0;
        let particles = [];
        let mouse = { x: -9999, y: -9999 };
    
        const PARTICLE_COUNT = reduceMotion ? 0 : isMobile ? 42 : 78;
        const LINK_DISTANCE = isMobile ? 120 : 150;
        const MOUSE_RADIUS = 140;
    
        function resize() {
          width = window.innerWidth;
          height = window.innerHeight;
          canvas.width = width * Math.min(window.devicePixelRatio || 1, 2);
          canvas.height = height * Math.min(window.devicePixelRatio || 1, 2);
          canvas.style.width = width + 'px';
          canvas.style.height = height + 'px';
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.scale(Math.min(window.devicePixelRatio || 1, 2), Math.min(window.devicePixelRatio || 1, 2));
          createParticles();
        }
    
        function random(min, max) {
          return Math.random() * (max - min) + min;
        }
    
        function createParticles() {
          particles = [];
          for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push({
              x: random(0, width),
              y: random(0, height),
              vx: random(-0.18, 0.18),
              vy: random(-0.18, 0.18),
              r: random(0.7, 1.8)
            });
          }
        }
    
        function drawBackground() {
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, '#06070a');
          gradient.addColorStop(0.5, '#090b12');
          gradient.addColorStop(1, '#050608');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);
        }
    
        function updateParticles() {
          for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
    
            if (p.x <= 0 || p.x >= width) p.vx *= -1;
            if (p.y <= 0 || p.y >= height) p.vy *= -1;
    
            const dx = mouse.x - p.x;
            const dy = mouse.y - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
    
            if (dist < MOUSE_RADIUS && dist > 0) {
              const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
              p.x -= (dx / dist) * force * 0.35;
              p.y -= (dy / dist) * force * 0.35;
            }
          }
        }
    
        function drawConnections() {
          for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
              const a = particles[i];
              const b = particles[j];
              const dx = a.x - b.x;
              const dy = a.y - b.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
    
              if (dist < LINK_DISTANCE) {
                const opacity = (1 - dist / LINK_DISTANCE) * 0.16;
                const lineId = ((i + 1) * 37 + (j + 1) * 17) % 100;
                const color = lineId < 5
                  ? '235, 85, 110'  // 5% subtle red connections
                  : lineId < 15
                    ? '70, 150, 245' // 10% subtle blue connections
                    : '170, 190, 255'; // original color
                ctx.strokeStyle = `rgba(${color}, ${opacity})`;
                ctx.lineWidth = 0.7;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
              }
            }
          }
        }
    
        function drawParticles() {
          for (const p of particles) {
            ctx.fillStyle = 'rgba(220, 228, 255, 0.38)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
        }
    
        function draw() {
          drawBackground();
          updateParticles();
          drawConnections();
          drawParticles();
          animationFrame = requestAnimationFrame(draw);
        }
    
        function handleMouseMove(event) {
          mouse.x = event.clientX;
          mouse.y = event.clientY;
        }
    
        function handleMouseLeave() {
          mouse.x = -9999;
          mouse.y = -9999;
        }
    
        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
    
        resize();
    
        if (!reduceMotion) {
          draw();
        } else {
          drawBackground();
        }
      })();
