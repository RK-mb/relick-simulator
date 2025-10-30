import { blockShapes } from './shapes.js';

const grid = document.getElementById("grid");
const palette = document.getElementById("blockPalette");
const cellSize = 52;

let blockX = 0;
let blockY = 0;
let blockType = "";
let blockRotation = 0;
let blockColor = "#f44336";
let previewBlock = null;
let selectedBlockID = null;

const colorHighlightMap = {
    "#f44336": "#ff7961",
    "#2196f3": "#6ec6ff",
    "#ffeb3b": "#fff176",
    "#4caf50": "#80e27e",
    "#ffffff": "#eeeeee",
    "#000000": "#666666",
};

let blockIdCounter = 0;

renderGrid();
renderBlockPalette();
setupColorSelector();
updateSaveListUI();


function renderGrid() {
    for (let i = 0; i < 49; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        grid.appendChild(cell);
    }
}

function renderBlockPalette() {
    for (const [type, shape] of Object.entries(blockShapes)) {
        const item = document.createElement("div");
        item.className = "palette-item";
        item.dataset.type = type;

        const offsetX = Math.min(...shape.map(([x]) => x));
        const offsetY = Math.min(...shape.map(([, y]) => y));

        const miniContainer = document.createElement("div");
        miniContainer.className = "mini-block-container";

        for (const [x, y] of shape) {
            const mini = document.createElement("div");
            mini.className = "mini-block";
            mini.style.left = `${(x - offsetX) * 14}px`;
            mini.style.top = `${(y - offsetY) * 14}px`;
            miniContainer.appendChild(mini);
        }

        item.appendChild(miniContainer);

        const label = document.createElement("div");
        label.className = "block-label";
        label.textContent = type;
        item.appendChild(label);

        item.addEventListener("click", () => {
            removePreviewBlock();
            blockType = type;
            blockRotation = 0;
            blockX = 0;
            blockY = 0;
            selectedBlockID = `block-${blockIdCounter++}`; // 新IDを割り当てる
            place_first();
            const newGroup = document.getElementById(selectedBlockID);
            setHighlight(newGroup, true);

            newGroup.classList.add("selected-group");
        });

        palette.appendChild(item);
    }
}

function setupColorSelector() {
    document.querySelectorAll('#colorSelector input[name="color"]').forEach(radio => {
        radio.addEventListener("change", () => {
            blockColor = radio.value;

            // ブロック選択中であれば色を即座に更新
            if (selectedBlockID) {
                updateBlock();

                // ハイライト再適用
                const updatedBlock = document.getElementById(selectedBlockID);
                if (updatedBlock) {
                    // 一度全体からハイライトを外す
                    document
                        .querySelectorAll(".block-group")
                        .forEach(g => setHighlight(g, false));

                    setHighlight(updatedBlock, true);
                }
            }

            const newGroup = document.getElementById(selectedBlockID);

            newGroup.classList.add("selected-group");
        });
    });

    
}



function getRotatedShape(shape, rotation) {
    return shape.map(([x, y]) => {
        switch (rotation % 360) {
            case 90: return [-y, x];
            case 180: return [-x, -y];
            case 270: return [y, -x];
            default: return [x, y];
        }
    });
}

function removePreviewBlock() {
    if (previewBlock) {
        previewBlock.remove();
        previewBlock = null;
    }
}

function updateBlock() {
    // const old = document.getElementById(selectedBlockID);
    // if (old) old.remove();  // ← 明示的に削除

    removePreviewBlock();

    if (!blockType) return;

    const shape = getRotatedShape(blockShapes[blockType], blockRotation);
    const group = document.createElement("div");
    group.className = "block-group";

    group.id = selectedBlockID
    // 🔽 これを追加してください！
    group.dataset.blockType = blockType;
    group.dataset.rotation = blockRotation;
    group.dataset.offsetX = blockX;
    group.dataset.offsetY = blockY;
    group.dataset.color = blockColor;

    for (const [dx, dy] of shape) {
        const cell = document.createElement("div");
        cell.className = "block";
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        cell.style.left = `${(blockX + dx) * cellSize}px`;
        cell.style.top = `${(blockY + dy) * cellSize}px`;
        cell.style.backgroundColor = blockColor;
        cell.style.border = "2px solid black";
        cell.style.position = "absolute";
        cell.dataset.color = blockColor;
        group.appendChild(cell);
    }

    previewBlock = group;
    grid.appendChild(group);
}

