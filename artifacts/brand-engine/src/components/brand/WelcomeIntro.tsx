import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Sparkles, ImagePlay, Megaphone, Mail, BrainCircuit, Trophy, Wand2,
  MonitorPlay, FolderOpen, ArrowRight, ArrowLeft, X,
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

// Minimal walkthrough — one card per feature area.
const FEATURES = [
  { icon: BrainCircuit, name: "Brand Brain", desc: "Ask anything and get on-brand design ideas, instantly.", color: T.primary },
  { icon: Wand2, name: "Craft Magic", desc: "One prompt turns into social posts, ads, and more.", color: T.accent },
  { icon: ImagePlay, name: "Thumbnails", desc: "Batch YouTube thumbnails — Shaun, Content Army, Spotlight & more.", color: "#5EE6DE" },
  { icon: Megaphone, name: "Promo Kits", desc: "Full campaign packs in every size from one set of details.", color: "#A78BFA" },
  { icon: Trophy, name: "Leaderboards", desc: "Polished affiliate ranking cards, ready to post.", color: T.cta },
  { icon: Mail, name: "Marketing Email", desc: "Drop a doc link, get a fully designed branded email.", color: "#FB7185" },
  { icon: MonitorPlay, name: "Backgrounds", desc: "Zoom and speaker backgrounds with auto cut-outs.", color: "#38BDF8" },
  { icon: FolderOpen, name: "Brand Directory", desc: "Every logo, color, and font in one place.", color: "#34D399" },
];

const FEATURE_MS = 2100;

