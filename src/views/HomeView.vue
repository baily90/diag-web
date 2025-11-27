<template>
  <div class="pos-relative inline-flex bg-gray" v-loading="loading">
    <video ref="videoRef" :src="url" @loadedmetadata="onLoadedMetadata" @timeupdate="onTimeupdate"
      @play="isPlaying = true" @pause="isPlaying = false" @ended="isEnded = true" controls />
    <img v-if="screenshot && !isDragging" class="pos-absolute pos-top-0 pos-left-0 w-full h-full" :src="screenshot"
      alt=""></img>
  </div>
  <div>
    <el-button @click="onToggleHandle">{{ isEnded ? '重新播放' : isPlaying ? '暂停' : '播放' }}</el-button>
    <el-button @click="onScreenShotHandle">抽帧</el-button>
    <el-button :disabled="isPlaying" @click="onMeasureHandle">测量</el-button>
    <div class="w-full px-20px">
      <el-slider v-model="currentFrame" :max="totalFrames" :marks="marks" @input="onSlideChange" />
    </div>
  </div>
  <div>
    <div>总时长：{{ duration }}ms</div>
    <div>当前时间：{{ currentTime }}ms</div>
    <div>是否正在播放：{{ isPlaying }}</div>
    <div>是否播放结束：{{ isEnded }}</div>
    <div>是否正在拖拽： {{ isDragging }}</div>
    <div>当前帧：{{ currentFrame }}</div>
    <div>总帧数：<el-input-number v-model="totalFrames" /></div>
  </div>
  <img :src="screenshot" alt=""></img>

  <MeasureDialog ref="measureDialogRef" />
</template>

<script setup lang="ts">
import MeasureDialog from './components/MeasureDialog/index.vue'
// import url from '@/assets/image/test.mp4'



const loading = ref(true)
const url = ref(null)
const videoRef = ref<HTMLVideoElement>(null)

const isPlaying = ref(false)
const isEnded = ref(false)
const duration = ref(0)
const currentTime = ref(0)
const screenshot = ref(null)
const totalFrames = ref(280)
const currentFrame = ref(0)

const marks = reactive({
  61: '责任病灶',
  120: '',
  121: '',
  122: '',
  123: '',
  124: '',
  125: '',
})

const measureDialogRef = ref(null)

const onLoadedMetadata = (e) => {
  duration.value = e.target.duration * 1000
}

const draggingTimer = ref(0)
const isDragging = ref(false)
const onTimeupdate = (e) => {
  isDragging.value = true
  if (draggingTimer.value) {
    clearTimeout(draggingTimer.value)
  }
  draggingTimer.value = setTimeout(() => {
    isDragging.value = false
    onScreenShotHandle()
  }, 1000)
  currentTime.value = e.target.currentTime * 1000

  currentFrame.value = Math.round(totalFrames.value * currentTime.value / duration.value)
}

const onToggleHandle = () => {
  if (isEnded.value) {
    isEnded.value = false
  }
  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play()
  }
}

const onMeasureHandle = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
  const img = canvas.toDataURL('image/png')
  measureDialogRef.value.open(img)
}



const onSlideChange = (val: number) => {
  videoRef.value.currentTime = val * duration.value / totalFrames.value / 1000
}


const onScreenShotHandle = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
  screenshot.value = canvas.toDataURL('image/png')
}

const loadVideo = async () => {
  try {
    loading.value = true
    const testurl = 'https://sit-scan-private.oss-cn-shanghai.aliyuncs.com/scan_doctor_app/video/20251124/202511241011020GboeN.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=LTAI4G1Ej9KQVV3CzsTjEAH7%2F20251127%2Foss-cn-shanghai%2Fs3%2Faws4_request&X-Amz-Date=20251127T164220Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=8bb0b89dcd57f97fb64947a740fb56b91b6604c2b16e5af77b35a4569266df59'


    const response = await fetch(testurl);
    const blob = await response.blob();

    url.value = URL.createObjectURL(blob);
  } catch (error) {
    console.log(error);
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadVideo()
})
</script>
<style scoped lang="less">
:deep(.el-slider__stop) {
  background-color: red;
}

video {
  object-fit: fit;
}
</style>
