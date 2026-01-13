// ================= CONFIG =================
const API_URL = "https://copd-fastapi-backend.onrender.com/predict";

//fetch("https://copd-fastapi-backend.onrender.com/predict", {
//  method: "OPTIONS"
//}).catch(() => {});

// ================= DOM =================
const fev1Input = document.getElementById("fev1");
const fvcInput = document.getElementById("fvc");
const ratioInput = document.getElementById("fev1fvc");
const calculateBtn = document.getElementById("calculateButton");

let riskChart = null;

// ================= HELPERS =================
function num(id) {
  const v = document.getElementById(id).value;
  if (v === "" || v === null) return 0; // IMPORTANT: backend requires numbers
  return parseFloat(v);
}

// ================= RATIO AUTO-CALC =================
function updateRatio() {
  const fev1 = num("fev1");
  const fvc = num("fvc");

  if (fvc > 0) {
    ratioInput.value = (fev1 / fvc).toFixed(2);
  } else {
    ratioInput.value = "";
  }
}

fev1Input.addEventListener("input", updateRatio);
fvcInput.addEventListener("input", updateRatio);

// ================= MAIN CLICK =================
calculateBtn.addEventListener("click", async () => {
  calculateBtn.textContent = "Analyzing...";
  calculateBtn.disabled = true;

  try {
    // ===== PAYLOAD (MATCHES TRAINING FEATURES) =====
    const payload = {
      Age: parseInt(document.getElementById("age").value) || 0,

      // MUST MATCH TRAINING ENCODING
      Gender:
        document.getElementById("gender").value,

      SmokingStatus:
        document.getElementById("smokingStatus").value,
        

      SmokingYears: parseInt(document.getElementById("smokingYears").value) || 0,

      BMI: num("bmi"),
      FEV1_pct: num("fev1"),
      FVC_pct: num("fvc"),
      FEV1_FVC: num("fev1fvc"),

      ChronicCough:
        document.getElementById("chronicCough").value === "yes" ? 1 : 0,

      ShortnessBreath:
        document.getElementById("shortnessBreath").value === "yes" ? 1 : 0,

      PriorHospitalization:
        document.getElementById("priorHospitalization").value === "yes" ? 1 : 0,

      CRP_mg_L: num("crp"),
      SpO2: num("spo2")
    };

    console.log("Sending payload:", payload);

    // ===== API CALL =====
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("API error:", text);
      throw new Error("API request failed");
    }

    const result = await response.json();
    console.log("API result:", result);

    // ===== UI UPDATE =====
    document.getElementById("predictionOutput").textContent =
      result.copd_prediction === 1 ? "COPD DETECTED" : "NO COPD";

    document.getElementById("probabilityOutput").textContent =
      `${result.copd_probability.toFixed(2)}%`;

    document.getElementById("severityOutput").textContent =
      result.severity_percent !== null
        ? `${result.severity_percent.toFixed(2)}%`
        : "N/A";




    let futureRisk = null;

if (result.copd_prediction === 0) {
  futureRisk = result.future_copd_risk;
}

document.getElementById("futureRiskOutput").textContent =
  futureRisk !== null ? `${futureRisk.toFixed(2)}%` : "N/A";




      
    document.getElementById("results").classList.add("show");
    document.getElementById("summaryCard").classList.add("show");

    // ===== SUMMARY LOGIC =====
    const summaryMessages = [];

    if (payload.SmokingStatus === 2) {
      summaryMessages.push(
        "Patient is a current smoker. Smoking cessation is strongly recommended."
      );
    }

    if (payload.CRP_mg_L > 10) {
      summaryMessages.push(
        "Elevated CRP levels detected — consider evaluation for inflammation or infection."
      );
    }

    if (payload.FEV1_FVC < 0.7 && payload.FEV1_FVC > 0) {
      summaryMessages.push(
        "FEV1/FVC ratio suggests airflow obstruction. Spirometry follow-up recommended."
      );
    }

    document.getElementById("summaryText").textContent =
      summaryMessages.length
        ? summaryMessages.join(" ")
        : "No major risk flags detected. Continue routine clinical assessment.";

    // ===== CHART =====
const ctx = document.getElementById("riskChart");

if (riskChart) riskChart.destroy();

// 👉 Decide chart data based on COPD status
const chartLabels =
  result.copd_prediction === 0
    ? ["COPD Probability", "Future Risk"]
    : ["COPD Probability", "Future Risk (N/A)"];

const chartData =
  result.copd_prediction === 0
    ? [result.copd_probability, result.future_copd_risk]
    : [result.copd_probability, 0]; // 0 shown for N/A

riskChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: chartLabels,
    datasets: [{
      //label: "Model Output (%)",
      data: chartData,
      backgroundColor: ["#e2312e", "#fb8c00"]
    }]
  },
  options: {
    indexAxis: "y",
    animation: { duration: 800 },
    plugins: {
      legend: {
        display: false   
    
    },
   title: {
        display: true,
        text: "Model Output (%)",
        font: {
          size: 14,
          weight: "bold"
        },
        padding: {
          bottom: 10
        }
      }
    },
   
   
    scales: {
      x: {
        max: 100,
        title: {
          display: true,
          text: "Percentage (%)"
        }
      }
    }
  }
});


  } catch (err) {
    alert("Prediction failed. Please check inputs or try again.");
    console.error(err);
  } finally {
    calculateBtn.textContent = "Get COPD Risk Prediction";
    calculateBtn.disabled = false;
  }
});
