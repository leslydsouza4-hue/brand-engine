import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, RotateCcw, Check, X, Palette, Image as ImageIcon, Globe, Monitor } from "lucide-react";
import {
  loadSettings,
  saveSettings,
  resetSettings,
  BrandSettings,
  CANVAS_SIZE_OPTIONS,
  LANGUAGE_OPTIONS,
  DEFAULT_SETTINGS,
} from "./settingsStore";

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-[8px]">
      <div
        className="w-[32px] h-[32px] rounded-[8px] cursor-pointer border border-[rgba(255,255,255,0.1)] shrink-0 shadow-inner"
        style={{ backgroundColor: value }}
        onClick={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-0 h-0 opacity-0 absolute"
      />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-[90px] py-[6px] px-[10px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[8px] text-[12px] text-white font-mono outline-none focus:border-[rgba(0,178,169,0.3)] transition-all"
      />
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="py-[8px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-white outline-none focus:border-[rgba(0,178,169,0.3)] transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[center_right_10px] pr-[32px] min-w-[180px]"
    >
      {options.map(o => (
        <option key={o.value} value={o.value} className="bg-[#0A1628] text-white">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Slider({
  value,
  min,
  max,
  onChange,
  suffix,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-[12px]">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 h-[4px] appearance-none rounded-full bg-[rgba(255,255,255,0.08)] outline-none cursor-pointer accent-[#00B2A9] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-[16px] [&::-webkit-slider-thumb]:h-[16px] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-[#00B2A9] [&::-webkit-slider-thumb]:to-[#2896FB] [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,178,169,0.4)] [&::-webkit-slider-thumb]:cursor-pointer"
      />
      <span className="text-[12px] text-[#94A3B8] font-mono min-w-[40px] text-right">
        {value}{suffix}
      </span>
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-[14px] gap-[24px]">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-white">{label}</div>
        {description && <div className="text-[11px] text-[#64748B] mt-[2px]">{description}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingSection({
  icon,
  title,
  color,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[rgba(255,255,255,0.015)] border border-[rgba(255,255,255,0.05)] rounded-[16px] overflow-hidden mb-[12px]"
    >
      <div className="flex items-center gap-[10px] px-[20px] py-[14px] border-b border-[rgba(255,255,255,0.04)]">
        <div
          className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center"
          style={{ backgroundColor: `${color}15`, boxShadow: `0 0 12px ${color}20` }}
        >
          <div style={{ color }}>{icon}</div>
        </div>
        <span className="text-[13px] font-semibold text-white">{title}</span>
      </div>
      <div className="px-[20px] divide-y divide-[rgba(255,255,255,0.04)]">{children}</div>
    </motion.div>
  );
}

export function SettingsWorkspace() {
  const [settings, setSettings] = useState<BrandSettings>(loadSettings);
  const [saved, setSaved] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const update = <K extends keyof BrandSettings>(key: K, value: BrandSettings[K]) => {
    const next = { ...settings, [key]: value };
    setSettings(next);
    saveSettings(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      update("customLogoUrl", reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleReset = () => {
    const defaults = resetSettings();
    setSettings(defaults);
    setShowReset(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(DEFAULT_SETTINGS);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-[16px] md:px-[40px] py-[24px]">
        <div className="max-w-[680px] mx-auto">
          <div className="flex items-center justify-between mb-[28px]">
            <div>
              <h1 className="text-[22px] font-bold text-white mb-[4px]">Settings</h1>
              <p className="text-[13px] text-[#64748B]">
                Customize your Brand Engine experience
              </p>
            </div>
            <div className="flex items-center gap-[8px]">
              {saved && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-[5px] text-[12px] text-[#00B2A9] font-medium"
                >
                  <Check className="w-[14px] h-[14px]" />
                  Saved
                </motion.div>
              )}
            </div>
          </div>

          <SettingSection icon={<Palette className="w-[14px] h-[14px]" />} title="Brand Customization" color="#00B2A9">
            <SettingRow label="Brand Name" description="Displayed on exports and templates">
              <input
                type="text"
                value={settings.brandName}
                onChange={e => update("brandName", e.target.value)}
                placeholder="Your Brand"
                className="w-[200px] py-[8px] px-[12px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[13px] text-white outline-none focus:border-[rgba(0,178,169,0.3)] placeholder:text-[#475569] transition-all"
              />
            </SettingRow>
            <SettingRow label="Primary Color" description="Main brand accent color">
              <ColorInput value={settings.primaryColor} onChange={v => update("primaryColor", v)} />
            </SettingRow>
            <SettingRow label="Accent Color" description="Secondary highlight color">
              <ColorInput value={settings.accentColor} onChange={v => update("accentColor", v)} />
            </SettingRow>
            <SettingRow label="Custom Logo" description="Upload your own logo (PNG, SVG)">
              <div className="flex items-center gap-[10px]">
                {settings.customLogoUrl ? (
                  <div className="flex items-center gap-[8px]">
                    <div className="w-[36px] h-[36px] rounded-[8px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden">
                      <img src={settings.customLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                    <button
                      onClick={() => update("customLogoUrl", null)}
                      className="p-[6px] bg-[rgba(255,77,77,0.1)] border border-[rgba(255,77,77,0.2)] rounded-[8px] text-[#FF4D4D] cursor-pointer hover:bg-[rgba(255,77,77,0.15)] transition-all"
                    >
                      <X className="w-[12px] h-[12px]" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center gap-[7px] py-[8px] px-[14px] bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] rounded-[10px] text-[12px] text-[#94A3B8] cursor-pointer hover:border-[rgba(0,178,169,0.3)] hover:text-white transition-all">
                    <Upload className="w-[14px] h-[14px]" />
                    Upload
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                )}
              </div>
            </SettingRow>
          </SettingSection>

          <SettingSection icon={<ImageIcon className="w-[14px] h-[14px]" />} title="Export Defaults" color="#2896FB">
            <SettingRow label="Default Format" description="File format for image exports">
              <Select
                value={settings.defaultExportFormat}
                options={[
                  { value: "png", label: "PNG (Lossless)" },
                  { value: "jpeg", label: "JPEG (Smaller size)" },
                ]}
                onChange={v => update("defaultExportFormat", v as "png" | "jpeg")}
              />
            </SettingRow>
            <SettingRow label="JPEG Quality" description="Higher = better quality, larger file">
              <div className="w-[180px]">
                <Slider
                  value={settings.defaultExportQuality}
                  min={50}
                  max={100}
                  onChange={v => update("defaultExportQuality", v)}
                  suffix="%"
                />
              </div>
            </SettingRow>
            <SettingRow label="Default Canvas Size" description="Starting size for new designs">
              <Select
                value={settings.defaultCanvasSize}
                options={CANVAS_SIZE_OPTIONS}
                onChange={v => update("defaultCanvasSize", v)}
              />
            </SettingRow>
          </SettingSection>

          <SettingSection icon={<Globe className="w-[14px] h-[14px]" />} title="General" color="#FBBF24">
            <SettingRow label="Theme" description="App interface appearance">
              <div className="flex items-center bg-[rgba(255,255,255,0.04)] rounded-[10px] border border-[rgba(255,255,255,0.06)] p-[3px]">
                <button
                  onClick={() => update("theme", "dark")}
                  className={`py-[6px] px-[14px] rounded-[8px] text-[12px] font-medium transition-all cursor-pointer border-none ${
                    settings.theme === "dark"
                      ? "bg-gradient-to-br from-[#095DC3] to-[#2896FB] text-white shadow-md"
                      : "text-[#64748B] hover:text-[#94A3B8] bg-transparent"
                  }`}
                >
                  <Monitor className="w-[12px] h-[12px] inline mr-[4px]" />
                  Dark
                </button>
                <button
                  onClick={() => update("theme", "light")}
                  className={`py-[6px] px-[14px] rounded-[8px] text-[12px] font-medium transition-all cursor-pointer border-none ${
                    settings.theme === "light"
                      ? "bg-gradient-to-br from-[#095DC3] to-[#2896FB] text-white shadow-md"
                      : "text-[#64748B] hover:text-[#94A3B8] bg-transparent"
                  }`}
                >
                  <Globe className="w-[12px] h-[12px] inline mr-[4px]" />
                  Light
                </button>
              </div>
            </SettingRow>
            <SettingRow label="Language" description="Display language for the interface">
              <Select
                value={settings.language}
                options={LANGUAGE_OPTIONS}
                onChange={v => update("language", v)}
              />
            </SettingRow>
          </SettingSection>

          <div className="mt-[20px] mb-[32px] flex items-center justify-between">
            <div className="text-[11px] text-[#334155]">
              Settings are saved automatically to your browser
            </div>
            {hasChanges && (
              <div className="relative">
                {showReset ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-[8px] bg-[rgba(255,77,77,0.08)] border border-[rgba(255,77,77,0.15)] rounded-[10px] py-[8px] px-[14px]"
                  >
                    <span className="text-[12px] text-[#FF8A8A]">Reset all settings?</span>
                    <button
                      onClick={handleReset}
                      className="py-[4px] px-[10px] bg-[rgba(255,77,77,0.2)] text-[#FF6B6B] border border-[rgba(255,77,77,0.3)] rounded-[6px] text-[11px] font-medium cursor-pointer hover:bg-[rgba(255,77,77,0.3)] transition-all"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowReset(false)}
                      className="py-[4px] px-[8px] text-[#64748B] bg-transparent border-none text-[11px] cursor-pointer hover:text-white transition-all"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <button
                    onClick={() => setShowReset(true)}
                    className="flex items-center gap-[6px] py-[8px] px-[14px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] rounded-[10px] text-[12px] text-[#94A3B8] cursor-pointer hover:text-white hover:border-[rgba(255,255,255,0.12)] transition-all"
                  >
                    <RotateCcw className="w-[13px] h-[13px]" />
                    Reset to Defaults
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
