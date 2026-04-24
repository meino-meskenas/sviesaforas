import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js'; 
import { createSignal, onCleanup } from 'solid-js';
function trafficLightTimer(
  greenSeconds: any,
  redSeconds: any,
  redStartTime: any
) {
  const now = new Date() as any;
  const redStart = new Date(redStartTime) as any;
  const cycleLength = greenSeconds + redSeconds;

  // How many seconds have passed since that red light started
  const elapsed = (now - redStart) / 1000;

  // Where are we in the current cycle? (red comes first in cycle)
  const positionInCycle = ((elapsed % cycleLength) + cycleLength) % cycleLength;

  let currentLight;
  let nextLight;
  let secondsUntilGreen;

  if (positionInCycle < redSeconds) {
    // We're in a red phase
    currentLight = 'RED';
    nextLight = 'GREEN';
    secondsUntilGreen = redSeconds - positionInCycle;
  } else {
    // We're in a green phase
    currentLight = 'GREEN';
    nextLight = 'RED';
    secondsUntilGreen = cycleLength - positionInCycle + redSeconds;
    // ↑ time left in green + full red phase... but if they want NEXT green:
    secondsUntilGreen = cycleLength - positionInCycle + redSeconds;
  }

  // If currently green, next green = after this green ends + one full red
  if (currentLight === 'GREEN') {
    secondsUntilGreen = redSeconds + (cycleLength - positionInCycle);
  }

  const nextGreenTime = new Date(now.getTime() + secondsUntilGreen * 1000);

  const mins = Math.floor(secondsUntilGreen / 60);
  const secs = Math.floor(secondsUntilGreen % 60);

  return {
    currentLight,
    nextGreenIn: `${mins} min ${secs} sec`,
    nextGreenAt: nextGreenTime.toLocaleTimeString(),
    now: now.toLocaleTimeString(),
    nextLight: nextLight,
  };
}

const App: Component = () => {
  var [model, setModel] = createSignal<any>({});

  setInterval(() => {
    setModel(trafficLightTimer(127, 904, '2026-04-24T07:21:31'));
  });

  return (
<div style={{
  display: "flex",
  "justify-content": "center",
  "align-items": "center",
  height: "100vh",
  "font-family": "'Segoe UI', sans-serif",
  background: "#1a1a2e",
  color: "#eee",
}}>
  <div style={{
    "text-align": "center",
    padding: "40px",
    "border-radius": "16px",
    background: "#16213e",
    "box-shadow": "0 0 30px rgba(0,0,0,0.5)",
    "min-width": "150px",
  }}>
    <div style={{
      width: "80px",
      height: "80px",
      "border-radius": "50%",
      margin: "0 auto 24px",
      background: model().currentLight === "RED" ? "#ff4444" : "#44cc44",
      "box-shadow": `0 0 40px ${model().currentLight === "RED" ? "#ff4444" : "#44cc44"}`,
      transition: "all 0.5s ease",
    }} />

    <div style={{ "font-size": "14px", opacity: 0.6, "margin-bottom": "8px" }}>
      {model().now}
    </div>

    <div style={{
      "font-size": "28px",
      "font-weight": "bold",
      color: model().currentLight === "RED" ? "#ff4444" : "#44cc44",
      "margin-bottom": "20px",
    }}>
      {model().currentLight}
    </div>

    <div style={{
      padding: "16px",
      background: "#0f3460",
      "border-radius": "8px",
      "margin-bottom": "12px",
    }}>
      <div style={{ "font-size": "12px", opacity: 0.6 }}>NEXT GREEN IN</div>
      <div style={{ "font-size": "24px", "font-weight": "bold", color: "#44cc44" }}>
        {model().nextGreenIn}
      </div>
    </div>

    <div style={{ "font-size": "14px", opacity: 0.7 }}>
      {model().nextLight} at {model().nextGreenAt}
    </div>
  </div>
</div>
  );
};

export default App;
