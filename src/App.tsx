import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';
import { trafficLightTimer } from './calculationFunction';
import { Calculator, ICalculatiorModel } from './Calculator';


const App: Component = () => {
  var [karveliskes, setKarveliskes] = createSignal<ICalculatiorModel>({} as any);
  var [vilnius, setVilnius] = createSignal<ICalculatiorModel>({} as any);

  setInterval(() => {
    setKarveliskes(trafficLightTimer("Karveliskes -> Vilnius", 127, 904, '2026-04-24T07:21:31'));
    setVilnius(trafficLightTimer("Vilnius -> Karveliskes", 127, 904, '2026-04-24T12:56:54'));
  });

  return (
    <div>
      <div style={{
        display: "flex",
        "justify-content": "center",
        "align-items": "center",
        height: "100vh",
        overflow: "auto",
        "font-family": "'Segoe UI', sans-serif",
        background: "#1a1a2e",
        color: "#eee",
        "flex-direction": "column",
      }}>
        <Calculator model={karveliskes()} ></Calculator>
        <Calculator model={vilnius()} ></Calculator>
      </div>


    </div>
  );
};

export default App;
