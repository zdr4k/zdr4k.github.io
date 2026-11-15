/**
 * Dynamic Threat Network (decorative, not live security telemetry).
 *
 * The graph itself moves: local connections appear/disappear as particles drift.
 * Red and blue packets travel along those actual links, changing paths at nodes.
 * Opposing packets briefly light up nodes when their arrivals coincide.
 */
const canvas = document.getElementById('telemetry-bg') as HTMLCanvasElement | null;

if (canvas) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    type Tone = 'attack' | 'defense';
    type Node = { x: number; y: number; vx: number; vy: number; radius: number };
    type Link = { a: number; b: number; strength: number };
    type Packet = {
      from: number; to: number; progress: number; speed: number;
      tone: Tone; previous: number; target: number;
    };
    type Spark = { node: number; born: number };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const colors: Record<Tone, string> = {
      attack: '240,82,123',
      defense: '74,162,255',
    };
    const pick = (arr: number[]) => arr[Math.floor(Math.random() * arr.length)];
    let width = 0, height = 0, ratio = 1, maxLink = 165;
    let nodes: Node[] = [], links: Link[] = [], neighbors: number[][] = [];
    let packets: Packet[] = [], sparks: Spark[] = [];
    let arrivals: Array<{ attack: number; defense: number }> = [];
    let raf = 0;
    let active = !document.hidden;
    let lastFrame = 0;
    let lastGraphBuild = 0;

    const makeGraph = () => {
      links = [];
      neighbors = nodes.map(() => []);
      const maxSq = maxLink * maxLink;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const distSq = dx * dx + dy * dy;
          if (distSq >= maxSq) continue;
          const distance = Math.sqrt(distSq);
          const strength = 1 - distance / maxLink;
          links.push({ a: i, b: j, strength });
          neighbors[i].push(j);
          neighbors[j].push(i);
        }
      }
    };

    const findNext = (from: number, previous: number, target: number): number => {
      const possible = neighbors[from];
      if (!possible?.length) return from;
      const options = possible.filter(id => id !== previous);
      const candidates = options.length ? options : possible;
      // A mild destination bias makes flows feel purposeful, but not scripted.
      if (Math.random() < 0.6) {
        const goal = nodes[target];
        return [...candidates]
          .sort((a, b) =>
            Math.hypot(nodes[a].x - goal.x, nodes[a].y - goal.y) -
            Math.hypot(nodes[b].x - goal.x, nodes[b].y - goal.y)
          )[Math.floor(Math.random() * Math.min(3, candidates.length))];
      }
      return pick(candidates);
    };

    const setup = () => {
      width = innerWidth;
      height = innerHeight;
      ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * ratio);
      canvas.height = Math.floor(height * ratio);
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      maxLink = width < 700 ? 132 : 175;

      const count = width < 700 ? 40 : Math.min(98, Math.max(69, Math.floor(width * height / 15000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * .19,
        vy: (Math.random() - 0.5) * .19,
        radius: .7 + Math.random() * 1.15,
      }));
      makeGraph();

      // A few destinations are living nodes, not fixed geometric targets.
      const anchors = [0, Math.floor(count * .35), Math.floor(count * .72)];
      const packetCount = width < 700 ? 9 : 17;
      packets = Array.from({ length: packetCount }, (_, i) => {
        const origin = Math.floor(Math.random() * nodes.length);
        const available = neighbors[origin];
        return {
          from: origin,
          to: available.length ? pick(available) : origin,
          previous: -1,
          progress: Math.random(),
          speed: .00027 + Math.random() * .00022,
          tone: i % 3 === 0 ? 'attack' : 'defense',
          target: anchors[i % anchors.length],
        };
      });
      arrivals = nodes.map(() => ({ attack: -1e9, defense: -1e9 }));
      sparks = [];
      lastFrame = 0;
      lastGraphBuild = 0;
    };

    const advance = (dt: number, now: number) => {
      for (const node of nodes) {
        node.x += node.vx * dt / 16.67;
        node.y += node.vy * dt / 16.67;
        if (node.x < -9 || node.x > width + 9) node.vx *= -1;
        if (node.y < -9 || node.y > height + 9) node.vy *= -1;
      }
      // Refresh local relationships regularly without rebuilding on every frame.
      if (now - lastGraphBuild > 180) {
        makeGraph();
        lastGraphBuild = now;
      }

      for (const packet of packets) {
        if (packet.from === packet.to) {
          const possible = neighbors[packet.from];
          if (possible?.length) packet.to = pick(possible);
          continue;
        }
        const a = nodes[packet.from], b = nodes[packet.to];
        const length = Math.max(20, Math.hypot(a.x - b.x, a.y - b.y));
        packet.progress += packet.speed * dt * (100 / length);
        if (packet.progress < 1) continue;

        const arrivedAt = packet.to;
        const recent = arrivals[arrivedAt];
        recent[packet.tone] = now;
        const opposing: Tone = packet.tone === 'attack' ? 'defense' : 'attack';
        if (now - recent[opposing] < 1800) {
          sparks.push({ node: arrivedAt, born: now });
          recent.attack = recent.defense = -1e9;
        }

        if (Math.random() < .18) packet.target = Math.floor(Math.random() * nodes.length);
        const next = findNext(arrivedAt, packet.from, packet.target);
        packet.previous = packet.from;
        packet.from = arrivedAt;
        packet.to = next;
        packet.progress = 0;
      }
      sparks = sparks.filter(s => now - s.born < 950);
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      // The original organic look comes from proximity-based local edges.
      for (const link of links) {
        const a = nodes[link.a], b = nodes[link.b];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineWidth = .7;
        ctx.strokeStyle = 'rgba(126,156,186,' + (.038 + link.strength * .12) + ')';
        ctx.stroke();
      }
      for (const node of nodes) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(197,214,233,.41)';
        ctx.fill();
      }

      // Defensive and hostile flows share the SAME evolving graph.
      for (const packet of packets) {
        const a = nodes[packet.from], b = nodes[packet.to];
        const t = Math.max(0, Math.min(1, packet.progress));
        const x = a.x + (b.x - a.x) * t;
        const y = a.y + (b.y - a.y) * t;
        const rgb = colors[packet.tone];
        const tail = Math.max(0, t - .23);

        const gradient = ctx.createLinearGradient(
          a.x + (b.x - a.x) * tail, a.y + (b.y - a.y) * tail, x, y
        );
        gradient.addColorStop(0, 'rgba(' + rgb + ',0)');
        gradient.addColorStop(1, 'rgba(' + rgb + ',.80)');
        ctx.beginPath();
        ctx.moveTo(a.x + (b.x - a.x) * tail, a.y + (b.y - a.y) * tail);
        ctx.lineTo(x, y);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.8;
        ctx.stroke();

        const glow = ctx.createRadialGradient(x, y, 0, x, y, 10);
        glow.addColorStop(0, 'rgba(' + rgb + ',.33)');
        glow.addColorStop(1, 'rgba(' + rgb + ',0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, 1.9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(' + rgb + ',.90)';
        ctx.fill();
      }

      // Brief, soft interception flashes where opposite packets meet.
      for (const spark of sparks) {
        const node = nodes[spark.node];
        const age = Math.min(1, (now - spark.born) / 950);
        const radius = 5 + age * 20;
        const opacity = (1 - age) * .5;
        ctx.beginPath(); ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(153,203,244,' + opacity + ')';
        ctx.lineWidth = 1.15;
        ctx.stroke();
      }
    };

    const tick = (now: number) => {
      const dt = lastFrame ? Math.min(45, now - lastFrame) : 16.67;
      lastFrame = now;
      if (!reduced.matches) advance(dt, now);
      draw(now);
      if (active && !reduced.matches) raf = requestAnimationFrame(tick);
    };

    const restart = () => {
      cancelAnimationFrame(raf);
      lastFrame = 0;
      if (active) raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => { active = !document.hidden; restart(); };
    window.addEventListener('resize', () => { setup(); restart(); }, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reduced.addEventListener('change', restart);
    setup();
    restart();
  }
}
