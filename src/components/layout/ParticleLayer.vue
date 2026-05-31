<template>
  <div class="particle-layer" aria-hidden="true">
    <span v-for="p in particles" :key="p.id" class="particle" :style="p.style" />
  </div>
</template>

<script setup>
const particles = [
  // ── Left edge cluster (amber fireflies) ──
  { id:  1, style: { left: '2%',  top: '72%', animationDuration: '9s',  animationDelay: '0s',   '--size': '3px', '--color': 'rgba(232,168,40,0.9)',  '--glow': 'rgba(232,168,40,0.45)' } },
  { id:  2, style: { left: '5%',  top: '80%', animationDuration: '12s', animationDelay: '2s',   '--size': '2px', '--color': 'rgba(255,200,80,0.8)',  '--glow': 'rgba(255,200,80,0.4)'  } },
  { id:  3, style: { left: '8%',  top: '65%', animationDuration: '8s',  animationDelay: '4s',   '--size': '4px', '--color': 'rgba(248,190,70,0.95)', '--glow': 'rgba(248,190,70,0.5)'  } },
  { id:  4, style: { left: '3%',  top: '55%', animationDuration: '14s', animationDelay: '1s',   '--size': '2px', '--color': 'rgba(232,168,40,0.75)', '--glow': 'rgba(232,168,40,0.35)' } },
  { id:  5, style: { left: '11%', top: '75%', animationDuration: '10s', animationDelay: '6s',   '--size': '3px', '--color': 'rgba(255,210,90,0.85)', '--glow': 'rgba(255,210,90,0.4)'  } },
  { id:  6, style: { left: '6%',  top: '45%', animationDuration: '11s', animationDelay: '3.5s', '--size': '2px', '--color': 'rgba(232,168,40,0.7)',  '--glow': 'rgba(232,168,40,0.3)'  } },
  { id:  7, style: { left: '13%', top: '60%', animationDuration: '9s',  animationDelay: '7.5s', '--size': '3px', '--color': 'rgba(248,190,70,0.85)', '--glow': 'rgba(248,190,70,0.4)'  } },

  // ── Left edge cluster (cyan magic) ──
  { id:  8, style: { left: '1%',  top: '40%', animationDuration: '13s', animationDelay: '1.5s', '--size': '2px', '--color': 'rgba(100,210,240,0.85)', '--glow': 'rgba(100,210,240,0.4)' } },
  { id:  9, style: { left: '9%',  top: '50%', animationDuration: '10s', animationDelay: '5s',   '--size': '3px', '--color': 'rgba(130,225,255,0.9)',  '--glow': 'rgba(130,225,255,0.45)' } },
  { id: 10, style: { left: '4%',  top: '30%', animationDuration: '15s', animationDelay: '8s',   '--size': '2px', '--color': 'rgba(110,215,245,0.8)',  '--glow': 'rgba(110,215,245,0.4)'  } },

  // ── Right edge cluster (amber fireflies) ──
  { id: 11, style: { left: '88%', top: '70%', animationDuration: '9s',  animationDelay: '0.5s', '--size': '3px', '--color': 'rgba(232,168,40,0.9)',  '--glow': 'rgba(232,168,40,0.45)' } },
  { id: 12, style: { left: '92%', top: '78%', animationDuration: '11s', animationDelay: '3s',   '--size': '2px', '--color': 'rgba(255,200,80,0.8)',  '--glow': 'rgba(255,200,80,0.4)'  } },
  { id: 13, style: { left: '96%', top: '62%', animationDuration: '8s',  animationDelay: '5s',   '--size': '4px', '--color': 'rgba(248,190,70,0.95)', '--glow': 'rgba(248,190,70,0.5)'  } },
  { id: 14, style: { left: '85%', top: '55%', animationDuration: '13s', animationDelay: '1s',   '--size': '2px', '--color': 'rgba(232,168,40,0.75)', '--glow': 'rgba(232,168,40,0.35)' } },
  { id: 15, style: { left: '90%', top: '45%', animationDuration: '10s', animationDelay: '6.5s', '--size': '3px', '--color': 'rgba(255,210,90,0.85)', '--glow': 'rgba(255,210,90,0.4)'  } },
  { id: 16, style: { left: '94%', top: '72%', animationDuration: '12s', animationDelay: '2.5s', '--size': '2px', '--color': 'rgba(232,168,40,0.7)',  '--glow': 'rgba(232,168,40,0.3)'  } },
  { id: 17, style: { left: '87%', top: '82%', animationDuration: '9s',  animationDelay: '8s',   '--size': '3px', '--color': 'rgba(248,190,70,0.85)', '--glow': 'rgba(248,190,70,0.4)'  } },

  // ── Right edge cluster (cyan magic) ──
  { id: 18, style: { left: '97%', top: '38%', animationDuration: '14s', animationDelay: '0s',   '--size': '2px', '--color': 'rgba(100,210,240,0.85)', '--glow': 'rgba(100,210,240,0.4)' } },
  { id: 19, style: { left: '91%', top: '50%', animationDuration: '10s', animationDelay: '4.5s', '--size': '3px', '--color': 'rgba(130,225,255,0.9)',  '--glow': 'rgba(130,225,255,0.45)' } },
  { id: 20, style: { left: '86%', top: '35%', animationDuration: '12s', animationDelay: '7s',   '--size': '2px', '--color': 'rgba(110,215,245,0.8)',  '--glow': 'rgba(110,215,245,0.4)'  } },

  // ── Very sparse center (just 3 — barely noticeable) ──
  { id: 21, style: { left: '45%', top: '75%', animationDuration: '18s', animationDelay: '9s',   '--size': '2px', '--color': 'rgba(232,168,40,0.4)',  '--glow': 'rgba(232,168,40,0.18)' } },
  { id: 22, style: { left: '55%', top: '68%', animationDuration: '20s', animationDelay: '12s',  '--size': '2px', '--color': 'rgba(100,210,240,0.4)', '--glow': 'rgba(100,210,240,0.18)' } },
  { id: 23, style: { left: '50%', top: '80%', animationDuration: '22s', animationDelay: '15s',  '--size': '1px', '--color': 'rgba(248,190,70,0.35)', '--glow': 'rgba(248,190,70,0.15)' } },
]
</script>

<style scoped>
.particle-layer {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.particle {
  position: absolute;
  width: var(--size);
  height: var(--size);
  border-radius: 50%;
  background: var(--color);
  box-shadow: 0 0 6px 2px var(--glow), 0 0 14px 5px var(--glow);
  animation: float-up linear infinite;
  animation-duration: inherit;
  animation-delay: inherit;
  opacity: 0;
}

@keyframes float-up {
  0%   { transform: translateY(0)    translateX(0)   scale(1);   opacity: 0; }
  8%   { opacity: 1; }
  40%  { transform: translateY(-90px)  translateX(14px)  scale(1.1); opacity: 0.9; }
  65%  { transform: translateY(-180px) translateX(-10px) scale(0.9); opacity: 0.55; }
  88%  { opacity: 0.1; }
  100% { transform: translateY(-280px) translateX(6px)  scale(0.6); opacity: 0; }
}
</style>
