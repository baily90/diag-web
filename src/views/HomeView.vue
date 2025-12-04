<template>
  <div class="pos-relative w-100% h-400px bg-gray" v-loading="loading">
    <video ref="videoRef" crossorigin="anonymous" class="w-100% h-100% object-contain" :src="url"
      @loadedmetadata="onLoadedMetadata" @loadeddata="onLoadeddata" @timeupdate="onTimeupdate" @play="isPlaying = true"
      @pause="isPlaying = false" @ended="isEnded = true" :controls="false" />
    <canvas v-show="!isDragging" id="container"></canvas>
    <el-dropdown class="!pos-absolute pos-left-[50%] pos-top-0 z-1 -transform-translate-x-[50%]" ref="dropdownRef"
      trigger="contextmenu" :hide-on-click="false">
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
    <el-button @click="onScreenShotHandle">截图</el-button>
    <el-button :icon="focusMode ? View : Hide" @click="onToggleFocusMode">病灶轮廓</el-button>
  </div>
  <div class="flex items-center w-full px-20px gap-10px" v-if="screenShots?.length">
    <div class="pos-relative w-200px h-200px  cursor-pointer" v-for="(item, index) in screenShots" :key="index"
      @click="onScreenShotMeasureHandle(item)">
      <img class="w-100% h-100% object-contain" :src="item.measureImg || item.originImg" alt="">
    </div>
  </div>
  {{ screenShots }}
  <div>
    <el-button @click="onToggleHandle">{{ isEnded ? '重新播放' : isPlaying ? '暂停' : '播放' }}</el-button>
  </div>
  <div class="w-full px-20px">
    <el-slider v-model="currentFrame" :max="totalFrames" :marks="marks" @input="onSlideInput" @change="onSlideChange" />
  </div>
  <div class="w-full px-20px">
    <div>总时长：{{ duration }}ms</div>
    <div>当前时间：{{ currentTime }}ms</div>
    <div>是否正在播放：{{ isPlaying }}</div>
    <div>是否播放结束：{{ isEnded }}</div>
    <div>是否正在拖拽： {{ isDragging }}</div>
    <div>当前帧：{{ currentFrame }}</div>
    <div>总帧数：<el-input-number v-model="totalFrames" /></div>
  </div>
  <img :src="screenshot" alt=""></img>

  <MeasureDialog ref="measureDialogRef" @save="onSaveMeasureHandle" />
</template>

<script setup lang="ts">
// import CanvasSelect from 'canvas-select'
import CanvasSelect from './../lib/canvas-select/index'
import MeasureDialog from './components/MeasureDialog1/index.vue'
import { View, Hide } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

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
  currentFrame.value = duration.value ? Math.round(totalFrames.value * currentTime.value / duration.value) : 0
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
  dropdownRef.value?.handleOpen()
}

const onScreenShotMeasureHandle = (screenShot) => {
  measureDialogRef.value.open(screenShot)
}

const onSaveMeasureHandle = (val) => {
  console.log(val, screenShots.value);
  screenShots.value = screenShots.value.map(item => {
    if (item.id === val.id) {
      item = val
    }
    return item
  })

  console.log(screenShots.value);

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

const strokeStyleArray = ['rgba(255, 217, 0, 1)', 'rgba(255, 34, 0, 1)', 'rgba(146, 255, 255, 1)', 'rgba(178, 255, 68, 1)', 'rgba(177, 80, 255, 1)']
const fillStyleArray = ['rgba(255, 217, 0, 0.1)', 'rgba(255, 34, 0, 0.1)', 'rgba(146, 255, 255, 0.1)', 'rgba(178, 255, 68, 0.1)', 'rgba(177, 80, 255, 0.1)']
const mock = [
  {
    "label": "",
    "edges": [[398, 122], [491, 168], [303, 237], [253, 143], [331, 108], [372, 106]],
    "type": 2,
    // "fillStyle": "rgba(0, 0, 255, 0.1)",
    // "strokeStyle": "#f00"
  },
  {
    "label": "",
    "edges": [[1, 1], [495, 440], [495, 480], [50, 317]],
    "type": 2,
    // "fillStyle": "rgba(0, 0, 255, 0.1)",
    // "strokeStyle": "#f00"
  },
  {
    "label": "",
    "edges": [[471, 245], [484, 251], [484, 258], [479, 263], [474, 268], [465, 270], [460, 271], [448, 269], [440, 265], [435, 257], [434, 248], [435, 239], [440, 230], [457, 222], [474, 224], [477, 231], [474, 239]],
    "type": 2,
    // "fillStyle": "rgba(0, 0, 255, 0.1)",
    // "strokeStyle": "#f00"
  }
]

const getCoor = () => mock.map((item, index) => {
  const coor = item.edges.map(([x, y]) => {
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
  instance.value.hideLabel = true
  instance.value.readonly = true
  instance.value.lock = true

  if (contour.length) {
    dropdownRef.value?.handleOpen()
  }
}

const screenShots = ref([])

const onScreenShotHandle = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = videoRef.value.videoWidth;
  canvas.height = videoRef.value.videoHeight;
  ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
  const img = canvas.toDataURL('image/png')

  screenShots.value.push({
    id: dayjs().valueOf(),
    originImg: img,
    measureImg: undefined,
    originData: mock,
    measureData: undefined,
    type: undefined
  })
}

const loadVideo = async () => {
  try {
    loading.value = true
    const testurl = "https://dev-scan-private.weicha88.com/scan_doctor_app/video/20251127/20251127134026K4b9P.mp4?security-token=CAISyAJ1q6Ft5B2yfSjIr5vaG%2FTMqKsX0Km7aG7cgzEtQbpmiaTq2zz2IHlOf3BqBeEfsPw0lGlY5%2F8ZlrxpTJtIckDFZMR26Y9W6jStZIHdvNbtWjm0Llv%2BSwapEBfe8JL4QYeQFaHwGJqEb1TDiVUAo9%2FTfimjWFqIKICAjYUdAP0cQgi%2Fa0gtZr4UXHwAzvUXLnzML%2F2gHwf3i27LdipStxF7lHl05NbUoKTeyGKH0gyrkr9K%2B9mgeMj6NJgxBvolDYfpht4RX7HazStd5yJN8KpLl6Fe8V%2FFxIrEWQIIuUnXarSMqY02fF4gPbJVALJf6fTxi%2B3rKEs4BUUdoPwkH5a2M0y3LOjIqKNPyLQgsSck25xPmmUff6FuJxiEUvIeGwY%2FHilkhVSvhPE%2BZxKCxP9U1FHZFr6oBiXnf8yvtMeSuZH6tTO2lbLiGoABFGzOYO2iTLKyQwulynuAIj58Nc32gdezFtOQqfcFhp89wWNl66fh8ymigkxOt%2FTtCVS7ls8kcyv4Rha%2FVhXfUV72ZgZVWFevjwvWJIzkWnJPUWb%2BWVE%2F6UkJ6gkC12n1N%2FJhEKf9H5Hklxa8cSEWCLRRijbz8ECP0Mz4JdLr6WkgAA%3D%3D&OSSAccessKeyId=STS.NXoPNxEt6gkPjHmg1xM5JfaA9&Expires=1764858684&Signature=6aLZ9E1iSK437nMLUd1HNZoQ6p8%3D"






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
