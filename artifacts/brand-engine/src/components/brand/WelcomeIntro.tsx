import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles, ImagePlay, Megaphone, Mail, BrainCircuit, Trophy, ArrowRight, X,
} from "lucide-react";
import { BRAND_THEMES } from "./brandModeStore";

const INTRO_SEEN_KEY = "brandEngine.introSeen.v1";

export function hasSeenIntro(): boolean {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

export function markIntroSeen(): void {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function resetIntro(): void {
  try {
    localStorage.removeItem(INTRO_SEEN_KEY);
  } catch {
    /* ignore */
  }
}

const T = BRAND_THEMES.highlevel;

const PILLARS = [
  { icon: ImagePlay, label: "Thumbnails", color: T.primary },
  { icon: Megaphone, label: "Promos", color: T.accent },
  { icon: Mail, label: "Email", color: "#A78BFA" },
  { icon: BrainCircuit, label: "Brand Brain", color: T.primary },
  { icon: Trophy, label: "Leaderboards", color: T.cta },
];

// Auto-advance durations per scene (ms). Last scene waits for the user.
const SCENE_MS = [2300, 1900, 2600];

export function WelcomeIntro({ onDismiss }: { onDismiss: () => void }) {
  const reduce = useReducedMotion();
  const [scene, setScene] = useState(0);
  const [closing, setClosing] = useState(false);

  const finish = useCallback(() => {
    if (closing) return;
    setClosing(true);
    markIntroSeen();
    window.setTimeout(onDismiss, 650);
  }, [closing, onDismiss]);

  const advance = useCallback(() => {
    setScene((s) => Math.min(s + 1, 3));
  }, []);

  // Auto-advance through the timed scenes (0,1,2). Scene 3 (CTA) waits.
  useEffect(() => {
    if (closing || scene > 2) return;
    const ms = reduce ? 1200 : SCENE_MS[scene];
    const id = window.setTimeout(advance, ms);
    return () => window.clearTimeout(id);
  }, [scene, advance, reduce, closing]);

  // Esc to skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "Enter" && scene >= 3) finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, scene]);

  const ease = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          key="welcome-intro"
          className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
          style={{ background: T.bgDeep, fontFamily: T.fontBody }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => { if (scene < 3) advance(); }}
        >
          {/* Ambient gradient orbs */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "60vw", height: "60vw", left: "-15vw", top: "-20vw",
              background: `radial-gradient(circle, ${T.primary}33, transparent 60%)`,
              filter: "blur(40px)",
            }}
            animate={reduce ? {} : { x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{
              width: "55vw", height: "55vw", right: "-18vw", bottom: "-22vw",
              background: `radial-gradient(circle, ${T.accent}33, transparent 60%)`,
              filter: "blur(40px)",
            }}
            animate={reduce ? {} : { x: [0, -40, 0], y: [0, -20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="absolute inset-0 brand-app-noise opacity-[0.5] pointer-events-none" />

          {/* Skip button */}
          <button
            onClick={(e) => { e.stopPropagation(); finish(); }}
            className="absolute top-[24px] right-[24px] z-10 flex items-center gap-[6px] py-[8px] px-[14px] rounded-full text-[12px] font-medium text-white/55 hover:text-white border border-white/10 hover:border-white/25 bg-white/5 backdrop-blur transition-all cursor-pointer"
          >
            Skip intro <X className="w-[13px] h-[13px]" />
          </button>

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 flex gap-[6px] p-[14px] z-10">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: T.primary, originX: 0 }}
                  initial={{ scaleX: i < scene ? 1 : 0 }}
                  animate={{ scaleX: i < scene ? 1 : i === scene ? 1 : 0 }}
                  transition={{
                    duration: i === scene && scene <= 2 ? (reduce ? 1.2 : SCENE_MS[scene] / 1000) : 0.3,
                    ease: "linear",
                  }}
                />
              </div>
            ))}
          </div>

          {/* Scenes */}
          <div className="relative z-[5] w-full max-w-[900px] px-[32px] text-center">
            <AnimatePresence mode="wait">
              {/* Scene 0 — Logo reveal */}
              {scene === 0 && (
                <motion.div
                  key="s0"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.img
                    src={T.logoLockupUrl}
                    alt="HighLevel"
                    className="h-[56px] md:h-[72px] object-contain mb-[28px]"
                    initial={{ opacity: 0, scale: 0.85, filter: "blur(8px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: 0.9, ease }}
                  />
                  <motion.div
                    className="text-[44px] md:text-[68px] font-extrabold tracking-[-0.03em] leading-[1]"
                    style={{ fontFamily: T.fontHeading, color: "#fff" }}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.35, ease }}
                  >
                    Brand{" "}
                    <span style={{ color: T.primary }}>Engine</span>
                  </motion.div>
                  <motion.div
                    className="mt-[14px] flex items-center gap-[8px] text-white/45 text-[14px] font-medium uppercase tracking-[3px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                  >
                    <Sparkles className="w-[14px] h-[14px]" style={{ color: T.cta }} />
                    Welcome
                  </motion.div>
                </motion.div>
              )}

              {/* Scene 1 — What it is */}
              {scene === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="text-[34px] md:text-[58px] font-extrabold tracking-[-0.03em] leading-[1.08]"
                    style={{ fontFamily: T.fontHeading, color: "#fff" }}
                    initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.8, ease }}
                  >
                    Your on-brand
                    <br />
                    <span
                      style={{
                        background: `linear-gradient(90deg, ${T.primary}, ${T.accent})`,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      creative studio
                    </span>
                  </motion.div>
                  <motion.p
                    className="mt-[20px] text-white/55 text-[16px] md:text-[19px] font-medium max-w-[560px] mx-auto leading-[1.5]"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    Everything you make stays perfectly on-brand — fonts, colors, and logos baked in.
                  </motion.p>
                </motion.div>
              )}

              {/* Scene 2 — Pillars */}
              {scene === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="text-[26px] md:text-[40px] font-extrabold tracking-[-0.02em] mb-[36px]"
                    style={{ fontFamily: T.fontHeading, color: "#fff" }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease }}
                  >
                    Make it all in one place
                  </motion.div>
                  <div className="flex flex-wrap items-center justify-center gap-[16px] md:gap-[22px]">
                    {PILLARS.map((p, i) => {
                      const Icon = p.icon;
                      return (
                        <motion.div
                          key={p.label}
                          className="flex flex-col items-center gap-[12px] w-[110px] md:w-[140px]"
                          initial={{ opacity: 0, y: 40, scale: 0.8 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.55, delay: 0.15 + i * 0.12, ease }}
                        >
                          <div
                            className="w-[64px] h-[64px] md:w-[78px] md:h-[78px] rounded-[20px] flex items-center justify-center"
                            style={{
                              background: `${p.color}1A`,
                              border: `1px solid ${p.color}3A`,
                              boxShadow: `0 10px 30px ${p.color}22`,
                            }}
                          >
                            <Icon className="w-[28px] h-[28px] md:w-[34px] md:h-[34px]" style={{ color: p.color }} />
                          </div>
                          <span className="text-white/80 text-[13px] md:text-[15px] font-semibold">{p.label}</span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Scene 3 — CTA */}
              {scene === 3 && (
                <motion.div
                  key="s3"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.div
                    className="text-[36px] md:text-[60px] font-extrabold tracking-[-0.03em] leading-[1.05]"
                    style={{ fontFamily: T.fontHeading, color: "#fff" }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.7, ease }}
                  >
                    Let's create
                  </motion.div>
                  <motion.p
                    className="mt-[14px] text-white/50 text-[16px] font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                  >
                    Your studio is ready.
                  </motion.p>
                  <motion.button
                    onClick={(e) => { e.stopPropagation(); finish(); }}
                    className="mt-[34px] group flex items-center gap-[10px] py-[15px] px-[34px] rounded-full text-[16px] font-bold cursor-pointer"
                    style={{
                      background: `linear-gradient(90deg, ${T.primary}, ${T.accent})`,
                      color: "#fff",
                      boxShadow: `0 14px 40px ${T.primary}55`,
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45, ease }}
                    whileHover={reduce ? {} : { scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Enter Brand Engine
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-[3px]" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hint */}
          {scene < 3 && (
            <motion.div
              className="absolute bottom-[24px] left-1/2 -translate-x-1/2 text-white/30 text-[12px] font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
            >
              Click anywhere to continue
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
