<template>
  <el-dialog v-model="visible" :close-on-press-escape="false" :destroy-on-close="true" title="测量" width="90%" top="2vh"
    class="min-w-800px max-w-1080px" destroy-on-close center @close="close">
    <div class="pos-relative flex w-100% h-70vh">
      <canvas id="ruler-dialog-box" class="w-70% h-100%"></canvas>
      <canvas id="ruler-dialog-box-screenshot" class="w-70% h-100%"></canvas>

      <div>
        <el-button :icon="focusMode ? View : Hide" @click="onToggleFocusMode">病灶轮廓</el-button>
        <div>
          <el-button :type="type === 1 ? 'primary' : ''" @click="onMeasureHandle(1)">自动测量</el-button>
          <el-button :type="type === 2 ? 'primary' : ''" @click="onMeasureHandle(2)">手动测量</el-button>
          <el-button :disabled="type === 1" @click="onClearMeasure">清空标尺</el-button>
        </div>
      </div>

    </div>
    {{ dataset }}

    <img :src="img" alt="">
    <template #footer>
      <el-button @click="close" :auto-insert-space="true">关闭</el-button>
      <el-button @click="onSaveHandle" :auto-insert-space="true">保存测量</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import CanvasSelect from 'canvas-select'
import { View, Hide } from '@element-plus/icons-vue'

const emits = defineEmits(['save'])

const strokeStyleArray = ['rgba(255, 217, 0, 1)', 'rgba(255, 34, 0, 1)', 'rgba(146, 255, 255, 1)', 'rgba(178, 255, 68, 1)', 'rgba(177, 80, 255, 1)']
const fillStyleArray = ['rgba(255, 217, 0, 0.1)', 'rgba(255, 34, 0, 0.1)', 'rgba(146, 255, 255, 0.1)', 'rgba(178, 255, 68, 0.1)', 'rgba(177, 80, 255, 0.1)']

const focusMode = ref(false)
const instance = ref(null)

const dataset = ref([])

const onToggleFocusMode = () => {
  focusMode.value = !focusMode.value
  if (focusMode.value) {
    instance.value?.setFocusMode(true)
  } else {
    instance.value?.setFocusMode(false)
  }
}

const visible = ref(false)

const close = () => {
  instance.value = null
  screenShotInstance.value = null
  type.value = 0
  visible.value = false
  // emit('rulerDialogClose')
}

const img = ref(null)


const onSaveHandle = () => {
  const coor = dataset.value?.filter(item => item.type === 4)
  screenShotInstance.value.setData(coor)

  setTimeout(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = screenShotInstance.value?.IMAGE_ORIGIN_WIDTH;
    canvas.height = screenShotInstance.value?.IMAGE_ORIGIN_HEIGHT;
    ctx.drawImage(screenShotInstance.value?.canvas, 0, 0, canvas.width, canvas.height);
    const img = canvas.toDataURL('image/png')

    emits('save', {
      ...detail.value,
      type: type.value,
      measureImg: img,
      measureData: coor
    })
    visible.value = false
  }, 100)
}

const getCoor = () => {
  const originCoors = getOirginCoors()
  const measureCoors = getMeasureCoors()
  return [...originCoors, ...measureCoors]
}

const getOirginCoors = () => detail.value?.originData?.map((item, index) => {
  return { ...item, coor: item.edges, fillStyle: fillStyleArray[index % fillStyleArray.length], strokeStyle: strokeStyleArray[index % strokeStyleArray.length] }
}) || []

const getMeasureCoors = () => detail.value?.measureData || []


const type = ref(0) // 0-未选择 1-自动 2-手动

const onMeasureHandle = (val: number) => {
  if (type.value === val) return
  type.value = val
  if (val === 1) {
    // 自动测量
    instance.value.showCross = false
    instance.value.createType = undefined
    const test = [{ "label": "8.8mm", "coor": [[610, 206], [582, 390]], "active": false, "creating": false, "dragging": false, "uuid": "58475543-d984-4156-9b17-18a23aed8463", "index": 1, "type": 4, "strokeStyle": "#0f0" }, { "label": "6.6mm", "coor": [[530, 296], [669, 294]], "active": false, "creating": false, "dragging": false, "uuid": "e700db3d-62dd-40e4-b84f-f06ff370823d", "index": 2, "type": 4, "strokeStyle": "#0f0" }]
    instance.value.setData([...getOirginCoors(), ...test])
  } else if (val === 2) {
    // 手动测量
    instance.value.showCross = true
    instance.value.createType = 4
    instance.value.setData([...getOirginCoors()])
  }
}
const onClearMeasure = () => {
  instance.value.setData([...getOirginCoors()])
}

const detail = ref(null)

const screenShotInstance = ref(null)
const open = (res) => {
  const mm_per_pixel = 0.047292079776525
  visible.value = true
  detail.value = res
  type.value = res.type
  setTimeout(() => {
    screenShotInstance.value = new CanvasSelect('#ruler-dialog-box-screenshot')
    screenShotInstance.value?.setImage(res.originImg)

    instance.value = new CanvasSelect('#ruler-dialog-box')
    instance.value?.setImage(res.originImg)
    const contour = getCoor()
    instance.value?.setData(contour)
    instance.value?.setFocusMode(focusMode.value)
    instance.value.hideLabel = false
    instance.value.read = true

    if (res.type === 2) {
      instance.value.showCross = true
      instance.value.createType = 4
    } else {
      instance.value.showCross = false
      instance.value.createType = undefined
    }


    instance.value.on("updated", (result) => {
      dataset.value = JSON.parse(JSON.stringify(result))

      result.forEach(single => {
        if (single.type === 4) {
          const coors = single.coor;
          const p1 = { x: coors[0][0], y: coors[0][1] }
          const p2 = { x: coors[coors.length - 1][0], y: coors[coors.length - 1][1] }
          const label = Math.sqrt(Math.pow((p1.x - p2.x) * mm_per_pixel, 2) + Math.pow((p1.y - p2.y) * mm_per_pixel, 2))
          single.label = label.toFixed(1) + 'mm';
        }
      })
    });
  }, 10)
}


defineExpose({ open })

</script>

<style lang="less" scope>
#ruler-dialog-box {}

#ruler-dialog-box-screenshot {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -11;
  background: grey;
}

.label-box {
  flex: 1;
  overflow-y: auto;
}
</style>