function place_first() {
    const shape = getRotatedShape(blockShapes[blockType], blockRotation);
    const group = document.createElement("div");
    group.className = "block-group";
    group.style.position = "absolute";

    // blockIdCounter++ は外側（クリック時）でやってるのでここではしない！
    group.id = selectedBlockID;

    group.dataset.blockType = blockType;
    group.dataset.rotation = blockRotation;
    group.dataset.offsetX = blockX;
    group.dataset.offsetY = blockY;
    group.dataset.color = blockColor;

    for (const [dx, dy] of shape) {
        const cell = document.createElement("div");
        cell.className = "block";
        cell.style.left = `${(blockX + dx) * cellSize}px`;
        cell.style.top = `${(blockY + dy) * cellSize}px`;
        cell.style.width = `${cellSize}px`;
        cell.style.height = `${cellSize}px`;
        cell.style.backgroundColor = blockColor;
        cell.style.border = "2px solid black";
        cell.style.position = "absolute";
        cell.dataset.color = blockColor;
        group.appendChild(cell);
    }

    previewBlock = group;
    grid.appendChild(group);

    // group.classList.remove("selected-group");
}


function place() {
    if (!blockType || !selectedBlockID || !previewBlock) return;

    if (wouldOverlap(blockX, blockY, blockRotation, blockType, true)) return;

    // previewBlock を最終的なブロックとして確定
    previewBlock.dataset.blockType = blockType;
    previewBlock.dataset.rotation = blockRotation;
    previewBlock.dataset.offsetX = blockX;
    previewBlock.dataset.offsetY = blockY;
    previewBlock.dataset.color = blockColor;
    previewBlock.id = selectedBlockID;

    // 各セルにデータセット再設定（必要な場合）
    const shape = getRotatedShape(blockShapes[blockType], blockRotation);
    const cells = previewBlock.querySelectorAll(".block");

    shape.forEach(([dx, dy], i) => {
        const cell = cells[i];
        cell.style.left = `${(blockX + dx) * cellSize}px`;
        cell.style.top = `${(blockY + dy) * cellSize}px`;
        cell.style.backgroundColor = blockColor;
        cell.dataset.color = blockColor;
    });

    const newGroup = document.getElementById(selectedBlockID);
    setHighlight(newGroup, true);

    newGroup.classList.remove("selected-group");

    // 確定処理後、状態をリセット
    previewBlock = null;
    selectedBlockID = null;
    blockType = null;

    deselectBlock()
        ;
    updateBlockListUI(); // ← ブロック一覧を更新
}


function wouldOverlap(x, y, rotation, blockTypeCheck, checkCollision) {
    const shape = getRotatedShape(blockShapes[blockTypeCheck], rotation);
    for (const [dx, dy] of shape) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx > 6 || ny > 6) return true;
        console.log("はみだしてません")
        if (!checkCollision) continue;
        console.log("continue")
        for (const group of grid.querySelectorAll(".block-group")) {


            console.log(group.id !== selectedBlockID)
            if (group.id === selectedBlockID) continue;

            for (const b of group.querySelectorAll(".block")) {
                const gx = Math.round(parseFloat(b.style.left) / cellSize);
                const gy = Math.round(parseFloat(b.style.top) / cellSize);
                if (gx === nx && gy === ny) return true;
                console.log("重なっていません")
            }
        }
    }
    return false;
}

function move(dx, dy) {
    if (!blockType) return;
    if (!selectedBlockID) return;
    const newX = blockX + dx;
    const newY = blockY + dy;
    if (!wouldOverlap(newX, newY, blockRotation, blockType, false)) {
        blockX = newX;
        blockY = newY;
        const old = document.getElementById(selectedBlockID);
        if (old) old.remove();  // ← 明示的に削除
        updateBlock();

    }

    const newGroup = document.getElementById(selectedBlockID);
    setHighlight(newGroup, true);

    newGroup.classList.add("selected-group");
}

function generateOffsets(radius = 4) {
    const result = [];
    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            result.push([dx, dy]);
        }
    }
    return result;
}


