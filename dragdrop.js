const workspace = document.getElementById("workspace");
const trash = document.getElementById("trash");

let currentTouch = null;
let touchStartPos = null;
let draggingImg = null;
let hasMoved = false;

// 建立說明標籤
function createLabelForImage(img, text) {
  let existingLabel = img.nextSibling;
  if (existingLabel && existingLabel.classList?.contains("img-label")) {
    existingLabel.remove();
  }

  const label = document.createElement("div");
  label.classList.add("img-label");
  label.textContent = text;
  label.style.position = "absolute";
  label.style.color = "#333";
  label.style.backgroundColor = "rgba(255,255,255,0.8)";
  label.style.border = "1px solid #ccc";
  label.style.padding = "2px 6px";
  label.style.borderRadius = "5px";
  label.style.fontSize = "12px";
  label.style.pointerEvents = "none";

  workspace.appendChild(label);

  function updateLabelPos() {
    label.style.left = `${img.offsetLeft + img.width + 5}px`;
    label.style.top = `${img.offsetTop}px`;
  }

  updateLabelPos();
  img.updateLabelPos = updateLabelPos;
  return label;
}

// 左側圖片區
document.querySelectorAll(".left-panel img").forEach((img) => {
  // 桌機點擊縮放
  img.addEventListener("click", () => {
    if (!('ontouchstart' in window)) {
      img.classList.toggle("zoomed");
    }
  });

  // 桌面滑鼠拖曳複製
  img.setAttribute("draggable", true);
  img.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", img.src);
    e.dataTransfer.setData("from-left", "true");
    e.dataTransfer.setData("title", img.title || "");
  });

  // 手機觸控拖曳
  img.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    touchStartPos = { x: t.pageX, y: t.pageY };
    hasMoved = false;
    draggingImg = null;
  });

  img.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    const moveX = t.pageX - touchStartPos.x;
    const moveY = t.pageY - touchStartPos.y;
    const moveDistance = Math.sqrt(moveX * moveX + moveY * moveY);

    if (!draggingImg && moveDistance > 15) {
      hasMoved = true;

      const width = img.src.includes("arrow") ? 45 : 100;
      const height = img.src.includes("arrow") ? 70 : 67;

      const newImg = document.createElement("img");
      newImg.src = img.src;
      newImg.classList.add("draggable", "rotate-img");
      newImg.draggable = false;
      newImg.style.position = "absolute";
      newImg.width = width;
      newImg.height = height;
      newImg.setAttribute("data-rotate", "0");
      newImg.title = img.title || "";

      // === 修正：計算相對 workspace 的正確座標 ===
      const workspaceRect = workspace.getBoundingClientRect();
      const x = t.clientX - workspaceRect.left - width / 2;
      const y = t.clientY - workspaceRect.top - height / 2;

      newImg.style.left = `${x}px`;
      newImg.style.top = `${y}px`;
      // ============================================

      addTouchHandlers(newImg);
      workspace.appendChild(newImg);
      createLabelForImage(newImg, newImg.title);

      draggingImg = newImg;
      currentTouch = {
        img: newImg,
        offsetX: width / 2,
        offsetY: height / 2,
      };
    } else if (draggingImg) {
      e.preventDefault();
      const workspaceRect = workspace.getBoundingClientRect();
      const x = t.clientX - workspaceRect.left - currentTouch.offsetX;
      const y = t.clientY - workspaceRect.top - currentTouch.offsetY;
      currentTouch.img.style.left = `${x}px`;
      currentTouch.img.style.top = `${y}px`;
      if (currentTouch.img.updateLabelPos) currentTouch.img.updateLabelPos();
    }
  });

  img.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (!hasMoved) {
      img.classList.toggle("zoomed");
    }
    currentTouch = null;
    draggingImg = null;
    hasMoved = false;
  });
});

// 工作區處理拖放
workspace.addEventListener("dragover", (e) => e.preventDefault());

