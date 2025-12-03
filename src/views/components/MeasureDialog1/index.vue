<template>
  <el-dialog v-model="visible" title="测量" width="90%" top="2vh" class="min-w-800px max-w-1080px" destroy-on-close center
    @close="close">
    <div class="flex w-100% h-70vh">
      <canvas id="ruler-dialog-box" class="w-70% h-100%"></canvas>
    </div>
    <el-button :icon="focusMode ? View : Hide" @click="onToggleFocusMode">病灶轮廓</el-button>

    <img :src="img" alt="">
    <template #footer>
      <el-button @click="close" :auto-insert-space="true">关闭</el-button>
      <el-button @click="onScreenShotHandle" :auto-insert-space="true">截图</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import CanvasSelect from 'canvas-select'
import { View, Hide } from '@element-plus/icons-vue'

const focusMode = ref(false)
const instance = ref(null)
const mock = [
  {
    "label": "病灶2",
    "edges": [[1, 1], [495, 240], [495, 480], [50, 317]],
    "type": 2,
    // "fillStyle": "rgba(0, 0, 255, 0.1)",
    // "strokeStyle": "#f00"
  }
]

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

  visible.value = false
  // emit('rulerDialogClose')
}

const img = ref(null)
const onScreenShotHandle = () => {
  // 1、记住缩放；2、重置原始；3、生成图片、4、恢复缩放；
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = instance.value?.IMAGE_ORIGIN_WIDTH;
  canvas.height = instance.value?.IMAGE_ORIGIN_HEIGHT;
  ctx.drawImage(instance.value?.canvas, 0, 0, canvas.width, canvas.height);
  img.value = canvas.toDataURL('image/png')
}

const getCoor = () => mock.map((item, index) => {
  item.pointList = item.edges.map(coor => ({ x: coor[0], y: coor[1] }))
  item.type = 'polygon'
  item.id = '123'
  item.color = '#ff0000'
  return item
})

const open = ({ img, contour }) => {

  const mm_per_pixel = 0.075

  visible.value = true

  setTimeout(() => {
    instance.value = new CanvasSelect('#ruler-dialog-box')
    instance.value?.setImage(img)
    instance.value?.setData(contour)
    instance.value?.setFocusMode(focusMode.value)
    instance.value.showCross = false
    instance.value.hideLabel = false
    instance.value.createType = 4

    instance.value.on("updated", (result) => {
      console.log(result);

      result.forEach(single => {
        if (single.type === 4) {
          const coors = single.coor;
          const p1 = { x: coors[0][0], y: coors[0][1] }
          const p2 = { x: coors[coors.length - 1][0], y: coors[coors.length - 1][1] }
          const lebel = Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2)) / 10
          single.label = lebel.toFixed(2) + 'mm';
        }
      })
      // const list = [...result];
      // list.sort((a, b) => a.index - b.index);
      // output.value = JSON.stringify(list, null, 2);
    });
  }, 0)
}


defineExpose({ open })

</script>

<style lang="less" scope>
#ruler-dialog-box {}

.label-box {
  flex: 1;
  overflow-y: auto;
}
</style>
