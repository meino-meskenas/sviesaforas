import { ICalculatiorModel } from "./Calculator";


export function trafficLightTimer(
    title: string,
    greenSeconds: number,
    redSeconds: number,
    redStartTime: Date,
    now: Date = new Date()
): ICalculatiorModel {
    const cycleLength = redSeconds + greenSeconds;


    const nowMs = now.getTime();
    const startMs = new Date(redStartTime).getTime();
    const cycleLengthMs = cycleLength * 1000;
    const redMs = redSeconds * 1000;

    const elapsedMs = nowMs - startMs;
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