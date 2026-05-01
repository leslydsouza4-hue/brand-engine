import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Download,
  MousePointer2,
  UploadCloud,
  X as XIcon,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL;
const SWOOSH = `${BASE}assets/swoosh/swoosh-highly.png`;
const PERSON = `${BASE}assets/swoosh/tutorial-person.png`;

const STAGE_COUNT = 3;
const STAGE_MS = 4800;

const STAGES = [
  {
    title: "1. Upload your photo",
    caption:
      "Drop in any portrait — the background is removed automatically and the photo is auto-cropped to fit.",
  },
  {
    title: "2. Adjust position & crop",
    caption:
      "Tap the photo to show handles. Drag to move, corner squares to resize, edge bars to crop each side.",
  },
  {
    title: "3. Download",
    caption:
      "Hit Download Swoosh for the transparent PNG you'll drop into any design — or grab the full slide preview.",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
};

export function SwooshTutorial({ open, onClose }: Props) {
  const [stage, setStage] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset to stage 0 every time the modal opens, then auto-advance.
  useEffect(() => {
    if (!open) return;
    setStage(0);
    intervalRef.current = setInterval(() => {
      setStage((s) => (s + 1) % STAGE_COUNT);
    }, STAGE_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const goToStage = (i: number) => {
    setStage(i);
    // Re-arm the timer so the user gets a full beat on the stage they picked.
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setStage((s) => (s + 1) % STAGE_COUNT);
    }, STAGE_MS);
  };

  const current = STAGES[stage];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-[16px]"
      role="dialog"
      aria-modal="true"
      aria-label="Swoosh tutorial"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-[6px]"
        onClick={onClose}
      />

      {/* Modal card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[560px] rounded-[20px] border border-white/[0.08] bg-gradient-to-b from-[#0a1426] to-[#050b18] shadow-[0_24px_72px_rgba(0,0,0,0.6),0_0_0_1px_rgba(0,178,169,0.06)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[20px] pt-[16px] pb-[12px] border-b border-white/[0.05]">
          <div className="flex flex-col">
            <div className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#00B2A9]">
              How it works
            </div>
            <div className="text-[15px] font-bold text-white mt-[2px]">
              Swoosh background tutorial
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] rounded-[8px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[#94A3B8] hover:text-white flex items-center justify-center cursor-pointer transition-all"
            aria-label="Close tutorial"
          >
            <XIcon className="w-[14px] h-[14px]" />
          </button>
        </div>

        {/* Animation stage area */}
        <div className="relative h-[300px] bg-[radial-gradient(circle_at_30%_20%,rgba(0,178,169,0.08),transparent_60%),radial-gradient(circle_at_80%_80%,rgba(40,150,251,0.06),transparent_55%)] overflow-hidden">
          <AnimatePresence mode="wait">
            {stage === 0 && <Stage1 key="s1" />}
            {stage === 1 && <Stage2 key="s2" />}
            {stage === 2 && <Stage3 key="s3" />}
          </AnimatePresence>
        </div>

        {/* Caption */}
        <div className="px-[24px] pt-[18px] pb-[12px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-[13px] font-bold text-white mb-[4px]">
                {current.title}
              </div>
              <div className="text-[11.5px] text-[#94A3B8] leading-[1.55]">
                {current.caption}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step dots + progress */}
        <div className="flex items-center justify-between px-[20px] pb-[18px]">
          <div className="flex items-center gap-[6px]">
            {Array.from({ length: STAGE_COUNT }).map((_, i) => (
              <button
                key={i}
                onClick={() => goToStage(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-[6px] rounded-full transition-all cursor-pointer border-none ${
                  i === stage
                    ? "w-[26px] bg-gradient-to-r from-[#00B2A9] to-[#2896FB]"
                    : "w-[6px] bg-white/[0.12] hover:bg-white/[0.2]"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="text-[11px] font-semibold text-[#94A3B8] hover:text-white bg-transparent border-none cursor-pointer transition-all px-[6px] py-[4px]"
          >
            Got it
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ============================================================================
// STAGE 1 — Upload
//   • Empty dashed dropzone is shown
//   • Animated cursor swoops in and "drops" the photo
//   • Dropzone transitions to the success tile with the person thumbnail
//     and a "BG removed ✓" badge
// ============================================================================
function Stage1() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="relative w-[260px]">
        {/* Empty upload state — fades out as the success state fades in */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.35, delay: 1.6 }}
          className="absolute inset-0 flex flex-col items-center gap-[8px] py-[28px] px-[18px] rounded-[12px] border border-dashed border-white/[0.12] bg-white/[0.02]"
        >
          <UploadCloud className="w-[24px] h-[24px] text-[#64748B]" />
          <div className="text-[11px] font-semibold text-[#94A3B8]">
            Upload person photo
          </div>
          <div className="text-[10px] text-[#475569]">
            BG will be auto-removed
          </div>
        </motion.div>

        {/* Success state */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 1.7 }}
          className="relative rounded-[12px] border border-[rgba(0,178,169,0.25)] bg-[rgba(0,178,169,0.06)] overflow-hidden"
        >
          <div className="flex items-center gap-[10px] p-[12px]">
            <div className="w-[44px] h-[44px] rounded-[8px] bg-white/[0.04] overflow-hidden flex items-center justify-center shrink-0">
              <img
                src={PERSON}
                alt=""
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold text-[#00B2A9] flex items-center gap-[4px]">
                <Check className="w-[11px] h-[11px]" /> Image ready
              </div>
              <div className="text-[10px] text-[#64748B] mt-[2px]">
                Background removed
              </div>
            </div>
          </div>
        </motion.div>

        {/* Animated cursor swooping in to "drop" the photo */}
        <motion.div
          initial={{ x: 180, y: -100, opacity: 0 }}
          animate={{
            x: [180, 60, 0],
            y: [-100, -20, 30],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2.2,
            times: [0, 0.4, 0.85, 1],
            ease: "easeOut",
          }}
          className="absolute top-[40%] left-[40%] pointer-events-none"
        >
          <MousePointer2
            className="w-[22px] h-[22px] text-white"
            style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.8))" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STAGE 2 — Adjust
//   • Mini swoosh composition (back swoosh, person, front clip swoosh)
//   • Person scales / repositions over time
//   • Bounding box fades in and corner / edge handles flash
//   • Animated cursor demonstrates a corner-resize gesture
// ============================================================================
function Stage2() {
  // Comp dims chosen to match the 1080×1350 portrait ratio at a tutorial scale.
  const compW = 200;
  const compH = 250;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div
        className="relative"
        style={{
          width: compW,
          height: compH,
          background:
            "repeating-conic-gradient(rgba(255,255,255,0.04) 0% 25%, transparent 0% 50%) 50% / 14px 14px",
          borderRadius: 6,
          outline: "1px dashed rgba(255,255,255,0.08)",
        }}
      >
        {/* Back swoosh */}
        <img
          src={SWOOSH}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            top: "12%",
            right: "-25%",
            height: "76%",
            objectFit: "contain",
            objectPosition: "right top",
            pointerEvents: "none",
          }}
        />

        {/* Person — animated scale + clip to demonstrate resize + crop */}
        <motion.div
          initial={{ scale: 1, opacity: 0 }}
          animate={{
            scale: [1, 1, 0.85, 0.85, 0.85],
            opacity: [0, 1, 1, 1, 1],
          }}
          transition={{
            duration: 4.4,
            times: [0, 0.15, 0.55, 0.7, 1],
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: "5%",
            left: "50%",
            translateX: "-50%",
            height: "85%",
            transformOrigin: "center top",
          }}
        >
          <img
            src={PERSON}
            alt=""
            draggable={false}
            style={{
              height: "100%",
              objectFit: "contain",
              clipPath: "inset(0% 0% 18% 0%)",
            }}
          />
        </motion.div>

        {/* Front swoosh clip — covers the bottom half */}
        <img
          src={SWOOSH}
          alt=""
          draggable={false}
          style={{
            position: "absolute",
            top: "12%",
            right: "-25%",
            height: "76%",
            objectFit: "contain",
            objectPosition: "right top",
            clipPath: "inset(52% 0% 0% 0%)",
            pointerEvents: "none",
          }}
        />

        {/* Bounding box overlay — fades in after the person settles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0, 1, 1, 1] }}
          transition={{
            duration: 4.4,
            times: [0, 0.2, 0.35, 0.85, 1],
          }}
          style={{
            position: "absolute",
            top: "5%",
            left: "30%",
            width: "40%",
            height: "70%",
            border: "1px solid rgba(40,150,251,0.9)",
            boxShadow:
              "0 0 0 1px rgba(40,150,251,0.15), 0 4px 18px rgba(40,150,251,0.18)",
            pointerEvents: "none",
          }}
        >
          {/* 4 corner squares */}
          {[
            { top: -5, left: -5 },
            { top: -5, right: -5 },
            { bottom: -5, left: -5 },
            { bottom: -5, right: -5 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 8,
                height: 8,
                background: "#2896FB",
                border: "1px solid white",
                borderRadius: 2,
                ...pos,
              }}
            />
          ))}
          {/* 4 edge bars */}
          {[
            { top: -4, left: "50%", marginLeft: -10, width: 20, height: 6 },
            { bottom: -4, left: "50%", marginLeft: -10, width: 20, height: 6 },
            { left: -4, top: "50%", marginTop: -10, width: 6, height: 20 },
            { right: -4, top: "50%", marginTop: -10, width: 6, height: 20 },
          ].map((pos, i) => (
            <div
              key={`edge-${i}`}
              style={{
                position: "absolute",
                background: "rgba(40,150,251,0.9)",
                border: "1px solid white",
                borderRadius: 3,
                ...pos,
              }}
            />
          ))}
        </motion.div>

        {/* Animated cursor — moves to top-right corner, "grabs" + resizes */}
        <motion.div
          initial={{ x: 130, y: 80, opacity: 0 }}
          animate={{
            x: [130, 92, 80, 80, 110],
            y: [80, 18, 12, 35, 70],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{
            duration: 4.4,
            times: [0, 0.3, 0.45, 0.7, 1],
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 pointer-events-none"
        >
          <MousePointer2
            className="w-[20px] h-[20px] text-white"
            style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.85))" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// STAGE 3 — Download
//   • Mini sidebar with the two real download buttons
//   • Cursor moves to "Download Swoosh", clicks
//   • A success toast appears: "Swoosh PNG downloaded"
// ============================================================================
function Stage3() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="relative w-[280px] flex flex-col gap-[10px]">
        {/* Primary button — Download Swoosh */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(40,150,251,0)",
              "0 0 0 0 rgba(40,150,251,0)",
              "0 8px 24px rgba(40,150,251,0.45)",
              "0 4px 12px rgba(40,150,251,0.25)",
              "0 4px 12px rgba(40,150,251,0.25)",
            ],
            scale: [1, 1, 0.97, 1, 1],
          }}
          transition={{ duration: 4.4, times: [0, 0.4, 0.55, 0.7, 1] }}
          className="w-full py-[12px] rounded-[10px] bg-gradient-to-r from-[#095DC3] to-[#2896FB] text-white text-[12px] font-semibold flex items-center justify-center gap-[6px]"
        >
          <Download className="w-[14px] h-[14px]" />
          Download Swoosh (1080×1350)
        </motion.div>

        {/* Secondary button — Download Slide */}
        <div className="w-full py-[12px] rounded-[10px] bg-white/[0.04] border border-white/[0.08] text-white text-[12px] font-semibold flex items-center justify-center gap-[6px]">
          <Download className="w-[14px] h-[14px]" />
          Download Slide (1920×1080)
        </div>

        {/* Success toast */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: [0, 0, 1, 1], y: [10, 10, 0, 0] }}
          transition={{ duration: 4.4, times: [0, 0.6, 0.75, 1] }}
          className="absolute -bottom-[44px] left-1/2 -translate-x-1/2 flex items-center gap-[6px] px-[12px] py-[7px] rounded-[8px] bg-[rgba(0,178,169,0.12)] border border-[rgba(0,178,169,0.3)]"
        >
          <Check className="w-[12px] h-[12px] text-[#00B2A9]" />
          <span className="text-[11px] font-semibold text-[#00B2A9]">
            Swoosh PNG downloaded
          </span>
        </motion.div>

        {/* Animated cursor — moves down to the primary button and clicks */}
        <motion.div
          initial={{ x: -40, y: -60, opacity: 0 }}
          animate={{
            x: [-40, 90, 110, 110, 110],
            y: [-60, -20, 0, 4, 30],
            opacity: [0, 1, 1, 1, 0],
          }}
          transition={{
            duration: 4.4,
            times: [0, 0.4, 0.55, 0.7, 1],
            ease: "easeInOut",
          }}
          className="absolute top-0 left-1/2 pointer-events-none"
        >
          <MousePointer2
            className="w-[20px] h-[20px] text-white"
            style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.85))" }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}
