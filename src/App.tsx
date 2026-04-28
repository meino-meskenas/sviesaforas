import type { Component, ComponentProps, JSX, ValidComponent } from 'solid-js';
import { createSignal, For, onCleanup } from 'solid-js';
import { trafficLightTimer } from './calculationFunction';
import { Calculator, ICalculatiorModel } from './Calculator';


const App: Component = () => {
  var [karveliskes, setKarveliskes] = createSignal<ICalculatiorModel>({} as any);
  var [vilnius, setVilnius] = createSignal<ICalculatiorModel>({} as any);//
  var [models, setModels] = createSignal<ICalculatiorModel[]>([] as any);//

  var startedOn = "2026-04-24T17:30:39"
  var startedOn2 = "2026-04-24T20:41:06"
  // 13:30:04 -> cia turi buti zalia
  // ////2026-04-24T07:21:31' 
  setInterval(() => {


    setModels((value) => {
      value.length = 0;
      value.push(trafficLightTimer("Karveliskes -> Vilnius", 130, 900, new Date(startedOn)));
      // value.push(trafficLightTimer("Karveliskes -> Vilnius", 130, 900, new Date(startedOn)));
      return value;
    });


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
        <For each={models()}>
          {(item) => {
            return <Calculator model={item} ></Calculator>

          }}
        </For>
      </div>


    </div>
  );
};

export default App;
