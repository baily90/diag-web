<template>
  <div class="flex w-100% h-500px bg-gray" v-loading="loading">
    <video ref="videoRef" class="w-full h-full" :src="url" @loadedmetadata="onLoadedMetadata" @timeupdate="onTimeupdate"
      @play="isPlaying = true" @pause="isPlaying = false" @ended="isEnded = true" controls />
  </div>
  <div>
    <el-button @click="onToggleHandle">{{ isEnded ? '重新播放' : isPlaying ? '暂停' : '播放' }}</el-button>
    <el-button @click="onScreenShotHandle">抽帧</el-button>
    <el-button :disabled="isPlaying" @click="onMeasureHandle">测量</el-button>
    <div class="w-full px-20px">
      <el-slider v-model="currentTime" :max="duration" @input="onSlideChange" />
    </div>
  </div>
  <div>
    <div>总时长：{{ duration }}ms</div>
    <div>当前时间：{{ currentTime }}ms</div>
    <div>是否正在播放：{{ isPlaying }}</div>
    <div>是否播放结束：{{ isEnded }}</div>
    <div>当前帧：{{ Math.floor(totalFrames * currentTime / duration) }}</div>
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

const measureDialogRef = ref(null)

const onLoadedMetadata = (e) => {
  duration.value = e.target.duration * 1000
}

const onTimeupdate = (e) => {
  currentTime.value = e.target.currentTime * 1000
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


const onSlideChange = (val) => {
  videoRef.value.currentTime = val / 1000
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
    const testurl = "https://sit-scan-private.weicha88.com/scan_doctor_app/video/20240705/202407051804031m8ePS.mp4?security-token=CAISyAJ1q6Ft5B2yfSjIr5nlJsjCv5cUj6afdxLSjlAsZ%2Bxiur3Njzz2IHlOf3BqBeEfsPw0lGlY5%2F8ZlrxpTJtIckDFZMR26Y9W6jStZIHdvNbtex6pOl7%2BSwapEBfe8JL4QYeQFaHwGJqEb1TDiVUAo9%2FTfimjWFqIKICAjYUdAP0cQgi%2Fa0gtZr4UXHwAzvUXLnzML%2F2gHwf3i27LdipStxF7lHl05NbUoKTeyGKH0gyrkr9K%2B9mgeMj6NJgxBvolDYfpht4RX7HazStd5yJN8KpLl6Fe8V%2FFxIrEWQIIuUnXarSMqY02fF4gPbJVALJf6fTxi%2B3rKEs4BUUdoPwkH5a2M0y3LOjIqKNPiHw3uzOE25xPmmUff6FuJxiEUvIeGwY%2FHilkhVSvhPE%2BZxKCxP9U1FHZFr6oBiXnf8yvtMeSuTML0Ku2lbLiGoABXbpetCbnN2SHuvdbcU3XtXln42N44E7%2B278MwZXH00w9Dli%2FJCHFiw8hZeXCDzSMF1tPPE68hq5MmDMPPjwONuE2wg30%2BErCtB%2BYgSE%2BQFaPETfJpGKnu7RZ%2B2nnPJmHFGT7nWjUwuotiU%2FzzdZPfsr3J3EvotfneIBEtWiaR2IgAA%3D%3D&OSSAccessKeyId=STS.NZPmrvRH58dtu4cjPykcNUxfm&Expires=1764077474&Signature=1301sXNEPz9RNo3uyjc3a%2Fo0crU%3D"


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
