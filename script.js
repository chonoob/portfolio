const STORAGE_KEY = "kindergarten-storage-app";

const institutionForm = document.querySelector("#institutionForm");
const cabinetForm = document.querySelector("#cabinetForm");
const institutionSummary = document.querySelector("#institutionSummary");
const roomSelect = document.querySelector("#roomSelect");
const cabinetArea = document.querySelector("#cabinetArea");

const slotDialog = document.querySelector("#slotDialog");
const slotForm = document.querySelector("#slotForm");
const dialogTitle = document.querySelector("#dialogTitle");
const itemName = document.querySelector("#itemName");
const itemNote = document.querySelector("#itemNote");
const itemPhoto = document.querySelector("#itemPhoto");

let editingTarget = null;

const state = loadState();
render();

institutionForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = document.querySelector("#institutionName").value.trim();
    const roomsValue = document.querySelector("#rooms").value;

    if (!name || !roomsValue.trim()) return;

    const rooms = roomsValue
        .split(",")
        .map((room) => room.trim())
        .filter(Boolean);

    state.institution = { name, rooms };
    state.cabinets = [];
    saveAndRender();
    institutionForm.reset();
});

cabinetForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!state.institution) return;

    const room = roomSelect.value;
    const name = document.querySelector("#cabinetName").value.trim();
    const cols = Number(document.querySelector("#cols").value);
    const rows = Number(document.querySelector("#rows").value);

    if (!room || !name || cols < 1 || rows < 1) return;

    const slots = Array.from({ length: cols * rows }, (_, index) => ({
        index,
        name: "",
        note: "",
        photo: ""
    }));

    state.cabinets.push({
        id: crypto.randomUUID(),
        room,
        name,
        cols,
        rows,
        slots
    });

    saveAndRender();
    cabinetForm.reset();
});

slotForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!editingTarget) return;

    const { cabinetId, slotIndex } = editingTarget;
    const cabinet = state.cabinets.find((item) => item.id === cabinetId);
    if (!cabinet) return;

    const slot = cabinet.slots[slotIndex];
    slot.name = itemName.value.trim();
    slot.note = itemNote.value.trim();

    if (itemPhoto.files[0]) {
        slot.photo = await toBase64(itemPhoto.files[0]);
    }

    saveAndRender();
    slotDialog.close();
    slotForm.reset();
    editingTarget = null;
});

function render() {
    renderInstitution();
    renderRoomOptions();
    renderCabinets();
}

function renderInstitution() {
    if (!state.institution) {
        institutionSummary.textContent = "아직 저장된 기관이 없습니다.";
        return;
    }

    const { name, rooms } = state.institution;
    institutionSummary.textContent = `${name} · 자료실 ${rooms.length}곳 (${rooms.join(" / ")})`;
}

function renderRoomOptions() {
    roomSelect.innerHTML = "";

    if (!state.institution?.rooms?.length) {
        const option = document.createElement("option");
        option.textContent = "먼저 기관을 저장하세요";
        roomSelect.append(option);
        return;
    }

    state.institution.rooms.forEach((room) => {
        const option = document.createElement("option");
        option.value = room;
        option.textContent = room;
        roomSelect.append(option);
    });
}

function renderCabinets() {
    cabinetArea.innerHTML = "";

    if (!state.cabinets.length) {
        cabinetArea.textContent = "등록된 수납장이 없습니다.";
        return;
    }

    state.cabinets.forEach((cabinet) => {
        const wrap = document.createElement("article");
        wrap.className = "cabinet";

        const title = document.createElement("h3");
        title.textContent = cabinet.name;

        const room = document.createElement("p");
        room.className = "room-name";
        room.textContent = `${cabinet.room} · ${cabinet.cols} × ${cabinet.rows}`;

        const grid = document.createElement("div");
        grid.className = "slot-grid";
        grid.style.gridTemplateColumns = `repeat(${cabinet.cols}, minmax(0, 1fr))`;

        cabinet.slots.forEach((slot, slotIndex) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "slot";
            btn.innerHTML = `
                <strong>${slot.name || `칸 ${slotIndex + 1}`}</strong>
                <small>${slot.note || "비어있음"}</small>
                ${slot.photo ? `<img src="${slot.photo}" alt="${slot.name || "수납장 사진"}">` : ""}
            `;

            btn.addEventListener("click", () => {
                editingTarget = { cabinetId: cabinet.id, slotIndex };
                dialogTitle.textContent = `${cabinet.name} · 칸 ${slotIndex + 1}`;
                itemName.value = slot.name;
                itemNote.value = slot.note;
                itemPhoto.value = "";
                slotDialog.showModal();
            });

            grid.append(btn);
        });

        wrap.append(title, room, grid);
        cabinetArea.append(wrap);
    });
}

function loadState() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
            institution: null,
            cabinets: []
        };
    } catch {
        return {
            institution: null,
            cabinets: []
        };
    }
}

function saveAndRender() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    render();
}

function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
