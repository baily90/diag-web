<template>
  <el-dialog v-model="visible" title="测量" width="90%" top="2vh" class="min-w-800px max-w-1080px" destroy-on-close center
    @close="close">
    <div class="flex w-100% h-70vh">
      <div id="ruler-dialog-box" class="w-70% h-100%"></div>
      <div class="label-box">
        <div class="relative mb-10px w-70% rd-5px px-20px ml-20px py-5px b-1px b-solid text-#606266 cursor-pointer"
          :style="{ borderColor: item.color }" v-for="(item, index) in objectList" :key="index"
          @click="mark.selectObjectById(item.id)">
          <div class="relative flex items-center justify-between w-100% z-1">
            {{ item.label }}
            <el-button link type="danger" @click.stop="mark.deleteObject(item.id)">
              <el-icon>
                <Delete />
              </el-icon>
            </el-button>
          </div>
          <div class="absolute pos-top-0 pos-left-0 w-100% h-100% op-20"
            :style="{ backgroundColor: item.select ? item.color : '' }"></div>
        </div>
      </div>
    </div>
    {{ objectList }}
    <img :src="img" alt="">
    <template #footer>
      <el-button @click="close" :auto-insert-space="true">关闭</el-button>
      <el-button @click="onScreenShotHandle" :auto-insert-space="true">截图</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import CanvasMarkBoard from '@/lib/canvas-mark-board/index.ts'
import RulerObject from './ruler.ts'

const mock = [
  {
    "label": "病灶2",
    "edges": [[1, 1], [495, 240], [495, 480], [50, 317]],
    "type": 2,
    // "fillStyle": "rgba(0, 0, 255, 0.1)",
    // "strokeStyle": "#f00"
  }
]

const visible = ref(false)
const mark = ref(null)
const colorsArray = ['#ff0000', '#00ff00', '#0000ff', '#67c23a', '#abcdef', '#ffff66', '#9966ff', '#bedcaf', '#d1ba74', '#909399']

const close = () => {
  mark.value?.clearMarkShapes()
  mark.value = undefined
  visible.value = false
  // emit('rulerDialogClose')
}
const objectList = ref([])

const img = ref(null)
const onScreenShotHandle = () => {

  console.log(mark.value);

  // const canvas = document.createElement('canvas');
  // const ctx = canvas.getContext('2d');

  // ctx.drawImage(mark.value.canvas, 0, 0, mark.value.canvas.width, mark.value.canvas.height);
  // img.value = canvas.toDataURL('image/png')


  // ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height);
  // const img = canvas.toDataURL('image/png')

  // ctx.drawImage(mark.value.canvas, 0, 0, mark.value.canvas.width, mark.value.canvas.height);


  // img.value = mark.value.canvas.toDataURL('image/png')
}

const getCoor = () => mock.map((item, index) => {
  item.pointList = item.edges.map(coor => ({ x: coor[0], y: coor[1] }))
  item.type = 'polygon'
  item.id = '123'
  item.color = '#ff0000'
  return item
})

const open = ({ img }) => {

  const mm_per_pixel = 0.047292079776525

  visible.value = true
  setTimeout(() => {
    mark.value = new CanvasMarkBoard({
      view: "#ruler-dialog-box",
      showIndex: true,
      drawColor: '#ffffff',
      lineWidth: 2,
      mm_per_pixel, // 设备像素比
      fillColor: 'rgba(245, 63, 63, .6)',
      // disable: true
    })
    mark.value.register("ruler", RulerObject)

    mark.value.on("oncomplete", (e) => {
      const color = colorsArray[objectList.value?.length % colorsArray.length]
      console.log(objectList.value);
      e.ok({ label: `测量${objectList.value?.length + 1}： `, color });
    })

    mark.value.on("onchange", () => {
      objectList.value = JSON.parse(JSON.stringify(mark.value?.objects))
    })

    mark.value.setBackground(img).then(() => {
      mark.value?.setDrawType("ruler");
      // const data = getCoor()
      // mark.value?.setObjectData(data)
    })

  }, 0)
}


defineExpose({ open })

</script>

<style lang="less" scope>
#ruler-dialog-box {
  background-image: radial-gradient(#c4c4c4 10%, transparent 0);
  background-size: 20px 20px;
  border-radius: 3px;
}

.label-box {
  flex: 1;
  overflow-y: auto;
}
</style>
