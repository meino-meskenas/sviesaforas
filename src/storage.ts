export interface AdjustmentEvent {
    id: string;
    timestamp: string; // ISO string — green started at this moment
    label: string;
}

export interface CalculatorConfig {
    id: string;
    title: string;
    greenSeconds: number;
    redSeconds: number;
    startDate: string; // ISO string
    adjustments: AdjustmentEvent[];
}

const STORAGE_KEY = "trafficlight_configs";

export function loadConfigs(): CalculatorConfig[] | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function saveConfigs(configs: CalculatorConfig[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configs));
}

export function exportAsJson(configs: CalculatorConfig[]): void {
    const blob = new Blob([JSON.stringify(configs, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trafficlight_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
}