export function WelcomeIntro({ onDismiss }: { onDismiss: () => void }) {
  const reduce = useReducedMotion();
  // scene: 0 logo, 1 tagline, 2 walkthrough, 3 CTA
  const [scene, setScene] = useState(0);
  const [feat, setFeat] = useState(0);
  const [closing, setClosing] = useState(false);

  const finish = useCallback(() => {
    if (closing) return;
    setClosing(true);
    markIntroSeen();
    window.setTimeout(onDismiss, 650);
  }, [closing, onDismiss]);

  const advanceScene = useCallback(() => setScene((s) => Math.min(s + 1, 3)), []);

  const nextFeature = useCallback(() => {
    setFeat((f) => {
      if (f >= FEATURES.length - 1) {
        setScene(3);
        return f;
      }
      return f + 1;
    });
  }, []);
  const prevFeature = useCallback(() => setFeat((f) => Math.max(0, f - 1)), []);

  // Click-anywhere behavior depends on the scene.
  const handleSurfaceClick = useCallback(() => {
    if (scene < 2) advanceScene();
    else if (scene === 2) nextFeature();
  }, [scene, advanceScene, nextFeature]);

  // Auto-advance the intro scenes (logo, tagline).
  useEffect(() => {
    if (closing || scene > 1) return;
    const ms = reduce ? 1200 : scene === 0 ? 2300 : 1900;
    const id = window.setTimeout(advanceScene, ms);
    return () => window.clearTimeout(id);
  }, [scene, advanceScene, reduce, closing]);

  // Auto-advance the walkthrough features.
  useEffect(() => {
    if (closing || scene !== 2) return;
    const id = window.setTimeout(nextFeature, reduce ? 1300 : FEATURE_MS);
    return () => window.clearTimeout(id);
  }, [scene, feat, nextFeature, reduce, closing]);

  // Keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "Enter" && scene >= 3) finish();
      else if (e.key === "ArrowRight") { if (scene === 2) nextFeature(); else if (scene < 2) advanceScene(); }
      else if (e.key === "ArrowLeft" && scene === 2) prevFeature();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [finish, scene, nextFeature, prevFeature, advanceScene]);

  const ease = [0.22, 1, 0.36, 1] as const;

  // Top progress: 4 segments. Walkthrough segment fills by feature progress.
  const segFill = (i: number) => {
    if (i < scene) return 1;
    if (i > scene) return 0;
    if (i === 2) return (feat + 1) / FEATURES.length;
    return 1;
  };

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
          onClick={handleSurfaceClick}
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
            Skip <X className="w-[13px] h-[13px]" />
          </button>

          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 flex gap-[6px] p-[14px] z-10">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-[3px] rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: T.primary, originX: 0 }}
                  initial={false}
                  animate={{ scaleX: segFill(i) }}
                  transition={{
                    duration: i === scene && scene <= 1 ? (reduce ? 1.2 : scene === 0 ? 2.3 : 1.9) : 0.4,
                    ease: i === scene && scene <= 1 ? "linear" : ease,
                  }}
                />
              </div>
            ))}
          </div>

          {/* Scenes */}
          <div className="relative z-[5] w-full max-w-[920px] px-[32px] text-center">
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
                    Brand <span style={{ color: T.primary }}>Engine</span>
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
                    Here's a quick tour of everything you can make.
                  </motion.p>
                </motion.div>
              )}

              {/* Scene 2 — Feature walkthrough */}
              {scene === 2 && (
                <motion.div
                  key="s2"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-white/40 text-[12px] font-semibold uppercase tracking-[2px] mb-[24px]">
                    Feature {feat + 1} of {FEATURES.length}
                  </div>

                  <div className="relative w-full max-w-[560px] h-[260px] flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {(() => {
                        const f = FEATURES[feat];
                        const Icon = f.icon;
                        return (
                          <motion.div
                            key={f.name}
                            className="absolute inset-0 flex flex-col items-center justify-center"
                            initial={{ opacity: 0, x: reduce ? 0 : 50, scale: 0.96 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: reduce ? 0 : -50, scale: 0.96 }}
                            transition={{ duration: 0.45, ease }}
                          >
                            <div
                              className="w-[92px] h-[92px] rounded-[26px] flex items-center justify-center mb-[24px]"
                              style={{
                                background: `${f.color}1A`,
                                border: `1px solid ${f.color}3A`,
                                boxShadow: `0 18px 50px ${f.color}26`,
                              }}
                            >
                              <Icon className="w-[44px] h-[44px]" style={{ color: f.color }} />
                            </div>
                            <div
                              className="text-[30px] md:text-[40px] font-extrabold tracking-[-0.02em]"
                              style={{ fontFamily: T.fontHeading, color: "#fff" }}
                            >
                              {f.name}
                            </div>
                            <p className="mt-[12px] text-white/55 text-[15px] md:text-[17px] font-medium max-w-[440px] leading-[1.5]">
                              {f.desc}
                            </p>
                          </motion.div>
                        );
                      })()}
                    </AnimatePresence>
                  </div>

                  {/* Dots */}
                  <div className="flex items-center gap-[7px] mt-[28px]">
                    {FEATURES.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setFeat(i); }}
                        className="rounded-full transition-all cursor-pointer"
                        style={{
                          width: i === feat ? 22 : 7,
                          height: 7,
                          background: i === feat ? T.primary : "rgba(255,255,255,0.2)",
                        }}
                        aria-label={`Feature ${i + 1}`}
                      />
                    ))}
                  </div>

                  {/* Prev / Next */}
                  <div className="flex items-center gap-[10px] mt-[26px]">
                    <button
                      onClick={(e) => { e.stopPropagation(); prevFeature(); }}
                      disabled={feat === 0}
                      className="flex items-center gap-[6px] py-[9px] px-[16px] rounded-full text-[13px] font-semibold text-white/60 hover:text-white border border-white/10 hover:border-white/25 bg-white/5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft className="w-[14px] h-[14px]" /> Back
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextFeature(); }}
                      className="flex items-center gap-[6px] py-[9px] px-[18px] rounded-full text-[13px] font-bold text-white transition-all cursor-pointer"
                      style={{ background: `linear-gradient(90deg, ${T.primary}, ${T.accent})`, boxShadow: `0 8px 24px ${T.primary}44` }}
                    >
                      {feat >= FEATURES.length - 1 ? "Finish" : "Next"}
                      <ArrowRight className="w-[14px] h-[14px]" />
                    </button>
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
          {scene < 2 && (
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
