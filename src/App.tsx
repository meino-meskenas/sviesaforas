import type { Component } from 'solid-js';
import { createSignal, For, onCleanup } from 'solid-js';
import { trafficLightTimer } from './calculationFunction';
import { Calculator, ICalculatiorModel } from './Calculator';
import {
    AdjustmentEvent,
    CalculatorConfig,
    exportAsJson,
    loadConfigs,
    saveConfigs,
} from './storage';


const DEFAULT_CONFIGS: CalculatorConfig[] = [
    {
        id: "karveliskes",
        title: "Karveliskes → Vilnius",
        greenSeconds: 130,
        redSeconds: 900,
        startDate: "2026-04-24T17:30:39",
        adjustments: [],
    },
    {
        id: "vilnius",
        title: "Vilnius → Karveliskes",
        greenSeconds: 130,
        redSeconds: 900,
        startDate: "2026-04-24T20:41:06",
        adjustments: [],
    },
];

function initConfigs(): CalculatorConfig[] {
    return loadConfigs() ?? DEFAULT_CONFIGS;
}

function calcDriftSeconds(a: CalculatorConfig, b: CalculatorConfig, now: Date): number {
    const cycle = (a.redSeconds + a.greenSeconds) * 1000;
    const nowMs = now.getTime();

    function effectiveStartMs(cfg: CalculatorConfig): number {
        const base = new Date(cfg.startDate).getTime();
        const redMs = cfg.redSeconds * 1000;
        const past = cfg.adjustments
            .map(adj => new Date(adj.timestamp).getTime())
            .filter(t => t <= nowMs)
            .sort((x, y) => y - x);
        return past.length > 0 ? past[0] - redMs : base;
    }

    const posA = ((nowMs - effectiveStartMs(a)) % cycle + cycle) % cycle;
    const posB = ((nowMs - effectiveStartMs(b)) % cycle + cycle) % cycle;
    return Math.round((posB - posA) / 1000);
}

const App: Component = () => {
    const [configs, setConfigs] = createSignal<CalculatorConfig[]>(initConfigs());
    const [models, setModels] = createSignal<ICalculatiorModel[]>([]);

    const tick = () => {
        const now = new Date();
        setModels(configs().map(cfg =>
            trafficLightTimer(cfg.title, cfg.greenSeconds, cfg.redSeconds, new Date(cfg.startDate), now, cfg.adjustments)
        ));
    };

    tick();
    const timer = setInterval(tick, 1000);
    onCleanup(() => clearInterval(timer));

    function updateConfigs(updated: CalculatorConfig[]) {
        setConfigs(updated);
        saveConfigs(updated);
    }

    function addAdjustment(cfgId: string) {
        const now = new Date();
        const adj: AdjustmentEvent = {
            id: crypto.randomUUID(),
            timestamp: now.toISOString(),
            label: `adj ${now.toLocaleTimeString()}`,
        };
        updateConfigs(configs().map(c =>
            c.id === cfgId ? { ...c, adjustments: [...c.adjustments, adj] } : c
        ));
    }

    function removeAdjustment(cfgId: string, adjId: string) {
        updateConfigs(configs().map(c =>
            c.id === cfgId ? { ...c, adjustments: c.adjustments.filter(a => a.id !== adjId) } : c
        ));
    }

    const drift = () => {
        const cfgs = configs();
        if (cfgs.length < 2) return null;
        return calcDriftSeconds(cfgs[0], cfgs[1], new Date());
    };

    const driftLabel = () => {
        const d = drift();
        if (d === null) return null;
        if (d === 0) return "in sync";
        const abs = Math.abs(d);
        const who = d > 0 ? configs()[1].title : configs()[0].title;
        return `${abs}s ahead: ${who}`;
    };

    return (
        // Full viewport, no overflow
        <div style={{
            display: "flex",
            "flex-direction": "column",
            height: "100dvh",
            overflow: "hidden",
        }}>
            {/* Header bar */}
            <div style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                padding: "6px 12px",
                background: "#16213e",
                "flex-shrink": "0",
            }}>
                <span style={{ "font-size": "13px", "font-weight": "bold", "letter-spacing": "1px", opacity: 0.7 }}>
                    SVIESAFORAS
                </span>
                <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
                    <span style={{
                        "font-size": "11px",
                        color: drift() === 0 ? "#44cc44" : "#ffaa44",
                        opacity: 0.85,
                    }}>
                        {driftLabel()}
                    </span>
                    <button
                        onClick={() => exportAsJson(configs())}
                        style={{
                            background: "transparent",
                            color: "#aaa",
                            border: "1px solid #333",
                            "border-radius": "6px",
                            padding: "3px 10px",
                            "font-size": "11px",
                            cursor: "pointer",
                        }}
                    >
                        Export
                    </button>
                </div>
            </div>

            {/* Cards — each takes equal share of remaining height */}
            <div style={{
                display: "flex",
                "flex-direction": "column",
                flex: "1",
                overflow: "hidden",
            }}>
                <For each={configs()}>
                    {(cfg, i) => (
                        <Calculator
                            model={models()[i()] ?? {} as ICalculatiorModel}
                            adjustments={cfg.adjustments}
                            onAddAdjustment={() => addAdjustment(cfg.id)}
                            onRemoveAdjustment={(id) => removeAdjustment(cfg.id, id)}
                        />
                    )}
                </For>
            </div>
        </div>
    );
};

export default App;
