import { ICalculatiorModel } from "./Calculator";

export function trafficLightTimer(
    title: string,
    greenSeconds: any,
    redSeconds: any,
    redStartTime: any
) {
    const now = new Date() as any;
    const redStart = new Date(redStartTime) as any;
    const cycleLength = greenSeconds + redSeconds;

    // How many seconds have passed since that red light started
    const elapsed = (now - redStart) / 1000;

    // Where are we in the current cycle? (red comes first in cycle)
    const positionInCycle = ((elapsed % cycleLength) + cycleLength) % cycleLength;

    let currentLight;
    let nextLight;
    let secondsUntilGreen;

    if (positionInCycle < redSeconds) {
        // We're in a red phase
        currentLight = 'RED';
        nextLight = 'GREEN';
        secondsUntilGreen = redSeconds - positionInCycle;
    } else {
        // We're in a green phase
        currentLight = 'GREEN';
        nextLight = 'RED';
        secondsUntilGreen = cycleLength - positionInCycle + redSeconds;
        // ↑ time left in green + full red phase... but if they want NEXT green:
        secondsUntilGreen = cycleLength - positionInCycle + redSeconds;
    }

    // If currently green, next green = after this green ends + one full red
    if (currentLight === 'GREEN') {
        secondsUntilGreen = redSeconds + (cycleLength - positionInCycle);
    }

    const nextGreenTime = new Date(now.getTime() + secondsUntilGreen * 1000);

    var aaa = secondsUntilGreen;
    if (currentLight == "GREEN") {
        aaa -= redSeconds;
    }

    const mins = Math.floor(aaa / 60);
    const secs = Math.floor(aaa % 60);


    return {
        currentLight,
        nextGreenIn: `${mins} min ${secs} sec`,
        nextGreenAt: nextGreenTime.toLocaleTimeString(),
        now: now.toLocaleTimeString(),
        nextLight: nextLight,
        title: title
    } as ICalculatiorModel;
}