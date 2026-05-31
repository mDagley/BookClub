<template>
  <div class="particle-layer" aria-hidden="true">
    <span v-for="p in particles" :key="p.id" class="particle" :style="p.style" />
  </div>
</template>

<script setup>
const particles = [
  // Amber fireflies — warm glow matching the waterfall base
  { id:  1, style: { left: '8%',  animationDuration: '9s',  animationDelay: '0s',    '--size': '3px', '--color': 'rgba(232,168,40,0.85)',  '--glow': 'rgba(232,168,40,0.4)',  top: '70%' } },
  { id:  2, style: { left: '15%', animationDuration: '12s', animationDelay: '2s',    '--size': '2px', '--color': 'rgba(240,180,60,0.75)',  '--glow': 'rgba(240,180,60,0.35)', top: '80%' } },
  { id:  3, style: { left: '22%', animationDuration: '8s',  animationDelay: '4.5s',  '--size': '4px', '--color': 'rgba(255,200,80,0.9)',   '--glow': 'rgba(255,200,80,0.45)', top: '60%' } },
  { id:  4, style: { left: '32%', animationDuration: '14s', animationDelay: '1s',    '--size': '2px', '--color': 'rgba(232,168,40,0.7)',   '--glow': 'rgba(232,168,40,0.3)',  top: '75%' } },
  { id:  5, style: { left: '42%', animationDuration: '10s', animationDelay: '6s',    '--size': '3px', '--color': 'rgba(248,190,70,0.85)',  '--glow': 'rgba(248,190,70,0.4)',  top: '65%' } },
  { id:  6, style: { left: '55%', animationDuration: '11s', animationDelay: '3s',    '--size': '2px', '--color': 'rgba(232,168,40,0.75)',  '--glow': 'rgba(232,168,40,0.35)', top: '78%' } },
  { id:  7, style: { left: '65%', animationDuration: '9s',  animationDelay: '7s',    '--size': '3px', '--color': 'rgba(255,210,90,0.9)',   '--glow': 'rgba(255,210,90,0.45)', top: '72%' } },
  { id:  8, style: { left: '74%', animationDuration: '13s', animationDelay: '0.5s',  '--size': '2px', '--color': 'rgba(232,168,40,0.7)',   '--glow': 'rgba(232,168,40,0.3)',  top: '68%' } },
  { id:  9, style: { left: '84%', animationDuration: '8s',  animationDelay: '5s',    '--size': '4px', '--color': 'rgba(248,190,70,0.85)',  '--glow': 'rgba(248,190,70,0.4)',  top: '76%' } },
  { id: 10, style: { left: '92%', animationDuration: '11s', animationDelay: '2.5s',  '--size': '2px', '--color': 'rgba(232,168,40,0.75)',  '--glow': 'rgba(232,168,40,0.35)', top: '62%' } },
  // Cyan-blue magic particles — moonlight/waterfall cool tones
  { id: 11, style: { left: '5%',  animationDuration: '15s', animationDelay: '1.5s',  '--size': '2px', '--color': 'rgba(100,210,240,0.8)',  '--glow': 'rgba(100,210,240,0.4)', top: '55%' } },
  { id: 12, style: { left: '18%', animationDuration: '10s', animationDelay: '8s',    '--size': '3px', '--color': 'rgba(120,220,255,0.85)', '--glow': 'rgba(120,220,255,0.4)', top: '45%' } },
  { id: 13, style: { left: '36%', animationDuration: '13s', animationDelay: '3.5s',  '--size': '2px', '--color': 'rgba(90,200,230,0.75)',  '--glow': 'rgba(90,200,230,0.35)', top: '50%' } },
  { id: 14, style: { left: '50%', animationDuration: '9s',  animationDelay: '6.5s',  '--size': '3px', '--color': 'rgba(130,225,255,0.9)',  '--glow': 'rgba(130,225,255,0.45)', top: '40%' } },
  { id: 15, style: { left: '62%', animationDuration: '12s', animationDelay: '0s',    '--size': '2px', '--color': 'rgba(100,210,240,0.8)',  '--glow': 'rgba(100,210,240,0.4)', top: '58%' } },
  { id: 16, style: { left: '78%', animationDuration: '11s', animationDelay: '4s',    '--size': '3px', '--color': 'rgba(110,215,245,0.85)', '--glow': 'rgba(110,215,245,0.4)', top: '48%' } },
  { id: 17, style: { left: '88%', animationDuration: '14s', animationDelay: '9s',    '--size': '2px', '--color': 'rgba(90,200,230,0.75)',  '--glow': 'rgba(90,200,230,0.35)', top: '35%' } },
  // A few extra amber ones at mid-height for depth
  { id: 18, style: { left: '28%', animationDuration: '16s', animationDelay: '2s',    '--size': '2px', '--color': 'rgba(232,168,40,0.6)',   '--glow': 'rgba(232,168,40,0.25)', top: '42%' } },
  { id: 19, style: { left: '48%', animationDuration: '18s', animationDelay: '10s',   '--size': '2px', '--color': 'rgba(248,190,70,0.55)',  '--glow': 'rgba(248,190,70,0.22)', top: '30%' } },
  { id: 20, style: { left: '70%', animationDuration: '15s', animationDelay: '7s',    '--size': '2px', '--color': 'rgba(232,168,40,0.6)',   '--glow': 'rgba(232,168,40,0.25)', top: '38%' } },
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
  box-shadow: 0 0 6px 2px var(--glow), 0 0 12px 4px var(--glow);
  animation: float-up linear infinite;
  animation-duration: inherit;
  animation-delay: inherit;
  opacity: 0;
}

@keyframes float-up {
  0% {
    transform: translateY(0) translateX(0) scale(1);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  50% {
    transform: translateY(-120px) translateX(18px) scale(1.1);
    opacity: 0.9;
  }
  70% {
    transform: translateY(-200px) translateX(-12px) scale(0.9);
    opacity: 0.6;
  }
  90% {
    opacity: 0.1;
  }
  100% {
    transform: translateY(-320px) translateX(8px) scale(0.6);
    opacity: 0;
  }
}
</style>