workspace.addEventListener("drop", (e) => {
  e.preventDefault();
  const src = e.dataTransfer.getData("text/plain");
  const fromLeft = e.dataTransfer.getData("from-left");
  const title = e.dataTransfer.getData("title");

  if (src && fromLeft === "true") {
    const newImg = document.createElement("img");
    newImg.src = src;
    newImg.classList.add("draggable", "rotate-img");
    newImg.draggable = true;
    newImg.style.position = "absolute";

    const width = src.includes("arrow") ? 45 : 100;
    const height = src.includes("arrow") ? 70 : 67;

    newImg.width = width;
    newImg.height = height;

    newImg.style.left = `${e.offsetX}px`;
    newImg.style.top = `${e.offsetY}px`;
    newImg.setAttribute("data-rotate", "0");
    if (title) newImg.title = title;

    newImg.addEventListener("click", rotateHandler);
    newImg.addEventListener("dragstart", (ev) => {
      workspace.currentDrag = newImg;
      ev.dataTransfer.setData("text/plain", newImg.src);
    });

    workspace.appendChild(newImg);
    createLabelForImage(newImg, title);
    addTouchHandlers(newImg);
  } else if (workspace.currentDrag) {
    workspace.currentDrag.style.left = `${e.offsetX}px`;
    workspace.currentDrag.style.top = `${e.offsetY}px`;
    if (workspace.currentDrag.updateLabelPos) workspace.currentDrag.updateLabelPos();
    workspace.currentDrag = null;
  }
});

// 垃圾桶刪除拖曳圖片
trash.addEventListener("dragover", (e) => {
  e.preventDefault();
  trash.classList.add("drag-over");
});

trash.addEventListener("dragleave", () => {
  trash.classList.remove("drag-over");
});

trash.addEventListener("drop", (e) => {
  e.preventDefault();
  trash.classList.remove("drag-over");

  if (workspace.currentDrag) {
    let label = workspace.currentDrag.nextSibling;
    if (label && label.classList.contains("img-label")) label.remove();
    workspace.currentDrag.remove();
    workspace.currentDrag = null;
  }
});

// 右側觸控拖曳與刪除
function addTouchHandlers(img) {
  let moved = false;
  img.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    moved = false;
    const workspaceRect = workspace.getBoundingClientRect();
    currentTouch = {
      img: img,
      offsetX: touch.clientX - workspaceRect.left - img.offsetLeft,
      offsetY: touch.clientY - workspaceRect.top - img.offsetTop,
    };
  });

  img.addEventListener("touchmove", (e) => {
    if (currentTouch && currentTouch.img === img) {
      e.preventDefault();
      const touch = e.touches[0];
      const workspaceRect = workspace.getBoundingClientRect();
      const x = touch.clientX - workspaceRect.left - currentTouch.offsetX;
      const y = touch.clientY - workspaceRect.top - currentTouch.offsetY;
      img.style.left = `${x}px`;
      img.style.top = `${y}px`;
      if (img.updateLabelPos) img.updateLabelPos();
      moved = true;
    }
  });

  img.addEventListener("touchend", (e) => {
    e.preventDefault();

    const trashRect = trash.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    if (
      imgRect.right > trashRect.left &&
      imgRect.left < trashRect.right &&
      imgRect.bottom > trashRect.top &&
      imgRect.top < trashRect.bottom
    ) {
      let label = img.nextSibling;
      if (label && label.classList.contains("img-label")) label.remove();
      img.remove();
    } else if (!moved) {
      // 只有在未移動的情況下才觸發旋轉
      rotateHandler({ target: img });
    }

    currentTouch = null;
  });
}

// 旋轉圖片
function rotateHandler(e) {
  const img = e.target;
  const rotations = [0, 45, 90, 135, 180, 225, 270, 315];
  let current = parseInt(img.getAttribute("data-rotate")) || 0;
  let nextIndex = (rotations.indexOf(current) + 1) % rotations.length;
  let next = rotations[nextIndex];
  img.style.transform = `rotate(${next}deg)`;
  img.setAttribute("data-rotate", next);
  if (img.updateLabelPos) img.updateLabelPos();
}

// 自動調整右側高度
function adjustRightPanelHeight() {
  const leftPanel = document.querySelector('.left-panel');
  const rightPanel = document.querySelector('.right-panel');
  const leftImages = leftPanel.querySelectorAll('img');

  if (leftImages.length === 0) return;

  const imagesPerRow = 3;
  const rowCount = Math.ceil(leftImages.length / imagesPerRow);
  const imageHeight = 60 + 4;

  const targetHeight = (rowCount + 10) * imageHeight;
  rightPanel.style.minHeight = `${targetHeight}px`;
}

adjustRightPanelHeight();
window.addEventListener("resize", adjustRightPanelHeight);
