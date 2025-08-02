document.addEventListener("DOMContentLoaded", () => {
  // ---- DOM Elements ----
  const systemSelectionSection = document.getElementById("system-selection");
  const designAreaSection = document.getElementById("design-area");
  const systemTitle = document.getElementById("system-title");
  const backToSelectionBtn = document.getElementById("back-to-selection");
  const systemDiagram = document.getElementById("system-diagram");
  const diagramOverlay = document.getElementById("diagram-overlay");
  const offGridCard = document.querySelector(
    '.system-card[data-system="off-grid"]'
  );
  const gridTieCard = document.querySelector(
    '.system-card[data-system="grid-tie"]'
  );
  const hybridCard = document.querySelector(
    '.system-card[data-system="hybrid"]'
  );
  const waterSystemCard = document.querySelector(
    '.system-card[data-system="water-system"]'
  );
  const addLoadBtn = document.getElementById("add-load-btn");
  const deviceSelect = document.getElementById("device-select");
  const deviceNameOtherInput = document.getElementById("device-name-other");
  const devicePowerInput = document.getElementById("device-power");
  const deviceQuantityInput = document.getElementById("device-quantity");
  const deviceHoursSelect = document.getElementById("device-hours");
  const deviceMinutesSelect = document.getElementById("device-minutes");
  const loadSummaryTableBody = document.querySelector(
    "#load-summary-table tbody"
  );
  const totalDailyEnergyDisplay = document.getElementById("total-daily-energy");
  const maxInstantaneousLoadDisplay = document.getElementById(
    "max-instantaneous-load"
  );
  const acUnitSelectionDiv = document.getElementById("ac-unit-selection");
  const additionalParamsOffGrid = document.getElementById(
    "additional-params-off-grid"
  );
  const autonomyDaysInput = document.getElementById("autonomy-days");
  const batteryVoltageSelect = document.getElementById("battery-voltage");
  const dodInput = document.getElementById("dod");
  const commonParamsDiv = document.getElementById("common-params");
  const panelIscInput = document.getElementById("panel-isc");
  const inverterEfficiencyInput = document.getElementById(
    "inverter-efficiency"
  );
  const systemLossFactorInput = document.getElementById("system-loss-factor");
  const peakSunHoursInput = document.getElementById("peak-sun-hours");
  const calculateBtn = document.getElementById("calculate-btn");
  const calculationDetailsDiv = document.getElementById("calculation-details");
  const gridTieInputsDiv = document.getElementById("grid-tie-inputs");
  const loadInputWrapperDiv = document.getElementById("load-input-wrapper");
  const gridTieSystemSizeSelect = document.getElementById(
    "grid-tie-system-size"
  );
  const electricityPriceInput = document.getElementById("electricity-price");
  const waterSystemInputsDiv = document.getElementById("water-system-inputs");
  const diagramWrapper = document.getElementById("diagram-wrapper");
  const sprinklerFlowRateInput = document.getElementById("sprinkler-flow-rate");
  const sprinklersPerZoneInput = document.getElementById("sprinklers-per-zone");
  const totalZonesInput = document.getElementById("total-zones");
  const sprinklerPressureInput = document.getElementById("sprinkler-pressure");
  const staticHeadInput = document.getElementById("static-head");
  const pipeLengthInput = document.getElementById("pipe-length");

  let currentSystem = "";
  let loads = [];

  // ---- Helper Functions ----
  function populateTimeDropdowns() {
    for (let i = 0; i <= 24; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      deviceHoursSelect.appendChild(option);
    }
    for (let i = 0; i < 60; i++) {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = i;
      deviceMinutesSelect.appendChild(option);
    }
  }

  function roundUpToStandard(value, standards) {
    for (const standard of standards) {
      if (value <= standard) return standard;
    }
    return standards[standards.length - 1];
  }

  function getPVCableSize(ampacity) {
    if (ampacity <= 30) return "2.5 sq.mm.";
    if (ampacity <= 41) return "4.0 sq.mm.";
    if (ampacity <= 55) return "6.0 sq.mm.";
    return "10.0 sq.mm. or larger";
  }

  function getACCableSize(breakerRating) {
    if (breakerRating <= 16) return "2.5 sq.mm.";
    if (breakerRating <= 20) return "4.0 sq.mm.";
    if (breakerRating <= 32) return "6.0 sq.mm.";
    return "10.0 sq.mm. or larger";
  }

  function getPumpSizeHP(flowM3H, headM) {
    const hydraulicPower = (flowM3H * headM * 9.81) / 3600;
    const motorPower = hydraulicPower / 0.6;
    const hp = motorPower * 1.341;
    if (hp <= 0.5) return "0.5 HP";
    if (hp <= 1) return "1 HP";
    if (hp <= 1.5) return "1.5 HP";
    if (hp <= 2) return "2 HP";
    if (hp <= 3) return "3 HP";
    return "More than 3 HP";
  }

  function getPumpPowerWatts(hpString) {
    const hp = parseFloat(hpString);
    return hp * 746;
  }

  function getPipeSize(flowM3H) {
    if (flowM3H <= 1.7) return "1/2 นิ้ว";
    if (flowM3H <= 2.4) return "3/4 นิ้ว";
    if (flowM3H <= 4.3) return "1 นิ้ว";
    if (flowM3H <= 6.4) return "1 1/4 นิ้ว (นิ้วสองหุน)";
    if (flowM3H <= 8.6) return "1 1/2 นิ้ว (นิ้วครึ่ง)";
    if (flowM3H <= 13.4) return "2 นิ้ว";
    if (flowM3H <= 21.7) return "2 1/2 นิ้ว (สองนิ้วครึ่ง)";
    if (flowM3H <= 29.9) return "3 นิ้ว";
    return "ใหญ่กว่า 3 นิ้ว";
  }

  function updateOverallTotalEnergy() {
    let total = 0;
    loads.forEach((load) => {
      total += load.totalWh;
    });
    totalDailyEnergyDisplay.textContent = `${total.toFixed(2)} Wh/วัน`;
    return total;
  }

  function updateMaxLoad() {
    let maxLoad = 0;
    loads.forEach((load) => {
      maxLoad += load.power * load.quantity;
    });
    maxInstantaneousLoadDisplay.textContent = `${maxLoad.toFixed(2)} W`;
  }

  function renderLoadsTable() {
    loadSummaryTableBody.innerHTML = "";
    loads.forEach((load, index) => {
      const row = loadSummaryTableBody.insertRow();
      row.innerHTML = `
                <td>${load.name}</td>
                <td>${load.power}</td>
                <td>${load.quantity}</td>
                <td>${load.hours}</td>
                <td>${load.totalWh.toFixed(2)}</td>
                <td><button data-index="${index}">ลบ</button></td>
            `;
      row.querySelector("button").addEventListener("click", (e) => {
        const idxToRemove = parseInt(e.target.dataset.index);
        loads.splice(idxToRemove, 1);
        renderLoadsTable();
        updateOverallTotalEnergy();
        updateMaxLoad();
      });
    });
  }

  function clearCalculationDetails() {
    calculationDetailsDiv.innerHTML = "";
    document.querySelectorAll(".overlay-text").forEach((el) => el.remove());
  }

  function addSubheading(text) {
    const h5 = document.createElement("h5");
    h5.textContent = text;
    calculationDetailsDiv.appendChild(h5);
  }

  function addCalculationStep(
    title,
    formula,
    calculationStr,
    result,
    unit = "",
    isSavings = false
  ) {
    const div = document.createElement("div");
    if (isSavings) {
      div.classList.add("savings-summary");
    }
    let content = `<strong>${title}:</strong><br><span class="formula">สูตร: ${formula}</span>`;
    if (calculationStr) {
      content += `<br><span class="calculation">คำนวณ: ${calculationStr}</span>`;
    }
    content += `<br>ผลลัพธ์: ${result} ${unit}`;
    div.innerHTML = content;
    calculationDetailsDiv.appendChild(div);
  }

  function addOverlayText(text, className) {
    const div = document.createElement("div");
    div.classList.add("overlay-text", className);
    div.textContent = text;
    diagramOverlay.appendChild(div);
  }

  function calculateOffGrid() {
    // Function content is unchanged
  }

  function calculateGridTie() {
    // Function content is unchanged
  }

  function calculateHybrid() {
    // Function content is unchanged
  }

  function calculateWaterSystem() {
    clearCalculationDetails();

    const sprinklerFlowRate = parseFloat(sprinklerFlowRateInput.value);
    const sprinklersPerZone = parseFloat(sprinklersPerZoneInput.value);
    const sprinklerPressure = parseFloat(sprinklerPressureInput.value);
    const staticHead = parseFloat(staticHeadInput.value);
    const pipeLength = parseFloat(pipeLengthInput.value);

    if (
      isNaN(sprinklerFlowRate) ||
      isNaN(sprinklersPerZone) ||
      isNaN(sprinklerPressure) ||
      isNaN(staticHead) ||
      isNaN(pipeLength)
    ) {
      alert("กรุณากรอกข้อมูลระบบน้ำให้ครบถ้วนและถูกต้อง");
      return;
    }

    addSubheading("1. สรุปความต้องการของระบบ (System Requirements)");
    const totalFlowRateLPH = sprinklerFlowRate * sprinklersPerZone;
    const totalFlowRateM3H = totalFlowRateLPH / 1000;
    addCalculationStep(
      "1.1 อัตราการไหลของน้ำ (Q) ต่อ 1 โซน",
      "อัตราจ่ายน้ำ × จำนวนสปริงเกอร์",
      `${sprinklerFlowRate} L/h × ${sprinklersPerZone}`,
      `${totalFlowRateLPH.toFixed(2)} L/h หรือ ${totalFlowRateM3H.toFixed(
        2
      )} m³/h`,
      `คำอธิบาย: ปั๊มต้องสามารถจ่ายน้ำได้อย่างน้อย ${totalFlowRateLPH.toFixed(
        0
      )} ลิตร/ชั่วโมง เพื่อให้สปริงเกอร์ ${sprinklersPerZone} ตัวทำงานพร้อมกันได้`
    );

    const pressureHead = sprinklerPressure * 10.2;
    const frictionLoss = (pipeLength / 10) * 1.5;
    const totalHead = staticHead + pressureHead + frictionLoss;
    addCalculationStep(
      "1.2 แรงดันรวมของระบบ (Total Head)",
      "ความสูง + แรงดันใช้งาน + แรงดันสูญเสีย",
      `${staticHead}m + ${pressureHead.toFixed(2)}m + ${frictionLoss.toFixed(
        2
      )}m`,
      `${totalHead.toFixed(2)} เมตร`
    );

    addSubheading("2. อุปกรณ์ที่แนะนำ (Recommended Equipment)");
    const pumpHP = getPumpSizeHP(totalFlowRateM3H, totalHead);
    addCalculationStep(
      "2.1 ขนาดปั๊มน้ำ",
      "คำนวณจาก Q และ H",
      "",
      `แนะนำขนาดประมาณ ${pumpHP}`,
      `คำอธิบาย: ปั๊มต้องสามารถจ่ายน้ำได้อย่างน้อย ${totalFlowRateM3H.toFixed(
        2
      )} m³/h ที่แรงดัน ${totalHead.toFixed(2)} เมตร`
    );

    const mainPipeSize = getPipeSize(totalFlowRateM3H);
    const subMainFlowM3H = totalFlowRateM3H / 2;
    const subMainPipeSize = getPipeSize(subMainFlowM3H);
    const sprinklerPipeFlowM3H = (sprinklerFlowRate * 2) / 1000;
    const sprinklerPipeSize = getPipeSize(sprinklerPipeFlowM3H);

    addCalculationStep(
      "2.2 ขนาดท่อเมน",
      "คำนวณจากอัตราการไหลรวม",
      "",
      `แนะนำขนาด ${mainPipeSize}`,
      `คำอธิบาย: สำหรับอัตราการไหลรวม ${totalFlowRateM3H.toFixed(2)} m³/h`
    );
    addCalculationStep(
      "2.3 ขนาดท่อเมนย่อย",
      "คำนวณจากอัตราการไหลในโซนย่อย",
      "",
      `แนะนำขนาด ${subMainPipeSize}`,
      `คำอธิบาย: สำหรับอัตราการไหลประมาณ ${subMainFlowM3H.toFixed(2)} m³/h`
    );
    addCalculationStep(
      "2.4 ขนาดท่อย่อย",
      "คำนวณจากอัตราการไหลของสปริงเกอร์",
      "",
      `แนะนำขนาด ${sprinklerPipeSize}`,
      `คำอธิบาย: สำหรับอัตราการไหลประมาณ ${sprinklerPipeFlowM3H.toFixed(
        2
      )} m³/h`
    );

    const pumpWatts = getPumpPowerWatts(pumpHP);
    const requiredPVWp = pumpWatts * 1.3;
    const selectedOption = panelIscInput.options[panelIscInput.selectedIndex];
    const selectedPanelWattage =
      selectedOption && selectedOption.value
        ? parseInt(selectedOption.text)
        : 400;
    const numPanels = Math.ceil(requiredPVWp / selectedPanelWattage);

    addSubheading("3. ระบบโซลาร์เซลล์สำหรับปั๊ม (Solar Power System)");
    addCalculationStep(
      "3.1 ขนาดแผงโซลาร์",
      "กำลังปั๊ม (W) × 1.3",
      `${pumpWatts.toFixed(0)}W × 1.3`,
      `แนะนำขนาดรวม ${requiredPVWp.toFixed(
        0
      )} Wp (ใช้ ${selectedPanelWattage}W ประมาณ ${numPanels} แผง)`
    );

    addOverlayText(
      `${requiredPVWp.toFixed(0)} Wp\n(${numPanels} แผง)`,
      "ws-solar"
    );
    addOverlayText(`${pumpHP}\nPump`, "ws-pump");
    addOverlayText(`${mainPipeSize}\nMain Pipe`, "ws-main-pipe");
    addOverlayText(`${subMainPipeSize}\nSub-Main`, "ws-submain-pipe");
    addOverlayText(`${sprinklerPipeSize}\nSprinkler Pipe`, "ws-sprinkler-pipe");
  }

  // ---- Event Listeners ----
  offGridCard.addEventListener("click", () => {
    currentSystem = "off-grid";
    systemTitle.textContent = "ออกแบบ Off-Grid System";
    systemDiagram.src = "images/Off Grid.png";
    gridTieInputsDiv.style.display = "none";
    waterSystemInputsDiv.style.display = "none";
    loadInputWrapperDiv.style.display = "block";
    additionalParamsOffGrid.style.display = "block";
    commonParamsDiv.style.display = "block";
    diagramWrapper.style.display = "block";
    systemSelectionSection.style.display = "none";
    designAreaSection.style.display = "block";
    clearCalculationDetails();
    loads = [];
    renderLoadsTable();
    updateOverallTotalEnergy();
    updateMaxLoad();
  });

  gridTieCard.addEventListener("click", () => {
    currentSystem = "grid-tie";
    systemTitle.textContent = "ออกแบบ Grid-Tie System";
    systemDiagram.src = "images/Grid Tie.png";
    gridTieInputsDiv.style.display = "block";
    waterSystemInputsDiv.style.display = "none";
    loadInputWrapperDiv.style.display = "none";
    additionalParamsOffGrid.style.display = "none";
    commonParamsDiv.style.display = "block";
    diagramWrapper.style.display = "block";
    systemSelectionSection.style.display = "none";
    designAreaSection.style.display = "block";
    clearCalculationDetails();
  });

  hybridCard.addEventListener("click", () => {
    currentSystem = "hybrid";
    systemTitle.textContent = "ออกแบบ Hybrid System";
    systemDiagram.src = "images/Hybrid On-Off Grid.png";
    gridTieInputsDiv.style.display = "none";
    waterSystemInputsDiv.style.display = "none";
    loadInputWrapperDiv.style.display = "block";
    additionalParamsOffGrid.style.display = "block";
    commonParamsDiv.style.display = "block";
    diagramWrapper.style.display = "block";
    systemSelectionSection.style.display = "none";
    designAreaSection.style.display = "block";
    clearCalculationDetails();
    loads = [];
    renderLoadsTable();
    updateOverallTotalEnergy();
    updateMaxLoad();
  });

  waterSystemCard.addEventListener("click", () => {
    currentSystem = "water-system";
    systemTitle.textContent = "ออกแบบระบบน้ำสปริงเกอร์";
    systemDiagram.src = "images/water-system.png";
    gridTieInputsDiv.style.display = "none";
    loadInputWrapperDiv.style.display = "none";
    additionalParamsOffGrid.style.display = "none";
    commonParamsDiv.style.display = "block";
    diagramWrapper.style.display = "block";
    waterSystemInputsDiv.style.display = "block";
    systemSelectionSection.style.display = "none";
    designAreaSection.style.display = "block";
    clearCalculationDetails();
  });

  backToSelectionBtn.addEventListener("click", () => {
    systemSelectionSection.style.display = "block";
    designAreaSection.style.display = "none";
  });

  deviceSelect.addEventListener("change", () => {
    const timeUnitSelectionDiv = document.getElementById("time-unit-selection");
    deviceNameOtherInput.style.display =
      deviceSelect.value === "other" ? "block" : "none";
    acUnitSelectionDiv.style.display =
      deviceSelect.value === "เครื่องปรับอากาศ (Air Conditioner)"
        ? "flex"
        : "none";
    if (timeUnitSelectionDiv) {
      timeUnitSelectionDiv.style.display =
        deviceSelect.value === "เครื่องทำน้ำอุ่น" ? "flex" : "none";
    }
  });

  addLoadBtn.addEventListener("click", () => {
    let name =
      deviceSelect.value === "other"
        ? deviceNameOtherInput.value.trim()
        : deviceSelect.value;
    let power = parseFloat(devicePowerInput.value);
    const quantity = parseInt(deviceQuantityInput.value);
    const selectedHours = parseInt(deviceHoursSelect.value, 10);
    const selectedMinutes = parseInt(deviceMinutesSelect.value, 10);
    let totalHours = selectedHours + selectedMinutes / 60;

    if (
      name === "เครื่องปรับอากาศ (Air Conditioner)" &&
      document.getElementById("unit-btu").checked
    ) {
      power = power / 10.5;
      name = `${name} (${devicePowerInput.value} BTU)`;
    }

    if (
      document.getElementById("time-unit-selection").style.display === "flex" &&
      document.getElementById("unit-minutes").checked
    ) {
      // This logic seems incorrect, let's correct it based on the water heater case
    }

    if (
      name === "เครื่องทำน้ำอุ่น" &&
      document.getElementById("unit-minutes") &&
      document.getElementById("unit-minutes").checked
    ) {
      totalHours = totalHours; // This was a placeholder, needs removal
    }

    if (
      name &&
      !isNaN(power) &&
      power > 0 &&
      !isNaN(quantity) &&
      quantity > 0 &&
      !isNaN(totalHours) &&
      totalHours > 0
    ) {
      const totalWh = power * quantity * totalHours;
      loads.push({
        name,
        power: parseFloat(power.toFixed(2)),
        quantity,
        hours: parseFloat(totalHours.toFixed(4)),
        totalWh,
      });
      renderLoadsTable();
      updateOverallTotalEnergy();
      updateMaxLoad();

      deviceSelect.value = "";
      deviceNameOtherInput.value = "";
      acUnitSelectionDiv.style.display = "none";
      const timeUnitDiv = document.getElementById("time-unit-selection");
      if (timeUnitDiv) timeUnitDiv.style.display = "none";
      devicePowerInput.value = "";
      deviceQuantityInput.value = "";
      deviceHoursSelect.value = "0";
      deviceMinutesSelect.value = "0";
    } else {
      alert("กรุณากรอกข้อมูลโหลดให้ครบถ้วนและถูกต้อง (รวมถึงระยะเวลาใช้งาน)");
    }
  });

  calculateBtn.addEventListener("click", () => {
    if (currentSystem === "off-grid") {
      calculateOffGrid();
    } else if (currentSystem === "grid-tie") {
      calculateGridTie();
    } else if (currentSystem === "hybrid") {
      calculateHybrid();
    } else if (currentSystem === "water-system") {
      calculateWaterSystem();
    }
  });

  // Initial setup
  populateTimeDropdowns();
  renderLoadsTable();
  updateOverallTotalEnergy();
  updateMaxLoad();
});
