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

    // All green-start events sorted chronologically
    const allAnchors = [
        new Date(greenStartTime).getTime(),
        ...adjustments.map(a => new Date(a.timestamp).getTime()),
    ].sort((a, b) => a - b);

    // Most recent anchor at or before now
    let anchorMs = allAnchors[0];
    for (const t of allAnchors) {
        if (t <= nowMs) anchorMs = t;
    }

    // Drift: average offset between actual green-start events and the predicted cycle.
    // For each consecutive pair, the expected gap is N full cycles; remainder is drift.
    let drift: number | null = null;
    if (allAnchors.length >= 2) {
        let totalDriftMs = 0;
        for (let i = 1; i < allAnchors.length; i++) {
            const gap = allAnchors[i] - allAnchors[i - 1];
            const cycles = Math.round(gap / cycleLengthMs);
            const expected = cycles * cycleLengthMs;
            totalDriftMs += allAnchors[i] - (allAnchors[i - 1] + expected);
        }
        drift = Math.round(totalDriftMs / (allAnchors.length - 1) / 1000);
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
        drift,
    };
}
