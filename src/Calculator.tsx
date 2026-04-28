import { createSignal, For, Show } from 'solid-js';
import { AdjustmentEvent } from './storage';


export interface ICalculatiorModel {
    currentLight: "GREEN" | "RED",
    nextGreenIn: string,
    nextGreenAt: string,
    now: string,
    nextLight: "GREEN" | "RED",
    title: string,
    drift: number | null, // seconds; null if fewer than 2 green-start events
}

const LIGHT_COLORS: Record<string, string> = {
    RED: "#ff4444",
    GREEN: "#44cc44",
};

export const Calculator = (props: {
    model: ICalculatiorModel;
    adjustments: AdjustmentEvent[];
    startDate: string;
    greenSeconds: number;
    redSeconds: number;
    onAddAdjustment: () => void;
    onRemoveAdjustment: (id: string) => void;
    onStartDateChange: (isoString: string) => void;
    onGreenSecondsChange: (v: number) => void;
    onRedSecondsChange: (v: number) => void;
}) => {
    const color = () => LIGHT_COLORS[props.model.currentLight] ?? "#888";
    const nextColor = () => LIGHT_COLORS[props.model.nextLight] ?? "#888";

    const startTimeValue = () => {
        const d = new Date(props.startDate);
        return d.toTimeString().slice(0, 8);
    };

    const [editing, setEditing] = createSignal(false);

    function commitTime(val: string) {
        const base = new Date(props.startDate);
        const datePart = base.toISOString().slice(0, 10);
        const seconds = val.length === 5 ? val + ":00" : val;
        props.onStartDateChange(`${datePart}T${seconds}`);
        setEditing(false);
    }

    return (
        // Each card fills its flex share — no fixed heights, no overflow
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
        }}>
            {/* Title + time on one line */}
            <div style={{
                display: "flex",
                "align-items": "baseline",
                gap: "8px",
                "margin-bottom": "4px",
            }}>
                <span style={{ "font-size": "clamp(11px, 3vw, 14px)", "font-weight": "600" }}>
                    {props.model.title}
                </span>
                <span style={{ "font-size": "clamp(10px, 2.5vw, 12px)", opacity: 0.45 }}>
                    {props.model.now}
                </span>
            </div>

            {/* Initial green start time — tap to edit */}
            <div style={{ "margin-bottom": "4px", "font-size": "clamp(9px, 2vw, 11px)", opacity: 0.55 }}>
                <Show when={!editing()} fallback={
                    <input
                        type="time"
                        step="1"
                        value={startTimeValue()}
                        onBlur={(e) => commitTime(e.currentTarget.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") commitTime(e.currentTarget.value); if (e.key === "Escape") setEditing(false); }}
                        ref={(el) => setTimeout(() => el?.focus(), 0)}
                        style={{
                            background: "#0f3460",
                            color: "#eee",
                            border: "1px solid #44cc4488",
                            "border-radius": "4px",
                            padding: "2px 6px",
                            "font-size": "clamp(9px, 2vw, 11px)",
                            "font-family": "inherit",
                        }}
                    />
                }>
                    <span
                        onClick={() => setEditing(true)}
                        style={{ cursor: "pointer", "border-bottom": "1px dashed #ffffff33" }}
                        title="Tap to set initial green start time"
                    >
                        start {startTimeValue()}
                    </span>
                </Show>
            </div>

            {/* Cycle duration inputs */}
            <div style={{
                display: "flex",
                gap: "8px",
                "margin-bottom": "6px",
                "font-size": "clamp(9px, 2vw, 11px)",
                opacity: 0.55,
                "align-items": "center",
            }}>
                <label style={{ display: "flex", "align-items": "center", gap: "3px" }}>
                    green
                    <input
                        type="number"
                        min="1"
                        value={props.greenSeconds}
                        onBlur={(e) => props.onGreenSecondsChange(Math.max(1, parseInt(e.currentTarget.value) || props.greenSeconds))}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
                        style={{
                            width: "52px",
                            background: "#0f3460",
                            color: "#eee",
                            border: "1px solid #44cc4488",
                            "border-radius": "4px",
                            padding: "2px 4px",
                            "font-size": "clamp(9px, 2vw, 11px)",
                            "font-family": "inherit",
                            "text-align": "right",
                        }}
                    />s
                </label>
                <label style={{ display: "flex", "align-items": "center", gap: "3px" }}>
                    red
                    <input
                        type="number"
                        min="1"
                        value={props.redSeconds}
                        onBlur={(e) => props.onRedSecondsChange(Math.max(1, parseInt(e.currentTarget.value) || props.redSeconds))}
                        onKeyDown={(e) => { if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur(); }}
                        style={{
                            width: "52px",
                            background: "#0f3460",
                            color: "#eee",
                            border: "1px solid #ff444488",
                            "border-radius": "4px",
                            padding: "2px 4px",
                            "font-size": "clamp(9px, 2vw, 11px)",
                            "font-family": "inherit",
                            "text-align": "right",
                        }}
                    />s
                </label>
            </div>

            {/* Light dot */}
            <div style={{
                width: "clamp(28px, 8vw, 44px)",
                height: "clamp(28px, 8vw, 44px)",
                "border-radius": "50%",
                background: color(),
                "box-shadow": `0 0 clamp(14px, 4vw, 28px) ${color()}`,
                transition: "background 0.4s ease, box-shadow 0.4s ease",
                "margin-bottom": "6px",
            }} />

            {/* Current state label */}
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
                <div style={{
                    "font-size": "clamp(18px, 5vw, 26px)",
                    "font-weight": "bold",
                    color: nextColor(),
                }}>
                    {props.model.nextGreenIn}
                </div>
            </div>

            {/* Next state */}
            <div style={{ "font-size": "clamp(10px, 2.5vw, 13px)", opacity: 0.6, "margin-bottom": "4px" }}>
                <span style={{ color: nextColor() }}>{props.model.nextLight}</span> at {props.model.nextGreenAt}
            </div>

            {/* Drift */}
            <Show when={props.model.drift !== null}>
                <div style={{
                    "font-size": "clamp(9px, 2vw, 11px)",
                    "margin-bottom": "8px",
                    color: props.model.drift === 0 ? "#44cc44" : "#ffaa44",
                    opacity: 0.8,
                }}>
                    {props.model.drift === 0
                        ? "on time"
                        : `${props.model.drift! > 0 ? "+" : ""}${props.model.drift}s drift`
                    }
                </div>
            </Show>

            {/* Mark adjustment button */}
            <button
                onClick={props.onAddAdjustment}
                style={{
                    background: "#44cc4422",
                    color: "#44cc44",
                    border: "1px solid #44cc4466",
                    "border-radius": "6px",
                    padding: "4px 14px",
                    "font-size": "clamp(10px, 2.5vw, 12px)",
                    "font-weight": "600",
                    cursor: "pointer",
                    "margin-bottom": "4px",
                }}
            >
                Mark Now as Green Start
            </button>

            {/* Adjustments list — only shown if any exist */}
            <Show when={props.adjustments.length > 0}>
                <div style={{
                    display: "flex",
                    "flex-direction": "column",
                    gap: "2px",
                    width: "100%",
                    "max-width": "280px",
                }}>
                    <For each={props.adjustments}>
                        {(adj) => (
                            <div style={{
                                display: "flex",
                                "align-items": "center",
                                "justify-content": "space-between",
                                background: "#0f346088",
                                "border-radius": "4px",
                                padding: "2px 6px",
                                "font-size": "clamp(9px, 2vw, 11px)",
                            }}>
                                <span style={{ opacity: 0.7 }}>
                                    {new Date(adj.timestamp).toLocaleTimeString()}
                                </span>
                                <button
                                    onClick={() => props.onRemoveAdjustment(adj.id)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#ff4444",
                                        cursor: "pointer",
                                        "font-size": "13px",
                                        "line-height": "1",
                                        padding: "0 2px",
                                    }}
                                >
                                    ×
                                </button>
                            </div>
                        )}
                    </For>
                </div>
            </Show>
        </div>
    );
};
