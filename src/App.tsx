import type { Component } from 'solid-js';
import { createSignal, For, onCleanup } from 'solid-js';
import { trafficLightTimer } from './calculationFunction';
import { Calculator, ICalculatiorModel } from './Calculator';
import {
    AdjustmentEvent,
    CalculatorConfig,
    exportAsJson,
    importFromJson,
    loadConfigs,
    saveConfigs,
} from './storage';


const DEFAULT_CONFIGS: CalculatorConfig[] = [
    {
        id: "karveliskes",
        title: "Karveliskes → Vilnius",
        greenSeconds: 130,
        redSeconds: 900,
        startDate: "",
        adjustments: [],
    },
    {
        id: "vilnius",
        title: "Vilnius → Karveliskes",
        greenSeconds: 130,
        redSeconds: 900,
        startDate: "",
        adjustments: [],
    },
];

function initConfigs(): CalculatorConfig[] {
    const now = new Date().toISOString();
    const stored = loadConfigs();
    // Fill any missing startDates with now, then persist
    const configs = (stored ?? DEFAULT_CONFIGS).map(c =>
        c.startDate ? c : { ...c, startDate: now }
    );
    if (!stored || configs.some((c, i) => !stored[i]?.startDate)) {
        saveConfigs(configs);
    }
    return configs;
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
    const timer = setInterval(tick, 250);
    onCleanup(() => clearInterval(timer));

    function updateConfigs(updated: CalculatorConfig[]) {
        setConfigs(updated);
        saveConfigs(updated);
        const now = new Date();
        setModels(updated.map(cfg =>
            trafficLightTimer(cfg.title, cfg.greenSeconds, cfg.redSeconds, new Date(cfg.startDate), now, cfg.adjustments)
        ));
    }

    function addAdjustment(cfgId: string) {
        const now = new Date();
        const cfg = configs().find(c => c.id === cfgId);
        if (!cfg) return;
        const adj: AdjustmentEvent = {
            id: crypto.randomUUID(),
            timestamp: now.toISOString(),
            label: `adj ${now.toLocaleTimeString()}`,
        };
        updateConfigs(configs().map(c => {
            if (c.id !== cfgId) return c;
            const updatedAdjs = [...c.adjustments, adj];
            // Only update startDate when this is the first adjustment
            if (c.adjustments.length === 0) {
                return { ...c, startDate: now.toISOString(), adjustments: updatedAdjs };
            }
            return { ...c, adjustments: updatedAdjs };
        }));
    }

    function removeAdjustment(cfgId: string, adjId: string) {
        updateConfigs(configs().map(c =>
            c.id === cfgId ? { ...c, adjustments: c.adjustments.filter(a => a.id !== adjId) } : c
        ));
    }

    function setStartDate(cfgId: string, isoString: string) {
        updateConfigs(configs().map(c =>
            c.id === cfgId ? { ...c, startDate: isoString } : c
        ));
    }

    function setGreenSeconds(cfgId: string, v: number) {
        updateConfigs(configs().map(c =>
            c.id === cfgId ? { ...c, greenSeconds: v } : c
        ));
    }

    function setRedSeconds(cfgId: string, v: number) {
        updateConfigs(configs().map(c =>
            c.id === cfgId ? { ...c, redSeconds: v } : c
        ));
    }

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
                <button
                    onClick={() => location.reload()}
                    style={{
                        background: "transparent",
                        color: "#aaa",
                        border: "1px solid #333",
                        "border-radius": "6px",
                        padding: "3px 10px",
                        "font-size": "13px",
                        cursor: "pointer",
                        "line-height": "1",
                    }}
                >
                    ↺
                </button>
                <div style={{ display: "flex", "align-items": "center", gap: "10px" }}>
                    <button
                        onClick={() => importFromJson(updateConfigs)}
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
                        Import
                    </button>
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
                            startDate={cfg.startDate}
                            greenSeconds={cfg.greenSeconds}
                            redSeconds={cfg.redSeconds}
                            onAddAdjustment={() => addAdjustment(cfg.id)}
                            onRemoveAdjustment={(id) => removeAdjustment(cfg.id, id)}
                            onStartDateChange={(iso) => setStartDate(cfg.id, iso)}
                            onGreenSecondsChange={(v) => setGreenSeconds(cfg.id, v)}
                            onRedSecondsChange={(v) => setRedSeconds(cfg.id, v)}
                        />
                    )}
                </For>
            </div>
        </div>
    );
};

export default App;
