<template>
    <div class="courses-view">
      <HomeCourses />
    </div>
  </template>

  <script setup>
  import HomeCourses from '@/components/home/HomeCourses.vue'
  </script>

  <style scoped>
  .courses-view {
    min-height: 100vh;
    background-color: var(--gray-bg);
  }
  </style>