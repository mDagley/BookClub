<template>
  <ParticleLayer />
  <AppNav />
  <main>
    <RouterView />
  </main>
  <AppFooter />
  <WelcomeModal />
</template>

<script setup>
import AppNav from './components/layout/AppNav.vue'
import AppFooter from './components/layout/AppFooter.vue'
import ParticleLayer from './components/layout/ParticleLayer.vue'
import WelcomeModal from './components/layout/WelcomeModal.vue'
</script>

<style>
main {
  min-height: calc(100vh - 120px);
}
</style>
