import { For, Show } from 'solid-js';
import { AdjustmentEvent } from './storage';


export interface ICalculatiorModel {
    currentLight: "GREEN" | "RED",
    nextGreenIn: string,
    nextGreenAt: string,
    now: string,
    nextLight: "GREEN" | "RED",
    title: string
}

const LIGHT_COLORS: Record<string, string> = {
    RED: "#ff4444",
    GREEN: "#44cc44",
};

export const Calculator = (props: {
    model: ICalculatiorModel;
    adjustments: AdjustmentEvent[];
    onAddAdjustment: () => void;
    onRemoveAdjustment: (id: string) => void;
}) => {
    const color = () => LIGHT_COLORS[props.model.currentLight] ?? "#888";
    const nextColor = () => LIGHT_COLORS[props.model.nextLight] ?? "#888";

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
                "margin-bottom": "6px",
            }}>
                <span style={{ "font-size": "clamp(11px, 3vw, 14px)", "font-weight": "600" }}>
                    {props.model.title}
                </span>
                <span style={{ "font-size": "clamp(10px, 2.5vw, 12px)", opacity: 0.45 }}>
                    {props.model.now}
                </span>
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
            <div style={{ "font-size": "clamp(10px, 2.5vw, 13px)", opacity: 0.6, "margin-bottom": "8px" }}>
                <span style={{ color: nextColor() }}>{props.model.nextLight}</span> at {props.model.nextGreenAt}
            </div>

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