function rotate() {
    if (!blockType || !selectedBlockID) return;

    const newRotation = (blockRotation + 90) % 360;

    // 現在の位置で回転可能なら
    if (!wouldOverlap(blockX, blockY, newRotation, blockType)) {
        blockRotation = newRotation;
        const old = document.getElementById(selectedBlockID);
        if (old) old.remove();
        updateBlock();

        requestAnimationFrame(() => {
            const newBlock = document.getElementById(selectedBlockID);
            if (newBlock) setHighlight(newBlock, true);
        });

        const newGroup = document.getElementById(selectedBlockID);

        newGroup.classList.add("selected-group");

        return;
    }

    // 位置調整してでも回転可能なら
    const offsets = generateOffsets();
    for (const [dx, dy] of offsets) {
        const newX = blockX + dx;
        const newY = blockY + dy;
        if (!wouldOverlap(newX, newY, newRotation, blockType)) {
            blockX = newX;
            blockY = newY;
            blockRotation = newRotation;
            const old = document.getElementById(selectedBlockID);
            if (old) old.remove();
            updateBlock();

            requestAnimationFrame(() => {
                const newBlock = document.getElementById(selectedBlockID);
                if (newBlock) setHighlight(newBlock, true);
            });

                const newGroup = document.getElementById(selectedBlockID);

                newGroup.classList.add("selected-group");

            return;
        }
    }

    const newGroup = document.getElementById(selectedBlockID);
    // setHighlight(newGroup, true);

    newGroup.classList.add("selected-group");

    
}


function removeBlockById(blockId) {
    const blockElement = document.getElementById(blockId);
    if (blockElement) {
        blockElement.remove();
        console.log(`ブロック ${blockId} を削除しました`);
    } else {
        console.warn(`ID '${blockId}' のブロックが見つかりません`);
    }
}

grid.addEventListener("click", (e) => {
    const target = e.target;
    if (!target.classList.contains("block")) return;

            // 🔹 変更点：選択済みのブロックが存在する場合はクリック無視
    if (document.querySelector(".block-group.selected-group")) {
        console.log("ブロック選択中のため、他のブロックは選択できません");
        return; // ← ここで処理を中断
    }

    document.querySelectorAll(".block-group").forEach(g => setHighlight(g, false));

    const group = target.closest(".block-group");
    if (!group) return;



    // 🔸 既存の選択をクリア
    document.querySelectorAll(".block-group.selected").forEach(el => {
        el.classList.remove("selected");
    });

    // 再移動のための情報取得
    blockType = group.dataset.blockType;
    blockRotation = parseInt(group.dataset.rotation);
    blockX = parseInt(group.dataset.offsetX);
    blockY = parseInt(group.dataset.offsetY);
    blockColor = group.dataset.color;

    // ✅ 先に元ブロックを削除
    const blockId = group.id;
    console.log("復元クリック：", group.id);
    console.log("削除前に存在するか：", document.getElementById(group.id));
    // removeBlockById(group.id);
    console.log("削除後に存在するか：", document.getElementById(group.id));


    // ✅ 再移動用IDを保持
    selectedBlockID = blockId;

    // ✅ 新しいプレビューを描画
    // 🔸 ハイライトを追加
    // ※ この時点では removeBlockById で削除されたので、updateBlock() 後に再追加する
    const old = document.getElementById(selectedBlockID);
    if (old) old.remove();  // ← 明示的に削除
    updateBlock();

    const newGroup = document.getElementById(group.id);
    setHighlight(newGroup, true);

    newGroup.classList.add("selected-group");
});


function deleteBlock() {
    removeBlockById(selectedBlockID);
    selectedBlockID = null;
    updateBlockListUI();
}

function deselectBlock() {
    selectedBlockID = null;
    document
        .querySelectorAll(".block-group")
        .forEach(g => setHighlight(g, false));
}

function saveBlockStateWithName(name) {
    if (!name) {
        alert("保存名を入力してください");
        return;
    }

    const blocks = [];

    for (const group of grid.querySelectorAll(".block-group")) {
        blocks.push({
            id: group.id,
            blockType: group.dataset.blockType,
            rotation: parseInt(group.dataset.rotation),
            offsetX: parseInt(group.dataset.offsetX),
            offsetY: parseInt(group.dataset.offsetY),
            color: group.dataset.color
        });
    }

    const allSaves = JSON.parse(localStorage.getItem("savedLayouts") || "{}");
    allSaves[name] = blocks;
    if (!JSON.parse(localStorage.getItem("savedLayouts") || "{}")[name]){
        localStorage.setItem("savedLayouts", JSON.stringify(allSaves));
    } else {
        alert("異なる名前にしてください");
        return;
    }

    alert(`「${name}」として保存しました`);
    updateSaveListUI(); // 保存名一覧を更新
}

