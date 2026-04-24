import type { Accessor, Component, ComponentProps, JSX, ValidComponent } from 'solid-js';
import { createSignal, onCleanup } from 'solid-js';


export interface ICalculatiorModel {
    currentLight: "GREEN" | "RED",
    nextGreenIn: string,
    nextGreenAt: string,
    now: string,
    nextLight: "GREEN" | "RED",
    title: string
}


export const Calculator = (props: { model: ICalculatiorModel }) => {


    return (


        <div style={{
            "margin": "15px",
            "text-align": "center",
            padding: "5px",
            "padding-left": "25px",
            "padding-right": "25px",
            "border-radius": "16px",
            background: "#16213e",
            "box-shadow": "0 0 30px rgba(0,0,0,0.5)",
            "min-width": "150px",
        }}>      <div style={{
            "margin": "15px",

        }}>{props.model.title}</div>
            <div style={{
                width: "50px",
                height: "50px",
                "border-radius": "50%",
                margin: "0 auto 24px",
                background: props.model.currentLight === "RED" ? "#ff4444" : "#44cc44",
                "box-shadow": `0 0 40px ${props.model.currentLight === "RED" ? "#ff4444" : "#44cc44"}`,
                transition: "all 0.5s ease",
            }} />

            <div style={{ "font-size": "14px", opacity: 0.6, "margin-bottom": "8px" }}>
                {props.model.now}
            </div>

            <div style={{
                "font-size": "20px",
                "font-weight": "bold",
                color: props.model.currentLight === "RED" ? "#ff4444" : "#44cc44",
                "margin-bottom": "20px",
            }}>
                {props.model.currentLight}
            </div>

            <div style={{
                padding: "8px",
                background: "#0f3460",
                "border-radius": "8px",
                "margin-bottom": "5px",
            }}>
                <div style={{ "font-size": "12px", opacity: 0.6 }}>CHANGE IN</div>
                <div style={{ "font-size": "24px", "font-weight": "bold", color: "#44cc44" }}>
                    {props.model.nextGreenIn}
                </div>
            </div>

            <div style={{ "font-size": "14px", opacity: 0.7 }}>
                {props.model.nextLight} at {props.model.nextGreenAt}
            </div>
        </div>
    );
}; 
