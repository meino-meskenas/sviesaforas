import { DriftAnalysis, ICalculatiorModel } from "./Calculator";
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
    const currentCycle = greenSeconds + redSeconds;

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

    // Drift analysis across all consecutive green-start pairs
    let driftAnalysis: DriftAnalysis | null = null;
    if (allAnchors.length >= 2) {
        const intervals: DriftAnalysis["intervals"] = [];
        let totalCycles = 0;

        for (let i = 1; i < allAnchors.length; i++) {
            const actualGapMs = allAnchors[i] - allAnchors[i - 1];
            const cycles = Math.round(actualGapMs / cycleLengthMs);
            const expectedGapMs = cycles * cycleLengthMs;
            const driftMs = actualGapMs - expectedGapMs;
            totalCycles += cycles;
            intervals.push({
                cycles,
                actualGap: Math.round(actualGapMs / 1000),
                expectedGap: Math.round(expectedGapMs / 1000),
                drift: Math.round(driftMs / 1000),
            });
        }

        // Best-fit cycle: total time span divided by total cycle count
        const totalSpanMs = allAnchors[allAnchors.length - 1] - allAnchors[0];
        const suggestedCycle = totalCycles > 0
            ? Math.round(totalSpanMs / totalCycles / 1000)
            : currentCycle;

        const avgDrift = Math.round(
            intervals.reduce((s, r) => s + r.drift, 0) / intervals.length
        );

        driftAnalysis = {
            intervals,
            totalCycles,
            avgDrift,
            suggestedCycle,
            currentCycle,
            cycleDelta: suggestedCycle - currentCycle,
        };
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
        driftAnalysis,
    };
}
