import type { Component } from 'solid-js';
import { createSignal, For, onCleanup, onMount } from 'solid-js';
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


const BEST_CONFIGS: CalculatorConfig[] = [
    {
        id: "karveliskes",
        title: "Karveliskes → Vilnius",
        greenSeconds: 129.992,
        redSeconds: 900.919,
        startDate: "2026-05-06T14:25:44.920Z",
        adjustments: [],
    },
    {
        id: "vilnius",
        title: "Vilnius → Karveliskes",
        greenSeconds: 130,
        redSeconds: 900.919,
        startDate: "2026-05-06T16:34:14.457Z",
        adjustments: [],
    },
];

function initConfigs(): CalculatorConfig[] {
    const now = new Date().toISOString();
    const stored = loadConfigs();
    const configs = (stored ?? BEST_CONFIGS).map(c =>
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
    const [openModalId, setOpenModalId] = createSignal<string | null>(null);

    let audioCtx: AudioContext | null = null;
    // Track which beep has fired per config: key = `${cfgId}-${threshold}`
    const firedBeeps = new Set<string>();

    onMount(() => {
        // Create AudioContext on first user interaction to satisfy browser autoplay policy
        const unlock = () => {
            if (!audioCtx) audioCtx = new AudioContext();
            window.removeEventListener("pointerdown", unlock);
        };
        window.addEventListener("pointerdown", unlock);
    });

    function beep(count: number) {
        if (!audioCtx) return;
        const gap = 0.18;
        for (let i = 0; i < count; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = 880;
            osc.type = "sine";
            const start = audioCtx.currentTime + i * gap;
            gain.gain.setValueAtTime(0.4, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
            osc.start(start);
            osc.stop(start + 0.13);
        }
    }

    const tick = () => {
        const now = new Date();
        const next = configs().map(cfg =>
            trafficLightTimer(cfg.title, cfg.greenSeconds, cfg.redSeconds, new Date(cfg.startDate), now, cfg.adjustments)
        );

        // Beep alerts when RED → GREEN approaching
        next.forEach((m, i) => {
            const cfgId = configs()[i].id;
            const secsLeft = Math.ceil(m.msUntilNext / 1000);
            if (m.nextLight === "GREEN") {
                for (const { secs, count } of [{ secs: 60, count: 3 }, { secs: 30, count: 2 }, { secs: 1, count: 1 }]) {
                    const key = `${cfgId}-${secs}`;
                    if (secsLeft <= secs && secsLeft > secs - 2) {
                        if (!firedBeeps.has(key)) { firedBeeps.add(key); beep(count); }
                    } else {
                        firedBeeps.delete(key);
                    }
                }
            } else {
                // Light is GREEN, clear beep state so they fire again next red phase
                firedBeeps.delete(`${cfgId}-60`);
                firedBeeps.delete(`${cfgId}-30`);
            }
        });

        setModels(next);
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
                <span style={{ "font-size": "13px", "font-weight": "bold", "font-variant-numeric": "tabular-nums", opacity: 0.7 }}>
                    {models()[0]?.now ?? ""}
                </span>
                <div style={{ display: "flex", gap: "6px" }}>
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
                    <button
                        onClick={() => {
                            if (confirm("Reset to best known configuration? This will clear all current data.")) {
                                updateConfigs(BEST_CONFIGS);
                            }
                        }}
                        style={{
                            background: "transparent",
                            color: "#ff6644",
                            border: "1px solid #ff664444",
                            "border-radius": "6px",
                            padding: "3px 10px",
                            "font-size": "11px",
                            cursor: "pointer",
                        }}
                    >
                        Reset
                    </button>
                </div>
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
                            modalOpen={openModalId() === cfg.id}
                            onModalOpen={() => setOpenModalId(cfg.id)}
                            onModalClose={() => setOpenModalId(null)}
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
