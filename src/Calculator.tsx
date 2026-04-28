import { createSignal, For, Show } from 'solid-js';
import { Portal } from 'solid-js/web';
import { AdjustmentEvent } from './storage';


export interface DriftAnalysis {
    intervals: { cycles: number; actualGap: number; expectedGap: number; drift: number }[];
    totalCycles: number;
    avgDrift: number;
    suggestedCycle: number;
    currentCycle: number;
    cycleDelta: number;
}

export interface ICalculatiorModel {
    currentLight: "GREEN" | "RED",
    nextGreenIn: string,
    nextGreenAt: string,
    now: string,
    nextLight: "GREEN" | "RED",
    title: string,
    driftAnalysis: DriftAnalysis | null,
}

const LIGHT_COLORS: Record<string, string> = {
    RED: "#ff4444",
    GREEN: "#44cc44",
};

const BTN_BASE = {
    background: "transparent",
    border: "1px solid #ffffff22",
    "border-radius": "6px",
    padding: "3px 10px",
    "font-size": "clamp(10px, 2.5vw, 12px)",
    cursor: "pointer",
    "font-family": "inherit",
} as const;

export const Calculator = (props: {
    model: ICalculatiorModel;
    adjustments: AdjustmentEvent[];
    startDate: string;
    greenSeconds: number;
    redSeconds: number;
    modalOpen: boolean;
    onModalOpen: () => void;
    onModalClose: () => void;
    onAddAdjustment: () => void;
    onRemoveAdjustment: (id: string) => void;
    onStartDateChange: (isoString: string) => void;
    onGreenSecondsChange: (v: number) => void;
    onRedSecondsChange: (v: number) => void;
}) => {
    const color = () => LIGHT_COLORS[props.model.currentLight] ?? "#888";
    const nextColor = () => LIGHT_COLORS[props.model.nextLight] ?? "#888";

    const [editing, setEditing] = createSignal(false);

    const startTimeValue = () => {
        const d = new Date(props.startDate);
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    };

    function commitTime(val: string) {
        if (!val) return;
        const base = new Date(props.startDate);
        const datePart = base.toISOString().slice(0, 10);
        props.onStartDateChange(new Date(`${datePart}T${val}`).toISOString());
        setEditing(false);
    }

    return (
        <div style={{
            flex: "1",
            display: "flex",
            "flex-direction": "column",
            "justify-content": "center",
            "align-items": "center",
            padding: "8px 12px",
            "border-top": "1px solid #ffffff0f",
            overflow: "hidden",
            "text-align": "center",
            position: "relative",
        }}>
            {/* Title + now */}
            <div style={{ display: "flex", "align-items": "baseline", gap: "8px", "margin-bottom": "4px" }}>
                <span style={{ "font-size": "clamp(11px, 3vw, 14px)", "font-weight": "600" }}>
                    {props.model.title}
                </span>
                <span style={{ "font-size": "clamp(10px, 2.5vw, 12px)", opacity: 0.4 }}>
                    {props.model.now}
                </span>
            </div>

            {/* Start time */}
            <div style={{ "margin-bottom": "6px", "font-size": "clamp(9px, 2vw, 11px)", opacity: 0.55 }}>
                <Show when={!editing()} fallback={
                    <input
                        type="time"
                        step="1"
                        value={startTimeValue()}
                        onBlur={(e) => commitTime(e.currentTarget.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitTime(e.currentTarget.value); if (e.key === "Escape") setEditing(false); }}
                        ref={(el) => setTimeout(() => el?.focus(), 0)}
                        style={{
                            background: "#0f3460", color: "#eee",
                            border: "1px solid #44cc4488", "border-radius": "4px",
                            padding: "2px 6px", "font-size": "clamp(9px, 2vw, 11px)", "font-family": "inherit",
                        }}
                    />
                }>
                    <span
                        onClick={() => setEditing(true)}
                        style={{ cursor: "pointer", "border-bottom": "1px dashed #ffffff33" }}
                    >
                        start {startTimeValue()}
                    </span>
                </Show>
            </div>

            {/* Light dot */}
            <div style={{
                width: "clamp(32px, 9vw, 50px)",
                height: "clamp(32px, 9vw, 50px)",
                "border-radius": "50%",
                background: color(),
                "box-shadow": `0 0 clamp(16px, 5vw, 32px) ${color()}`,
                transition: "background 0.4s ease, box-shadow 0.4s ease",
                "margin-bottom": "6px",
            }} />

            {/* Current state */}
            <div style={{
                "font-size": "clamp(14px, 4vw, 20px)",
                "font-weight": "bold",
                color: color(),
                "margin-bottom": "6px",
                "letter-spacing": "1px",
            }}>
                {props.model.currentLight}
            </div>

            {/* Countdown */}
            <div style={{
                background: "#0f3460",
                "border-radius": "8px",
                padding: "4px 14px",
                "margin-bottom": "4px",
            }}>
                <div style={{ "font-size": "clamp(9px, 2vw, 11px)", opacity: 0.5, "margin-bottom": "1px" }}>
                    CHANGE IN
                </div>
                <div style={{ "font-size": "clamp(18px, 5vw, 26px)", "font-weight": "bold", color: nextColor() }}>
                    {props.model.nextGreenIn}
                </div>
            </div>

            {/* Next state */}
            <div style={{ "font-size": "clamp(10px, 2.5vw, 13px)", opacity: 0.6, "margin-bottom": "8px" }}>
                <span style={{ color: nextColor() }}>{props.model.nextLight}</span> at {props.model.nextGreenAt}
            </div>

            {/* Action row */}
            <div style={{ display: "flex", gap: "6px", "align-items": "center", "flex-wrap": "wrap", "justify-content": "center" }}>
                <button
                    onClick={props.onAddAdjustment}
                    style={{
                        ...BTN_BASE,
                        background: "#44cc4422",
                        color: "#44cc44",
                        border: "1px solid #44cc4466",
                        "font-weight": "600",
                    }}
                >
                    Mark Green
                </button>

                {/* Adjust cycle button — only when drift data available */}
                <Show when={props.model.driftAnalysis !== null && props.model.driftAnalysis!.cycleDelta !== 0}>
                    {() => {
                        const d = props.model.driftAnalysis!.cycleDelta;
                        return (
                            <button
                                onClick={() => props.onModalOpen()}
                                style={{
                                    ...BTN_BASE,
                                    color: "#ffaa44",
                                    border: "1px solid #ffaa4466",
                                }}
                            >
                                adjust {d > 0 ? "+" : ""}{d}s
                            </button>
                        );
                    }}
                </Show>

                {/* Settings button */}
                <button
                    onClick={() => props.onModalOpen()}
                    style={{ ...BTN_BASE, color: "#aaa", "font-size": "14px", padding: "2px 8px" }}
                >
                    ⚙
                </button>
            </div>

            {/* Modal overlay */}
            <Show when={props.modalOpen}>
                <Portal>
                <div
                    onClick={() => props.onModalClose()}
                    style={{
                        position: "fixed",
                        inset: "0",
                        background: "#000000bb",
                        "z-index": "100",
                        display: "flex",
                        "align-items": "center",
                        "justify-content": "center",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "#16213e",
                            "border-radius": "12px",
                            padding: "16px",
                            width: "min(340px, 92vw)",
                            "max-height": "80vh",
                            "overflow-y": "auto",
                            "font-size": "clamp(10px, 2.5vw, 13px)",
                        }}
                    >
                        {/* Modal header */}
                        <div style={{ display: "flex", "justify-content": "space-between", "align-items": "center", "margin-bottom": "12px" }}>
                            <span style={{ "font-weight": "600", "font-size": "14px" }}>{props.model.title}</span>
                            <button
                                onClick={() => props.onModalClose()}
                                style={{ background: "transparent", border: "none", color: "#aaa", "font-size": "18px", cursor: "pointer", "line-height": "1" }}
                            >×</button>
                        </div>

                        {/* Cycle durations */}
                        <div style={{ "margin-bottom": "10px" }}>
                            <div style={{ opacity: 0.5, "font-size": "10px", "letter-spacing": "0.5px", "margin-bottom": "4px" }}>CYCLE DURATION</div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                <label style={{ display: "flex", "align-items": "center", gap: "4px" }}>
                                    <span style={{ color: "#44cc44" }}>green</span>
                                    <input
                                        type="number" min="1" value={props.greenSeconds}
                                        onBlur={(e) => props.onGreenSecondsChange(Math.max(1, parseInt(e.currentTarget.value) || props.greenSeconds))}
                                        onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
                                        style={{
                                            width: "56px", background: "#0f3460", color: "#eee",
                                            border: "1px solid #44cc4488", "border-radius": "4px",
                                            padding: "3px 4px", "font-size": "13px", "font-family": "inherit", "text-align": "right",
                                        }}
                                    />s
                                </label>
                                <label style={{ display: "flex", "align-items": "center", gap: "4px" }}>
                                    <span style={{ color: "#ff4444" }}>red</span>
                                    <input
                                        type="number" min="1" value={props.redSeconds}
                                        onBlur={(e) => props.onRedSecondsChange(Math.max(1, parseInt(e.currentTarget.value) || props.redSeconds))}
                                        onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
                                        style={{
                                            width: "56px", background: "#0f3460", color: "#eee",
                                            border: "1px solid #ff444488", "border-radius": "4px",
                                            padding: "3px 4px", "font-size": "13px", "font-family": "inherit", "text-align": "right",
                                        }}
                                    />s
                                </label>
                            </div>
                        </div>

                        {/* Drift analysis */}
                        <Show when={props.model.driftAnalysis !== null}>
                            {() => {
                                const da = props.model.driftAnalysis!;
                                return (
                                    <div style={{ "margin-bottom": "10px" }}>
                                        <div style={{ opacity: 0.5, "font-size": "10px", "letter-spacing": "0.5px", "margin-bottom": "4px" }}>DRIFT ANALYSIS</div>
                                        <div style={{ background: "#0a1a3a", "border-radius": "6px", padding: "8px" }}>
                                            <For each={da.intervals}>
                                                {(row, i) => (
                                                    <div style={{
                                                        display: "grid",
                                                        "grid-template-columns": "1.4em 1fr 1fr 1fr",
                                                        gap: "2px 8px",
                                                        "margin-bottom": "3px",
                                                        opacity: 0.8,
                                                    }}>
                                                        <span style={{ opacity: 0.4 }}>#{i() + 1}</span>
                                                        <span>{row.cycles} cyc</span>
                                                        <span style={{ opacity: 0.6 }}>{row.actualGap}s</span>
                                                        <span style={{ color: row.drift === 0 ? "#44cc44" : "#ffaa44" }}>
                                                            {row.drift === 0 ? "±0" : `${row.drift > 0 ? "+" : ""}${row.drift}s`}
                                                        </span>
                                                    </div>
                                                )}
                                            </For>
                                            <div style={{ "border-top": "1px solid #ffffff11", "margin-top": "6px", "padding-top": "6px", display: "flex", "flex-direction": "column", gap: "3px" }}>
                                                <div style={{ display: "flex", "justify-content": "space-between", opacity: 0.7 }}>
                                                    <span>avg drift</span>
                                                    <span style={{ color: da.avgDrift === 0 ? "#44cc44" : "#ffaa44" }}>
                                                        {da.avgDrift === 0 ? "±0s" : `${da.avgDrift > 0 ? "+" : ""}${da.avgDrift}s`}
                                                    </span>
                                                </div>
                                                <div style={{ display: "flex", "justify-content": "space-between", opacity: 0.7 }}>
                                                    <span>current cycle</span>
                                                    <span>{da.currentCycle}s</span>
                                                </div>
                                                <div style={{ display: "flex", "justify-content": "space-between" }}>
                                                    <span style={{ "font-weight": "600" }}>suggested cycle</span>
                                                    <span style={{ color: da.cycleDelta === 0 ? "#44cc44" : "#ffaa44", "font-weight": "600" }}>
                                                        {da.suggestedCycle}s
                                                        <Show when={da.cycleDelta !== 0}>
                                                            <span style={{ opacity: 0.6, "font-weight": "400" }}>
                                                                {" "}({da.cycleDelta > 0 ? "+" : ""}{da.cycleDelta}s)
                                                            </span>
                                                        </Show>
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                        </Show>

                        {/* Adjustments list */}
                        <Show when={props.adjustments.length > 0}>
                            <div>
                                <div style={{ opacity: 0.5, "font-size": "10px", "letter-spacing": "0.5px", "margin-bottom": "4px" }}>GREEN START EVENTS</div>
                                <div style={{ display: "flex", "flex-direction": "column", gap: "3px" }}>
                                    <For each={props.adjustments}>
                                        {(adj) => (
                                            <div style={{
                                                display: "flex", "align-items": "center", "justify-content": "space-between",
                                                background: "#0f346088", "border-radius": "4px", padding: "3px 8px",
                                            }}>
                                                <span style={{ opacity: 0.7 }}>{new Date(adj.timestamp).toLocaleTimeString()}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); props.onRemoveAdjustment(adj.id); }}
                                                    style={{ background: "transparent", border: "none", color: "#ff4444", cursor: "pointer", "font-size": "14px", "line-height": "1", padding: "0 2px" }}
                                                >×</button>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </Show>
                    </div>
                </div>
                </Portal>
            </Show>
        </div>
    );
};
