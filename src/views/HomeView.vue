<template>
  <div class="pos-relative w-100% h-400px bg-gray" v-loading="loading">
    <video ref="videoRef" crossorigin="anonymous" class="w-100% h-100% object-contain" :src="url"
      @loadedmetadata="onLoadedMetadata" @loadeddata="onLoadeddata" @timeupdate="onTimeupdate" @play="isPlaying = true"
      @pause="isPlaying = false" @ended="isEnded = true" :controls="false" />
    <canvas v-show="!isDragging" id="container"></canvas>
    <el-dropdown class="!pos-absolute pos-left-[50%] pos-top-0 z-1 -transform-translate-x-[50%]" ref="dropdownRef"
      trigger="contextmenu" :hide-on-click="false" effect="dark">
      <el-button type="danger" link @click="openDropdown">
        <el-icon size="24px">
          <ArrowDownBold />
        </el-icon>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item>
            <div class="text-yellow">高回声 2.4*1.8mm 30%(狭窄率)</div>
          </el-dropdown-item>
          <el-dropdown-item>
            <div class="text-red">低回声 3.8*2.1mm 50%(狭窄率)</div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
  <div class="w-full px-20px">
    <el-button @click="onZoomIn">放大</el-button>
    <el-button @click="onZoomOut">缩小</el-button>
    <el-button :icon="focusMode ? View : Hide" @click="onToggleFocusMode">病灶轮廓</el-button>
  </div>
  <div>
    <el-button @click="onToggleHandle">{{ isEnded ? '重新播放' : isPlaying ? '暂停' : '播放' }}</el-button>
    <el-button @click="onScreenShotHandle">抽帧</el-button>
    <el-button :disabled="isPlaying" @click="onMeasureHandle">测量</el-button>
    <div class="w-full px-20px">
      <el-slider v-model="currentFrame" :max="totalFrames" :marks="marks" @input="onSlideInput"
        @change="onSlideChange" />
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
import CanvasSelect from 'canvas-select'
import MeasureDialog from './components/MeasureDialog/index.vue'
import { View, Hide } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'


const loading = ref(true)
const url = ref(null)
const videoRef = ref<HTMLVideoElement>(null)


const dropdownRef = ref(null)
const focusMode = ref(false)
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
const instance = ref(null)

const width = ref(0)
const height = ref(0)

const onLoadedMetadata = (e) => {
  console.log('onLoadedMetadata');
  duration.value = e.target.duration * 1000
}
const onLoadeddata = () => {
  console.log('onLoadeddata');
  if (!instance.value) instance.value = new CanvasSelect('#container')
  videoDimensions(videoRef.value)
}


const isDragging = ref(false)

const onTimeupdate = (e) => {
  currentTime.value = e.target.currentTime * 1000
  currentFrame.value = Math.round(totalFrames.value * currentTime.value / duration.value)
}

const videoDimensions = (video) => {
  const videoRatio = video.videoWidth / video.videoHeight;
  width.value = video.offsetWidth
  height.value = video.offsetHeight;
  const elementRatio = width.value / height.value;
  if (elementRatio > videoRatio) width.value = height.value * videoRatio;
  else height.value = width.value / videoRatio;
  setTimeout(() => {
    onRenderFrame()
  }, 1000);
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

const onToggleFocusMode = () => {
  focusMode.value = !focusMode.value
  if (focusMode.value) {
    instance.value?.setFocusMode(true)
  } else {
    instance.value?.setFocusMode(false)
  }
}

const openDropdown = () => {
  ElMessage({
    type: 'warning',
    message: '未检测到病灶存在～',
    duration: 800,
  })
  // dropdownRef.value?.handleOpen()
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


const onZoomIn = () => {
  instance.value?.setScale(true)
}
const onZoomOut = () => {
  instance.value?.setScale(false)
}


const onSlideInput = (val: number) => {
  console.log('onSlideInput', val);
  isDragging.value = true
  videoRef.value.currentTime = val * duration.value / totalFrames.value / 1000
}

const onSlideChange = (val: number) => {
  console.log('onSlideChange', val);
  isDragging.value = false
  onRenderFrame()
}

const strokeStyleArray = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff']
const fillStyleArray = [
  'rgba(255, 0, 0, 0.1)',
  'rgba(0, 255, 0, 0.1)',
  'rgba(0, 0, 255, 0.1)',
  'rgba(255, 255, 0, 0.1)',
  'rgba(0, 255, 255, 0.1)',
  'rgba(255, 0, 255, 0.1)'
]
const mock = [
  // {
  //   "label": "病灶1",
  //   "coor": [[398, 122], [491, 168], [303, 237], [253, 143], [331, 108], [372, 106]],
  //   "type": 2,
  //   // "fillStyle": "rgba(0, 0, 255, 0.1)",
  //   // "strokeStyle": "#f00"
  // },
  {
    "label": "病灶2",
    "coor": [[1, 1], [495, 240], [495, 480], [50, 317]],
    "type": 2,
    // "fillStyle": "rgba(0, 0, 255, 0.1)",
    // "strokeStyle": "#f00"
  },
  // {
  //   "label": "病灶3",
  //   "coor": [[471, 245], [484, 251], [484, 258], [479, 263], [474, 268], [465, 270], [460, 271], [448, 269], [440, 265], [435, 257], [434, 248], [435, 239], [440, 230], [457, 222], [474, 224], [477, 231], [474, 239]],
  //   "type": 2,
  //   // "fillStyle": "rgba(0, 0, 255, 0.1)",
  //   // "strokeStyle": "#f00"
  // }
]

const getCoor = () => mock.map((item, index) => {
  const coor = item.coor.map(([x, y]) => {
    return [x * (width.value / videoRef.value.videoWidth), y * (height.value / videoRef.value.videoHeight)]
  })
  return { ...{ ...item, coor }, fillStyle: fillStyleArray[index % fillStyleArray.length], strokeStyle: strokeStyleArray[index % strokeStyleArray.length] }
})
const onRenderFrame = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width.value;
  canvas.height = height.value;
  console.log(videoRef.value.videoWidth, videoRef.value.videoHeight);

  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
  const img = canvas.toDataURL('image/png')
  const contour = getCoor()
  instance.value?.setImage(img)
  instance.value?.setData(contour)
  instance.value?.setFocusMode(focusMode.value)
  instance.value.showCross = false
  instance.value.hideLabel = false
  instance.value.readonly = true

  if (contour.length) {
    dropdownRef.value?.handleOpen()
  }

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
    const testurl = 'https://sit-scan-private.oss-cn-shanghai.aliyuncs.com/scan_doctor_app/video/20251124/202511241007016oqMac.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=LTAI4G1Ej9KQVV3CzsTjEAH7%2F20251202%2Foss-cn-shanghai%2Fs3%2Faws4_request&X-Amz-Date=20251202T170009Z&X-Amz-Expires=600&X-Amz-SignedHeaders=host&X-Amz-Signature=e5190ca7d3698ffc11b2c9f3a72ce72dde0694695a1e15a1ea9337d3c9c923f3'

    // const response = await fetch(testurl);
    // const blob = await response.blob();

    // url.value = URL.createObjectURL(blob);

    url.value = testurl
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

#container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
