<template>
  <div>
    <video :src="url" controls></video>
  </div>
  <div>
    <el-button>播放</el-button>
    <el-button>暂停</el-button>

  </div>
</template>

<script setup lang="ts">
import url from '/public/test.mp4'

const videoRef = ref(null)
</script>
