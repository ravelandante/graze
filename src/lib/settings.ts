type SettingMap = {
  isAutoplay: boolean;
  isAutoAdvance: boolean;
  isLooping: boolean;
  viewMode: "list" | "table";
  waveformHeight: number;
  tableColumnVisibility: Record<string, boolean>;
  playbarMode: "waveform" | "spectrogram";
};

export function loadSetting<K extends keyof SettingMap>(
  key: K,
  defaultValue: SettingMap[K],
): SettingMap[K] {
  try {
    const stored = localStorage.getItem(key);
    return stored !== null ? (JSON.parse(stored) as SettingMap[K]) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveSetting<K extends keyof SettingMap>(
  key: K,
  value: SettingMap[K],
): void {
  localStorage.setItem(key, JSON.stringify(value));
}
