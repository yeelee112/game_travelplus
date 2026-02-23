document.addEventListener("DOMContentLoaded", async () => {

  // ==============================
  // CONFIG SUPABASE
  // ==============================

  const SUPABASE_URL = "https://uqmiaknrfrybkgiscadv.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbWlha25yZnJ5YmtnaXNjYWR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTU0NDAsImV4cCI6MjA4NzM3MTQ0MH0.ehNxlHFVQjFh8Vlub8KJWKWxCs0zRTrQJ52nwVjaEgk";

  const { createClient } = window.supabase;
  const supabaseClient = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  // ==============================
  // ELEMENTS
  // ==============================

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");
  const usernameInput = document.getElementById("username");
  const latestResult = document.getElementById("latestResult");
  const historyList = document.getElementById("history");
  const clientId = crypto.randomUUID();

  const prizeModal = document.getElementById("prizeModal");
    const modalPrizeText = document.getElementById("modalPrizeText");
    const closeModal = document.getElementById("closeModal");

    function showPrizeModal(name, prize) {
    modalPrizeText.innerHTML =
        `<strong>${name}</strong><br><span style="font-size:22px;color:#ff5e62">${prize}</span>`;
    prizeModal.classList.add("show");
    }

    closeModal.addEventListener("click", () => {
    prizeModal.classList.remove("show");
    });

  // ==============================
  // PRIZES (có id riêng để không trùng)
  // ==============================

  const prizes = [
    { id: 1, label: "500.000 VNĐ" },
    { id: 2, label: "500.000 VNĐ" },
    { id: 3, label: "400.000 VNĐ" },
    { id: 4, label: "400.000 VNĐ" },
    { id: 5, label: "300.000 VNĐ" },
    { id: 6, label: "300.000 VNĐ" },
    { id: 7, label: "300.000 VNĐ" },
    { id: 8, label: "200.000 VNĐ" },
    { id: 9, label: "200.000 VNĐ" },
    { id: 10, label: "200.000 VNĐ" },
    { id: 11, label: "100.000 VNĐ" },
    { id: 12, label: "100.000 VNĐ" },
    { id: 13, label: "100.000 VNĐ" },
    { id: 14, label: "50.000 VNĐ" },
    { id: 15, label: "50.000 VNĐ" },
    { id: 16, label: "50.000 VNĐ" },
    { id: 17, label: "Câu chúc" },
  ];

  const colors = ["#f94144","#f3722c","#f9c74f","#90be6d","#577590","#277da1"];

  let usedPrizeIds = new Set();
  let currentAngle = 0;
  let spinning = false;

  // ==============================
  // RESIZE CANVAS (Desktop 500px / Mobile full)
  // ==============================

  function resizeCanvas() {
    const size = canvas.parentElement.offsetWidth;
    canvas.width = size;
    canvas.height = size;
    drawWheel();
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // ==============================
  // LOAD USED PRIZES
  // ==============================

  async function loadUsedPrizes() {
    const { data } = await supabaseClient
      .from("spins")
      .select("prize_id");

    usedPrizeIds = new Set(data.map(item => item.prize_id));
  }

  // ==============================
  // DRAW WHEEL
  // ==============================

  function drawWheel() {

    const arc = (2 * Math.PI) / prizes.length;
    const center = canvas.width / 2;
    const radius = center;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    prizes.forEach((prize, i) => {

      ctx.beginPath();

      if (usedPrizeIds.has(prize.id)) {
        ctx.fillStyle = "#cccccc";
      } else {
        ctx.fillStyle = colors[i % colors.length];
      }

      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, arc * i, arc * (i + 1));
      ctx.fill();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(arc * i + arc / 2);

      ctx.fillStyle = usedPrizeIds.has(prize.id) ? "#666" : "white";
      ctx.font = `bold ${radius * 0.07}px Arial`;
      ctx.fillText(prize.label, radius * 0.55, 5);

      ctx.restore();
    });
  }

  // ==============================
  // EASING
  // ==============================

  function easeOut(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // ==============================
  // SPIN FUNCTION
  // ==============================

  function spinTo(index, callback) {

  const arc = (2 * Math.PI) / prizes.length;
  const pointerAngle = -Math.PI / 2;
  const prizeAngle = index * arc + arc / 2;

  // reset góc về 0-2π
  currentAngle = currentAngle % (2 * Math.PI);

  const extraSpins = 6; // luôn quay 6 vòng thật
  const targetAngle =
    currentAngle +
    extraSpins * 2 * Math.PI +
    (pointerAngle - prizeAngle - currentAngle);

  const duration = 5000;
  const start = performance.now();
  const startAngle = currentAngle;

  function animate(now) {

    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOut(progress);

    currentAngle = startAngle + eased * (targetAngle - startAngle);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(currentAngle);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    drawWheel();
    ctx.restore();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      spinning = false;
      callback();
    }
  }

  requestAnimationFrame(animate);
}

  // ==============================
  // SPIN CLICK
  // ==============================

  spinBtn.addEventListener("click", async () => {

    if (spinning) return;

    const name = usernameInput.value.trim();
    if (!name) return alert("Nhập tên trước!");

    await loadUsedPrizes();

    const available = prizes.filter(p => !usedPrizeIds.has(p.id));

    if (available.length === 0) {
      alert("Hết giải thưởng rồi!");
      return;
    }

    const selected =
      available[Math.floor(Math.random() * available.length)];

    const index = prizes.findIndex(p => p.id === selected.id);

    spinning = true;
    spinBtn.disabled = true;

    spinTo(index, async () => {

      await supabaseClient.from("spins").insert([
        {
          name: name,
            prize: selected.label,
            prize_id: selected.id,
            client_id: clientId
        }
      ]);
      showPrizeModal(name, selected.label);

      usedPrizeIds.add(selected.id);
      drawWheel();

      spinBtn.disabled = false;
    });
  });

  // ==============================
  // LOAD HISTORY
  // ==============================

  async function loadHistory() {

    const { data } = await supabaseClient
      .from("spins")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    historyList.innerHTML = "";

    data.forEach(item => {
      const li = document.createElement("li");
      li.textContent = `${item.name} trúng ${item.prize}`;
      historyList.appendChild(li);
    });
  }

  // ==============================
  // REALTIME LISTENER
  // ==============================

  supabaseClient
  .channel("realtime spins")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "spins" },
    (payload) => {

      const data = payload.new;

      latestResult.innerHTML =
        `🎉 ${data.name} vừa trúng ${data.prize}`;

      usedPrizeIds.add(data.prize_id);
      drawWheel();
      loadHistory();

      // Nếu không phải mình vừa quay → show popup
      if (data.client_id !== clientId) {
        showPrizeModal(data.name, data.prize);
      }
    }
  )
  .subscribe();

  // ==============================
  // INIT
  // ==============================

  await loadUsedPrizes();
  drawWheel();
  loadHistory();


  

});
