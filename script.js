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
    clearCalculationDetails();

    const totalDailyLoadEnergyWh = updateOverallTotalEnergy();
    if (totalDailyLoadEnergyWh === 0) {
      alert("กรุณาเพิ่มโหลดการใช้งานก่อนคำนวณ");
      return;
    }

    const isc = parseFloat(panelIscInput.value);
    if (isNaN(isc) || isc <= 0) {
      alert("กรุณาเลือกขนาดแผงโซลาร์เซลล์ (เพื่อหาค่า Isc)");
      return;
    }

    const selectedOption = panelIscInput.options[panelIscInput.selectedIndex];
    const selectedPanelWattage = parseInt(selectedOption.text);

    const autonomyDays = parseFloat(autonomyDaysInput.value);
    const batteryVoltage = parseFloat(batteryVoltageSelect.value);
    const dod = parseFloat(dodInput.value) / 100;
    const inverterEfficiency = parseFloat(inverterEfficiencyInput.value) / 100;
    const systemLossFactor = parseFloat(systemLossFactorInput.value) / 100;
    const peakSunHours = parseFloat(peakSunHoursInput.value);

    addSubheading("1. ขนาดระบบหลัก (System Sizing)");
    const pvEnergyRequiredWh =
      totalDailyLoadEnergyWh / inverterEfficiency / systemLossFactor;
    addCalculationStep(
      "1.1 พลังงานที่ต้องการจากแผง",
      `(พลังงานโหลด / Eff. Inv) / Loss`,
      `(${totalDailyLoadEnergyWh.toFixed(
        2
      )} / ${inverterEfficiency}) / ${systemLossFactor}`,
      pvEnergyRequiredWh.toFixed(2),
      "Wh/วัน"
    );

    const theoreticalWp = pvEnergyRequiredWh / peakSunHours;
    addCalculationStep(
      "1.2 ขนาดแผง (ตามทฤษฎี)",
      `พลังงานจากแผง / PSH`,
      `${pvEnergyRequiredWh.toFixed(2)}Wh / ${peakSunHours}h`,
      `${theoreticalWp.toFixed(2)} Wp`
    );

    const theoreticalNumPanels = Math.ceil(
      theoreticalWp / selectedPanelWattage
    );
    const panelVoc = 48;
    const controllerMaxVoltage = batteryVoltage >= 48 ? 150 : 100;
    const maxPanelsInSeries = Math.floor(controllerMaxVoltage / panelVoc);
    const numStrings = Math.ceil(theoreticalNumPanels / maxPanelsInSeries);

    const actualNumPanels = numStrings * maxPanelsInSeries;
    const actualWp = actualNumPanels * selectedPanelWattage;

    addCalculationStep(
      "1.3 การต่อแผง",
      `คำนวณจาก Wp ทฤษฎีและการจัดวาง`,
      `จาก ${theoreticalWp.toFixed(2)}Wp จัดวางให้ได้ ${actualNumPanels} แผง`,
      `ต่ออนุกรมสตริงละ ${maxPanelsInSeries} แผง, จำนวน ${numStrings} สตริง`
    );
    addCalculationStep(
      "1.4 ขนาดแผง (ติดตั้งจริง)",
      `จำนวนแผงจริง × W แผง`,
      `${actualNumPanels} × ${selectedPanelWattage}W`,
      `${actualWp.toFixed(0)} Wp`
    );

    let maxInstantaneousLoadW = 0;
    loads.forEach((load) => {
      maxInstantaneousLoadW += load.power * load.quantity;
    });
    const inverterSizeW = maxInstantaneousLoadW * 1.25;
    const recommendedInverterkW = Math.ceil((inverterSizeW / 1000) * 10) / 10;
    addCalculationStep(
      "1.5 ขนาด Inverter",
      `โหลดสูงสุด × 1.25`,
      `${maxInstantaneousLoadW.toFixed(2)}W × 1.25`,
      `${inverterSizeW.toFixed(2)} W (แนะนำ ${recommendedInverterkW}kW)`
    );

    const energyFromBatteryWh =
      (totalDailyLoadEnergyWh * autonomyDays) / inverterEfficiency;
    const batteryCapacityAh = energyFromBatteryWh / (batteryVoltage * dod);
    const recommendedBatteryAh = 100;
    const numBatteries = Math.ceil(batteryCapacityAh / recommendedBatteryAh);
    addCalculationStep(
      "1.6 ขนาดแบตเตอรี่",
      `(พลังงานโหลด × วันสำรอง) / (V × DoD × Eff. Inv)`,
      `(${totalDailyLoadEnergyWh.toFixed(
        2
      )} × ${autonomyDays}) / (${batteryVoltage} × ${dod} × ${inverterEfficiency})`,
      `${batteryCapacityAh.toFixed(
        2
      )} Ah (แนะนำ ${numBatteries} ลูก ${recommendedBatteryAh}Ah ${batteryVoltage}V)`
    );

    addSubheading("2. อุปกรณ์ป้องกันฝั่ง DC");
    const requiredFuseCurrent = isc * 1.56;
    const recommendedFuse = roundUpToStandard(
      requiredFuseCurrent,
      [10, 15, 20, 25, 30]
    );
    addCalculationStep(
      "2.1 PV String Fuse",
      `Isc × 1.56`,
      `${isc.toFixed(2)}A × 1.56`,
      `แนะนำ ${recommendedFuse}A (ป้องกันกระแสเกินในสายแผง)`
    );

    const pvCableAmpacity = isc * 1.56;
    const recommendedPVCable = getPVCableSize(pvCableAmpacity);
    addCalculationStep(
      "2.2 ขนาดสาย PV1-F",
      `ทนกระแส > ${pvCableAmpacity.toFixed(2)} A`,
      ``,
      `แนะนำ ${recommendedPVCable} (สายไฟทนแดดฝนสำหรับแผง)`
    );

    addCalculationStep(
      "2.3 DC Surge (PV)",
      "เลือกตามแรงดันระบบ",
      ``,
      `แนะนำ > ${controllerMaxVoltage}Vdc (ป้องกันฟ้าผ่า/ไฟกระชากฝั่งแผง)`
    );

    const maxPanelCurrentA = (actualWp / batteryVoltage) * 1.25;
    const recommendedPVBreaker = roundUpToStandard(
      maxPanelCurrentA,
      [16, 20, 25, 32, 40, 50, 63, 80, 100, 125]
    );
    addCalculationStep(
      "2.4 DC Breaker (PV to Controller)",
      `(Wpจริง / Vระบบ) × 1.25`,
      `(${actualWp.toFixed(2)}W / ${batteryVoltage}V) × 1.25`,
      `${maxPanelCurrentA.toFixed(
        2
      )} A (แนะนำ ${recommendedPVBreaker}A - เบรกเกอร์หลักฝั่งแผง)`
    );

    const maxInverterCurrent =
      ((recommendedInverterkW * 1000) / batteryVoltage) * 1.25;
    const recommendedBatteryBreaker = roundUpToStandard(
      maxInverterCurrent,
      [63, 80, 100, 125, 150, 200]
    );
    addCalculationStep(
      "2.5 Main DC Breaker (Battery to Inverter)",
      `(P_inv / Vระบบ) × 1.25`,
      `(${recommendedInverterkW * 1000}W / ${batteryVoltage}V) × 1.25`,
      `${maxInverterCurrent.toFixed(
        2
      )} A (แนะนำ ${recommendedBatteryBreaker}A - เบรกเกอร์หลักป้องกันแบตเตอรี่)`
    );

    addSubheading("3. อุปกรณ์ป้องกันฝั่ง AC");
    const maxACCurrent = ((recommendedInverterkW * 1000) / 230) * 1.25;
    const recommendedACBreaker = roundUpToStandard(
      maxACCurrent,
      [10, 16, 20, 25, 32]
    );
    const recommendedACFuse = recommendedACBreaker;

    addCalculationStep(
      "3.1 AC Fuse (Output)",
      `เลือกให้เท่ากับ AC Breaker`,
      ``,
      `แนะนำ ${recommendedACFuse}A (ฟิวส์ป้องกันโหลด AC)`
    );
    addCalculationStep(
      "3.2 AC Surge (Output)",
      "เลือกตามแรงดันไฟบ้าน",
      ``,
      "แนะนำ 275Vac (ป้องกันไฟกระชากฝั่ง AC)"
    );
    addCalculationStep(
      "3.3 AC Breaker (Output)",
      `(P_inv / 230V) × 1.25`,
      `(${recommendedInverterkW * 1000}W / 230V) × 1.25`,
      `${maxACCurrent.toFixed(
        2
      )} A (แนะนำ ${recommendedACBreaker}A - เบรกเกอร์ไฟบ้าน)`
    );
    const recommendedACCable = getACCableSize(recommendedACBreaker);
    addCalculationStep(
      "3.4 ขนาดสาย AC (VAF/THW)",
      `เลือกตามขนาดเบรกเกอร์`,
      ``,
      `แนะนำ ${recommendedACCable} (สายไฟสำหรับโหลด AC)`
    );

    addOverlayText(
      `${selectedPanelWattage}W x ${actualNumPanels} แผง\n(รวม ${actualWp.toFixed(
        0
      )} Wp)`,
      "solar-panels"
    );
    addOverlayText(`${recommendedPVBreaker}A\nMPPT`, "charge-controller");
    addOverlayText(`${recommendedInverterkW} kW\nInverter`, "inverter");
    addOverlayText(
      `${recommendedBatteryAh}Ah x ${numBatteries} ลูก\n(รวม ${batteryCapacityAh.toFixed(
        0
      )}Ah)`,
      "battery"
    );
    addOverlayText(`โหลด AC\n${maxInstantaneousLoadW.toFixed(0)}W`, "ac-load");
    addOverlayText(`โหลด DC\n(ถ้ามี)`, "dc-load");
    addOverlayText(`${recommendedFuse}A\nFuse DC`, "og-pv-fuse");
    addOverlayText(`>${controllerMaxVoltage}Vdc\nDC Surge`, "og-dc-surge");
    addOverlayText(`${recommendedPVBreaker}A\nBreaker`, "og-pv-breaker");
    addOverlayText(`${recommendedPVBreaker}A\nBreaker`, "og-ctrl-batt-breaker");
    addOverlayText(
      `${recommendedBatteryBreaker}A\nBreaker`,
      "og-batt-inv-breaker"
    );
    addOverlayText(`${recommendedACFuse}A\nAC Fuse`, "og-ac-fuse");
    addOverlayText(`275Vac\nAC Surge`, "og-ac-surge");
    addOverlayText(`${recommendedACBreaker}A\nAC Breaker`, "og-ac-breaker");
  }

  function calculateGridTie() {
    clearCalculationDetails();

    const systemSizekW = parseFloat(gridTieSystemSizeSelect.value);
    const pricePerUnit = parseFloat(electricityPriceInput.value);
    const isc = parseFloat(panelIscInput.value);

    if (isNaN(isc) || isc <= 0) {
      alert("กรุณาเลือกขนาดแผงโซลาร์เซลล์ (เพื่อหาค่า Isc)");
      return;
    }
    if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
      alert("กรุณากรอกค่าไฟฟ้าต่อหน่วยให้ถูกต้อง");
      return;
    }

    const selectedOption = panelIscInput.options[panelIscInput.selectedIndex];
    const selectedPanelWattage = parseInt(selectedOption.text);

    const systemLossFactor = parseFloat(systemLossFactorInput.value) / 100;
    const peakSunHours = parseFloat(peakSunHoursInput.value);

    addSubheading("1. ผลการประหยัดพลังงาน");
    const energyPerDay = systemSizekW * peakSunHours * systemLossFactor;
    addCalculationStep(
      "1.1 พลังงานที่ผลิตได้ต่อวัน",
      `ขนาดระบบ(kW) × PSH × Loss`,
      `${systemSizekW}kW × ${peakSunHours} × ${systemLossFactor}`,
      energyPerDay.toFixed(2),
      "kWh/วัน"
    );

    const energyPerMonth = energyPerDay * 30;
    const savingsPerMonth = energyPerMonth * pricePerUnit;
    addCalculationStep(
      "1.2 ประหยัดค่าไฟต่อเดือน",
      `พลังงานต่อเดือน × ค่าไฟ`,
      `${energyPerMonth.toFixed(2)}kWh × ${pricePerUnit} บาท`,
      `${savingsPerMonth.toFixed(2)} บาท/เดือน`,
      "",
      true
    );

    const savingsPerYear = savingsPerMonth * 12;
    addCalculationStep(
      "1.3 ประหยัดค่าไฟต่อปี",
      `ประหยัดต่อเดือน × 12`,
      `${savingsPerMonth.toFixed(2)} × 12`,
      `${savingsPerYear.toFixed(2)} บาท/ปี`,
      "",
      true
    );

    addSubheading("2. อุปกรณ์สำหรับระบบขนาด " + systemSizekW + " kW");
    const recommendedInverterkW = systemSizekW;
    addCalculationStep(
      "2.1 ขนาด Grid-Tie Inverter",
      `เลือกตามขนาดระบบ`,
      ``,
      `แนะนำ ${recommendedInverterkW}kW`
    );

    const actualNumPanels = Math.ceil(
      (recommendedInverterkW * 1000) / selectedPanelWattage
    );
    const actualWp = actualNumPanels * selectedPanelWattage;

    const panelVoc = 48;
    const inverterMaxVoltage = 550;
    const maxPanelsInSeries = Math.floor(inverterMaxVoltage / panelVoc);
    const numStrings = Math.ceil(actualNumPanels / maxPanelsInSeries);

    addCalculationStep(
      "2.2 ขนาดแผงโซลาร์",
      `(ขนาด Inverter / Wแผง)`,
      `(${recommendedInverterkW * 1000}W / ${selectedPanelWattage}W)`,
      `${actualWp.toFixed(0)} Wp (ใช้จริง ${actualNumPanels} แผง)`
    );

    let stringDescription = `ต่ออนุกรม ${actualNumPanels} แผง, จำนวน 1 สตริง`;
    if (numStrings > 1) {
      stringDescription = `ต่ออนุกรมสตริงละ ${maxPanelsInSeries} แผง, จำนวน ${numStrings} สตริง (อาจต้องปรับจำนวนแผงให้ลงตัว)`;
    }
    if (actualNumPanels <= maxPanelsInSeries) {
      stringDescription = `ต่ออนุกรม ${actualNumPanels} แผง, จำนวน 1 สตริง`;
    }
    addCalculationStep(
      "2.3 การต่อแผง",
      `(อ้างอิง Inverter ${inverterMaxVoltage}V)`,
      ``,
      stringDescription
    );

    addSubheading("3. อุปกรณ์ป้องกันฝั่ง DC");
    const requiredFuseCurrent = isc * 1.56;
    const recommendedFuse = roundUpToStandard(
      requiredFuseCurrent,
      [10, 15, 20, 25, 30]
    );
    addCalculationStep(
      "3.1 PV String Fuse",
      `Isc × 1.56`,
      `${isc.toFixed(2)}A × 1.56`,
      `แนะนำ ${recommendedFuse}A (ป้องกันกระแสเกินในสายแผง)`
    );

    const pvCableAmpacity = isc * 1.56;
    const recommendedPVCable = getPVCableSize(pvCableAmpacity);
    addCalculationStep(
      "3.2 ขนาดสาย PV1-F",
      `ทนกระแส > ${pvCableAmpacity.toFixed(2)} A`,
      ``,
      `แนะนำ ${recommendedPVCable} (สายไฟทนแดดฝนสำหรับแผง)`
    );

    addCalculationStep(
      "3.3 DC Surge (PV)",
      "เลือกตามแรงดันระบบ",
      ``,
      `แนะนำ 1000Vdc (ป้องกันฟ้าผ่า/ไฟกระชากฝั่งแผง)`
    );

    const maxTotalCurrent = isc * numStrings * 1.25;
    const recommendedDCBreaker = roundUpToStandard(
      maxTotalCurrent,
      [16, 20, 25, 32, 40, 50, 63]
    );
    addCalculationStep(
      "3.4 DC Breaker (PV to Inverter)",
      `(Isc × จำนวนสตริง) × 1.25`,
      `(${isc.toFixed(2)}A × ${numStrings}) × 1.25`,
      `แนะนำ ${recommendedDCBreaker}A (เบรกเกอร์หลักฝั่งแผง)`
    );

    addSubheading("4. อุปกรณ์ป้องกันฝั่ง AC");
    const maxACCurrent = ((recommendedInverterkW * 1000) / 230) * 1.25;
    const recommendedACBreaker = roundUpToStandard(
      maxACCurrent,
      [10, 16, 20, 25, 32, 50]
    );
    addCalculationStep(
      "4.1 AC Breaker (Output)",
      `(P_inv / 230V) × 1.25`,
      `(${recommendedInverterkW * 1000}W / 230V) × 1.25`,
      `แนะนำ ${recommendedACBreaker}A (เบรกเกอร์เชื่อมต่อระบบไฟ)`
    );

    const recommendedACCable = getACCableSize(recommendedACBreaker);
    addCalculationStep(
      "4.2 ขนาดสาย AC",
      `เลือกตามขนาดเบรกเกอร์`,
      ``,
      `แนะนำ ${recommendedACCable} (สายไฟเชื่อมต่อระบบ)`
    );
    addCalculationStep(
      "4.3 AC Surge (Output)",
      "เลือกตามแรงดันไฟบ้าน",
      ``,
      "แนะนำ 275Vac (ป้องกันไฟกระชากฝั่ง AC)"
    );

    addOverlayText(
      `${selectedPanelWattage}W x ${actualNumPanels} แผง\n(รวม ${actualWp.toFixed(
        0
      )} Wp)`,
      "solar-panels"
    );
    addOverlayText(`${recommendedInverterkW} kW\nGrid-Tie`, "gridtie-inverter");
    addOverlayText(`${recommendedFuse}A\nFuse DC`, "gt-pv-fuse");
    addOverlayText(`1000Vdc\nDC Surge`, "gt-dc-surge");
    addOverlayText(`${recommendedDCBreaker}A\nDC Breaker`, "gt-dc-breaker");
  }

  // ---- Event Listeners ----
  offGridCard.addEventListener("click", () => {
    currentSystem = "off-grid";
    systemTitle.textContent = "ออกแบบ Off-Grid System";
    systemDiagram.src = "images/Off Grid.png";

    gridTieInputsDiv.style.display = "none";
    loadInputWrapperDiv.style.display = "block";
    additionalParamsOffGrid.style.display = "block";

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
    loadInputWrapperDiv.style.display = "none";
    additionalParamsOffGrid.style.display = "none";

    systemSelectionSection.style.display = "none";
    designAreaSection.style.display = "block";
    clearCalculationDetails();
  });

  backToSelectionBtn.addEventListener("click", () => {
    systemSelectionSection.style.display = "block";
    designAreaSection.style.display = "none";
  });

  deviceSelect.addEventListener("change", () => {
    deviceNameOtherInput.style.display =
      deviceSelect.value === "other" ? "block" : "none";
    acUnitSelectionDiv.style.display =
      deviceSelect.value === "เครื่องปรับอากาศ (Air Conditioner)"
        ? "flex"
        : "none";
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
    const totalHours = selectedHours + selectedMinutes / 60;

    if (
      name === "เครื่องปรับอากาศ (Air Conditioner)" &&
      document.getElementById("unit-btu").checked
    ) {
      power = power / 10.5;
      name = `${name} (${devicePowerInput.value} BTU)`;
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
    }
  });

  // Initial setup
  populateTimeDropdowns();
  renderLoadsTable();
  updateOverallTotalEnergy();
  updateMaxLoad();
});
