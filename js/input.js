// ============================================================
// INPUT — keyboard + mouse singleton
// ============================================================

const Input = {
  keys: {},
  keysPressed: {},
  keysReleased: {},
  mouseX: CANVAS_W / 2,
  mouseY: CANVAS_H / 2,
  mouseDown: false,
  mouseClicked: false,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      if (!this.keys[e.code]) this.keysPressed[e.code] = true;
      this.keys[e.code] = true;
      // Prevent arrow keys / space from scrolling page
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
      this.keysReleased[e.code] = true;
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_W / rect.width;
      const scaleY = CANVAS_H / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
    });

    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouseDown = true;
        this.mouseClicked = true;
      }
    });

    canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouseDown = false;
      }
    });

    // Prevent context menu on right-click
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  },

  // Call once per frame at start of update — clears one-shot flags
  update() {
    this.keysPressed = {};
    this.keysReleased = {};
    this.mouseClicked = false;
  },

  isDown(code) { return !!this.keys[code]; },
  wasPressed(code) { return !!this.keysPressed[code]; },
  wasReleased(code) { return !!this.keysReleased[code]; },

  // Check if any of the movement keys are down
  isMoving() {
    return this.isDown('ArrowUp') || this.isDown('ArrowDown') ||
           this.isDown('ArrowLeft') || this.isDown('ArrowRight') ||
           this.isDown('KeyW') || this.isDown('KeyS') ||
           this.isDown('KeyA') || this.isDown('KeyD');
  }
};
