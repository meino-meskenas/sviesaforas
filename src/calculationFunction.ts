import { ICalculatiorModel } from "./Calculator";
import { AdjustmentEvent } from "./storage";


export function trafficLightTimer(
    title: string,
    greenSeconds: number,
    redSeconds: number,
    greenStartTime: Date,
    now: Date = new Date(),
    adjustments: AdjustmentEvent[] = []
): ICalculatiorModel {
    const nowMs = now.getTime();
    const greenMs = greenSeconds * 1000;
    const redMs = redSeconds * 1000;
    const cycleLengthMs = greenMs + redMs;

    // Find the most recent green-start anchor at or before now.
    // startDate is the baseline; any adjustment supersedes it if it's more recent.
    let anchorMs = new Date(greenStartTime).getTime();
    for (const adj of adjustments) {
        const t = new Date(adj.timestamp).getTime();
        if (t <= nowMs && t > anchorMs) anchorMs = t;
    }

    // Position within the cycle from the anchor (anchor = start of green, position 0)
    const elapsed = nowMs - anchorMs;
    const posMs = ((elapsed % cycleLengthMs) + cycleLengthMs) % cycleLengthMs;

    // Cycle layout: [0, greenMs) = GREEN, [greenMs, cycleLengthMs) = RED
    let currentLight: 'RED' | 'GREEN';
    let nextLight: 'RED' | 'GREEN';
    let msUntilNext: number;

    if (posMs < greenMs) {
        currentLight = 'GREEN';
        nextLight = 'RED';
        msUntilNext = greenMs - posMs;
    } else {
        currentLight = 'RED';
        nextLight = 'GREEN';
        msUntilNext = cycleLengthMs - posMs;
    }

    const nextChangeTime = new Date(nowMs + msUntilNext);
    const secondsUntilNext = Math.floor(msUntilNext / 1000);
    const mins = Math.floor(secondsUntilNext / 60);
    const secs = secondsUntilNext % 60;

    return {
        currentLight,
        nextLight,
        nextGreenIn: `${mins} min ${secs} sec`,
        nextGreenAt: nextChangeTime.toLocaleTimeString(),
        now: now.toLocaleTimeString(),
        title,
    } as ICalculatiorModel;
}
