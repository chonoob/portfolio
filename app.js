const STORAGE_KEY = "kindergarten_submissions_v2";
const ADMIN_PIN = "admin1234";

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const form = document.getElementById("consentForm");
const message = document.getElementById("submitMessage");
const adminPinInput = document.getElementById("adminPin");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminPanel = document.getElementById("adminPanel");
const submissionList = document.getElementById("submissionList");
const exportBtn = document.getElementById("exportBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

function activateTab(tabName) {
  tabButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabName));
  tabContents.forEach((tab) => tab.classList.toggle("active", tab.id === tabName));
}

tabButtons.forEach((btn) => btn.addEventListener("click", () => activateTab(btn.dataset.tab)));

function getSubmissions() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function setSubmissions(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function setupSignaturePad(canvas, clearBtn) {
  const ctx = canvas.getContext("2d");
  let drawing = false;
  let hasDrawn = false;

  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#17273f";

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (point.clientX - rect.left) * scaleX, y: (point.clientY - rect.top) * scaleY };
  }

  function start(e) {
    drawing = true;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    e.preventDefault();
  }

  function draw(e) {
    if (!drawing) return;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    hasDrawn = true;
    e.preventDefault();
  }

  function end() {
    drawing = false;
    ctx.closePath();
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", draw);
  window.addEventListener("mouseup", end);
  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", end);

  clearBtn.addEventListener("click", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn = false;
  });

  return {
    get name() { return canvas.dataset.name; },
    get value() { return hasDrawn ? canvas.toDataURL("image/png") : ""; },
    clear() { clearBtn.click(); },
  };
}

const signatureControllers = [];
document.querySelectorAll(".signature-pad").forEach((canvas) => {
  const clearBtn = canvas.parentElement.querySelector(".clear-sign");
  signatureControllers.push(setupSignaturePad(canvas, clearBtn));
});

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  payload.submittedAt = new Date().toISOString();
  payload.signatures = {};
  signatureControllers.forEach((sig) => {
    payload.signatures[sig.name] = sig.value;
  });

  const mustSign = ["sign_admission", "sign_emergency", "sign_gov"];
  const unsigned = mustSign.filter((name) => !payload.signatures[name]);
  if (unsigned.length) {
    message.textContent = "필수 서명란(입학원서/응급동의/행정정보동의)을 모두 서명해주세요.";
    message.style.color = "#c23737";
    return;
  }

  const data = getSubmissions();
  data.unshift(payload);
  setSubmissions(data);

  form.reset();
  signatureControllers.forEach((sig) => sig.clear());
  message.textContent = "원본 양식 기반 서류 제출이 완료되었습니다.";
  message.style.color = "#1e7a34";
});

function renderAdminList() {
  const data = getSubmissions();
  if (!data.length) {
    submissionList.innerHTML = "<p>아직 제출된 서류가 없습니다.</p>";
    return;
  }

  submissionList.innerHTML = data.map((item, index) => {
    const signatures = Object.entries(item.signatures || {})
      .filter(([, value]) => value)
      .map(([name, value]) => `<div><small>${name}</small><img src="${value}" alt="${name}" /></div>`)
      .join("");

    return `
      <article class="submission">
        <h3>#${data.length - index} ${item.childName || "이름 없음"}</h3>
        <p><strong>제출:</strong> ${new Date(item.submittedAt).toLocaleString("ko-KR")}</p>
        <p><strong>보호자:</strong> ${item.guardianName || "-"} (${item.guardianRelation || "-"}) / ${item.guardianPhone || "-"}</p>
        <p><strong>유아:</strong> ${item.childName || "-"}, ${item.classAge || "-"}, ${item.childBirth || "-"}</p>
        <p><strong>주소:</strong> ${item.address || "-"}</p>
        <p><strong>주요 신청:</strong> 방과후(${item.afterSchoolWish || "-"}), 연장돌봄(${item.extendedCareApply ? "신청" : "미신청"})</p>
        <div class="sig-list">${signatures || "<small>서명 없음</small>"}</div>
      </article>
    `;
  }).join("");
}

adminLoginBtn.addEventListener("click", () => {
  if (adminPinInput.value !== ADMIN_PIN) {
    alert("관리자 PIN이 올바르지 않습니다.");
    return;
  }
  adminPanel.classList.remove("hidden");
  renderAdminList();
});

exportBtn.addEventListener("click", () => {
  const data = JSON.stringify(getSubmissions(), null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kindergarten-consent-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

clearAllBtn.addEventListener("click", () => {
  if (!confirm("모든 제출 데이터를 삭제할까요?")) return;
  setSubmissions([]);
  renderAdminList();
});
