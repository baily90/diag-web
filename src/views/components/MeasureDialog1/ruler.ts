import CanvasMarkBoard from '@/lib/canvas-mark-board/index.ts'
const { MoveMarkObject } = CanvasMarkBoard
import { Cross } from "@/lib/canvas-mark-board/shapes";

/** 自定义标尺 */
class RulerObject extends MoveMarkObject {
  constructor(box) {
    super(box);
    this.type = 'ruler';
    this.completeOffset = 1;
  }
  setMoveEdit() {
    this.pointList[this.acctivePointIndex] = {
      x: this.lastMousePoint.x,
      y: this.lastMousePoint.y,
    };
  }
  setCrossIcon() {
    const {
      regionCtx: ctx,
      t: { a: zoom },
    } = this.box;
    this.vertexList.map((item, index) => {
      let cross = null;
      if (this.acctivePointIndex === index) {
        cross = new Cross({
          ctx,
          center: item,
          size: 12 / zoom,
          fillColor: this.color === 'transparent' ? 'rgba(255,255,255,.7)' : this.color
        });
      } else {
        cross = new Cross({
          ctx,
          center: item,
          size: 12 / zoom,
          fillColor: this.color === 'transparent' ? 'rgba(255,255,255,.7)' : this.color,
        });
      }
      cross.draw();
      this.group.push(cross);
    });
  }
  /** 渲染 */
    render() {
      this.removeAll();
      const {
        config,
        regionCtx: ctx,
        t: { a: zoom },
      } = this.box;
      if (!this.box.selectObject) {
        this.box.clearCanvas(ctx);
      }
      // 线宽
      ctx.lineWidth = config.lineWidth / zoom;
      ctx.strokeStyle = this.status === "draw" ? config.drawColor : this.color;
      const path = new Path2D(this.pathData);
      this.group.push(path);

      if(this.status === 'done') {
        // this.setCrossIcon()
      }
      if (this.status === "draw") {
        ctx.stroke(path);
        this.setCrossIcon()
      }
      if (this.status === "edit") {
        this.box.clearCanvas(ctx);
        ctx.stroke(path);
        ctx.fillStyle =
          this.status === "edit" ? config.fillColor : "rgba(0,0,0,0)";
        ctx.fill(path);
        this.setCrossIcon()
      }
    }
}

export default RulerObject;
