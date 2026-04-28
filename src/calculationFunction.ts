import { ICalculatiorModel } from "./Calculator";
import { AdjustmentEvent } from "./storage";


export function trafficLightTimer(
    title: string,
    greenSeconds: number,
    redSeconds: number,
    redStartTime: Date,
    now: Date = new Date(),
    // Adjustments: list of confirmed green-start moments. Easy to remove — just delete this param and the block below.
    adjustments: AdjustmentEvent[] = []
): ICalculatiorModel {
    const cycleLength = redSeconds + greenSeconds;
    const nowMs = now.getTime();
    const cycleLengthMs = cycleLength * 1000;
    const redMs = redSeconds * 1000;

    // --- Adjustment block (remove this block to revert to base startDate only) ---
    let effectiveStartMs = new Date(redStartTime).getTime();
    if (adjustments.length > 0) {
        // Find the most recent adjustment at or before now
        const past = adjustments
            .map(a => new Date(a.timestamp).getTime())
            .filter(t => t <= nowMs)
            .sort((a, b) => b - a);
        if (past.length > 0) {
            // The adjustment marks a green-start, so effective red-start = adjustment - redSeconds (mod cycle)
            // We treat the adjustment timestamp as the start of green phase.
            // Equivalent red-start anchor = adjustmentMs - redMs (could be negative, modulo handles it)
            effectiveStartMs = past[0] - redMs;
        }
    }
    // --- End adjustment block ---

    const elapsedMs = nowMs - effectiveStartMs;
    const posMs = ((elapsedMs % cycleLengthMs) + cycleLengthMs) % cycleLengthMs;

    let currentLight: 'RED' | 'GREEN';
    let nextLight: 'RED' | 'GREEN';
    let msUntilNext: number;

    if (posMs < redMs) {
        currentLight = 'RED';
        nextLight = 'GREEN';
        msUntilNext = redMs - posMs;
    } else {
        currentLight = 'GREEN';
        nextLight = 'RED';
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