function restoreBlockStateByName(name) {
    const allSaves = JSON.parse(localStorage.getItem("savedLayouts") || "{}");
    const blocks = allSaves[name];
    if (!blocks) {
        alert(`「${name}」のデータが見つかりません`);
        return;
    }

    // 既存ブロックを削除
    for (const group of grid.querySelectorAll(".block-group")) {
        group.remove();
    }

    for (const block of blocks) {
        const shape = getRotatedShape(blockShapes[block.blockType], block.rotation);
        const group = document.createElement("div");
        group.className = "block-group";
        group.id = block.id;
        group.style.position = "absolute";

        group.dataset.blockType = block.blockType;
        group.dataset.rotation = block.rotation;
        group.dataset.offsetX = block.offsetX;
        group.dataset.offsetY = block.offsetY;
        group.dataset.color = block.color;

        for (const [dx, dy] of shape) {
            const cell = document.createElement("div");
            cell.className = "block";
            cell.style.left = `${(block.offsetX + dx) * cellSize}px`;
            cell.style.top = `${(block.offsetY + dy) * cellSize}px`;
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.style.backgroundColor = block.color;
            cell.style.border = "2px solid black";
            cell.style.position = "absolute";
            cell.dataset.color = block.color;
            group.appendChild(cell);
        }

        grid.appendChild(group);
    }


    // ✅ blockIdCounter を安全な値に更新（最大 + 1）
    const maxIdNum = blocks.reduce((max, b) => {
        const match = b.id.match(/block-(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            return Math.max(max, num);
        }
        return max;
    }, 0);
    blockIdCounter = maxIdNum + 1;


    alert(`「${name}」を復元しました`);

    updateBlockListUI();
}

function updateSaveListUI() {
    const list = document.getElementById("saveList");
    list.innerHTML = "";

    const allSaves = JSON.parse(localStorage.getItem("savedLayouts") || "{}");
    for (const name in allSaves) {
        const item = document.createElement("div");
        item.className = "save-entry";
        item.textContent = name;

        const loadBtn = document.createElement("button");
        loadBtn.textContent = "復元";
        loadBtn.onclick = () => restoreBlockStateByName(name);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "削除";
        deleteBtn.onclick = () => {
            delete allSaves[name];
            localStorage.setItem("savedLayouts", JSON.stringify(allSaves));
            updateSaveListUI();
        };

        item.appendChild(loadBtn);
        item.appendChild(deleteBtn);
        list.appendChild(item);
    }
}

function saveBlockStatePrompt() {
    const name = prompt("保存名を入力してください：");
    if (!name) {
        alert("保存はキャンセルされました。");
        return;
    }
    saveBlockStateWithName(name);
}

function setHighlight(group, on) {
    group.querySelectorAll(".block").forEach(cell => {
        cell.classList.toggle("highlighted", on);
    });
}

function updateBlockListUI() {
    const list = document.getElementById("placedBlockList");
    if (!list) return;
    list.innerHTML = "";

    // すべての .block-group を取得して配列に変換
    const groups = Array.from(grid.querySelectorAll(".block-group"));

    // 🔽 block-数字 の ID順にソート
    groups.sort((a, b) => {
        const numA = parseInt(a.id.split("-")[1]);
        const numB = parseInt(b.id.split("-")[1]);
        return numA - numB;
    });

    // ソート後にリストを作成
    groups.forEach(group => {
        const item = document.createElement("div");
        item.className = "placed-block-entry";

        const type = group.dataset.blockType;
        // const id = group.id;

        item.textContent = type;

        item.addEventListener("click", () => {
            document
                .querySelectorAll(".block-group")
                .forEach(g => setHighlight(g, false));

            blockType = group.dataset.blockType;
            blockRotation = parseInt(group.dataset.rotation);
            blockX = parseInt(group.dataset.offsetX);
            blockY = parseInt(group.dataset.offsetY);
            blockColor = group.dataset.color;
            selectedBlockID = group.id;

            // updateBlock();
            const newBlock = document.getElementById(group.id);
            setHighlight(newBlock, true);

            newBlock.classList.add("selected-group");
            // console.log(newBlock);
        });

        list.appendChild(item);
    });
}























window.move = move;
window.place = place;
window.rotate = rotate;
window.deleteBlock = deleteBlock;
window.deselectBlock = deselectBlock;
window.saveBlockStatePrompt = saveBlockStatePrompt;