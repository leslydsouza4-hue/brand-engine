import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MousePointer2, Link2, Mail, PlayCircle } from "lucide-react";

type TutorialConfig = {
  badge: string;
  title: string;
  body: string;
  cta: string;
  scene: "email";
};

const TUTORIALS: Record<string, TutorialConfig> = {
  "email-templates": {
    badge: "NEW",
    title: "Marketing Email is live",
    body: "Drop a Google Doc link, get a fully designed branded email. Tweak any text or color in one click.",
    cta: "Try it now",
    scene: "email",
  },
};

const STORAGE_PREFIX = "brand-engine.tutorial.dismissed.";
const REOPEN_EVENT = "brand-engine:reopen-tutorial";

export function TutorialPopup({ currentMode }: { currentMode: string }) {
  const config = TUTORIALS[currentMode];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!config) {
      setOpen(false);
      return;
    }
    const dismissed =
      typeof window !== "undefined" &&
      localStorage.getItem(STORAGE_PREFIX + currentMode) === "1";
    if (dismissed) {
      setOpen(false);
      return;
    }
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [currentMode, config]);

  useEffect(() => {
    const handler = () => {
      try {
        localStorage.removeItem(STORAGE_PREFIX + currentMode);
      } catch {}
      setOpen(true);
    };
    window.addEventListener(REOPEN_EVENT, handler);
    return () => window.removeEventListener(REOPEN_EVENT, handler);
  }, [currentMode]);

  const dismiss = () => {
    setOpen(false);
    try {
      localStorage.setItem(STORAGE_PREFIX + currentMode, "1");
    } catch {}
  };

  if (!config) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              right: 24,
              bottom: 92,
              zIndex: 9999,
              width: 360,
              borderRadius: 18,
              overflow: "hidden",
              boxShadow:
                "0 24px 60px -12px rgba(0,0,0,0.65), 0 8px 24px -8px rgba(23,217,75,0.18)",
              background: "#0B1426",
              border: "1px solid rgba(255,255,255,0.08)",
              fontFamily: "Inter, system-ui, sans-serif",
            }}
          >
            <div
              style={{
                position: "relative",
                height: 200,
                background:
                  "radial-gradient(120% 100% at 50% 0%, #15233D 0%, #0B1426 70%)",
                overflow: "hidden",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* dotted texture */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                  opacity: 0.6,
                  pointerEvents: "none",
                }}
              />
              {/* ambient brand glow */}
              <div
                style={{
                  position: "absolute",
                  left: "-20%",
                  top: "-30%",
                  width: "70%",
                  height: "70%",
                  background:
                    "radial-gradient(circle, rgba(23,217,75,0.18), transparent 60%)",
                  filter: "blur(20px)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  right: "-15%",
                  bottom: "-20%",
                  width: "60%",
                  height: "60%",
                  background:
                    "radial-gradient(circle, rgba(40,150,251,0.16), transparent 60%)",
                  filter: "blur(20px)",
                  pointerEvents: "none",
                }}
              />

              <button
                onClick={dismiss}
                aria-label="Dismiss"
                style={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.06)",
                  color: "rgba(248,250,252,0.7)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  zIndex: 10,
                }}
              >
                <X size={14} strokeWidth={2.5} />
              </button>

              {config.scene === "email" && <EmailScene />}
            </div>

            <div style={{ padding: "16px 18px 18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    background: "rgba(23,217,75,0.18)",
                    color: "#17D94B",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.08em",
                    padding: "3px 8px",
                    borderRadius: 6,
                  }}
                >
                  {config.badge}
                </span>
                <span style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 700 }}>
                  {config.title}
                </span>
              </div>
              <p
                style={{
                  color: "rgba(248,250,252,0.65)",
                  fontSize: 12.5,
                  lineHeight: 1.5,
                  margin: "0 0 14px",
                }}
              >
                {config.body}
              </p>
              <button
                onClick={dismiss}
                style={{
                  width: "100%",
                  background: "linear-gradient(90deg, #17D94B 0%, #2896FB 100%)",
                  color: "#0B1426",
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Sparkles size={13} strokeWidth={2.5} />
                {config.cta}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Re-open trigger — vertical right-edge tab */}
      <AnimatePresence>
        {!open && <RightEdgeTab onClick={() => {
          try { localStorage.removeItem(STORAGE_PREFIX + currentMode); } catch {}
          setOpen(true);
        }} />}
      </AnimatePresence>
    </>
  );
}

/* ---------- Circular Play button beside the FeatureRequestBubble ---------- */

function RightEdgeTab({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: 12 }}
      transition={{ duration: 0.3, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      aria-label="Watch tour"
      title="Watch tour"
      style={{
        position: "fixed",
        right: 88,
        bottom: 24,
        zIndex: 9998,
        width: 52,
        height: 52,
        borderRadius: 999,
        background: "linear-gradient(135deg, #17D94B 0%, #2896FB 100%)",
        border: "none",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#0B1426",
        boxShadow: hover
          ? "0 6px 32px rgba(23,217,75,0.55), 0 0 0 1px rgba(23,217,75,0.3)"
          : "0 4px 24px rgba(23,217,75,0.4), 0 0 0 1px rgba(23,217,75,0.2)",
        transform: hover ? "scale(1.05)" : "scale(1)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* pulsing halo */}
      <motion.span
        animate={{ scale: [1, 1.45, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: -2,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(23,217,75,0.55), transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <PlayCircle size={22} strokeWidth={2.5} fill="#0B1426" color="#0B1426" />
    </motion.button>
  );
}

/* ---------- Email scene ---------- */

function EmailScene() {
  const [beat, setBeat] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setBeat((b) => (b + 1) % 4), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, padding: 18 }}>
      <AnimatePresence mode="wait">
        {beat === 0 && <BeatPaste key="paste" />}
        {beat === 1 && <BeatGenerate key="generate" />}
        {beat === 2 && <BeatEmail key="email" />}
        {beat === 3 && <BeatEdit key="edit" />}
      </AnimatePresence>

      <div
        style={{
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 5,
          zIndex: 5,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: i === beat ? 16 : 5,
              height: 5,
              borderRadius: 999,
              background: i === beat ? "#17D94B" : "rgba(248,250,252,0.2)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const sceneAnim = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: {
    duration: 0.35,
    ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
  },
};

const PANEL_BG = "rgba(255,255,255,0.04)";
const PANEL_BORDER = "1px solid rgba(255,255,255,0.08)";

function BeatPaste() {
  const url = "docs.google.com/document/...";
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          background: PANEL_BG,
          backdropFilter: "blur(8px)",
          borderRadius: 12,
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          border: "1.5px solid rgba(23,217,75,0.55)",
          boxShadow: "0 0 0 4px rgba(23,217,75,0.10)",
        }}
      >
        <Link2 size={16} color="#2896FB" strokeWidth={2.5} />
        <div
          style={{
            flex: 1,
            fontSize: 12,
            color: "#F8FAFC",
            fontWeight: 600,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <Typewriter text={url} />
        </div>
      </div>
    </motion.div>
  );
}

function BeatGenerate() {
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 80,
          height: 80,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(23,217,75,0.55), transparent 70%)",
          }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: 6,
            borderRadius: 999,
            background:
              "conic-gradient(from 0deg, #17D94B, #2896FB, #FFC328, #17D94B)",
            mask: "radial-gradient(circle, transparent 60%, black 62%)",
            WebkitMask: "radial-gradient(circle, transparent 60%, black 62%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            width: 36,
            height: 36,
            borderRadius: 999,
            background: "linear-gradient(135deg, #17D94B, #2896FB)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 18px rgba(23,217,75,0.55)",
          }}
        >
          <Sparkles size={18} color="#0B1426" strokeWidth={2.5} fill="#0B1426" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function BeatEmail() {
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          background: PANEL_BG,
          backdropFilter: "blur(8px)",
          borderRadius: 10,
          overflow: "hidden",
          border: PANEL_BORDER,
          boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
        }}
      >
        <motion.div
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 0.4 }}
          style={{
            transformOrigin: "top",
            height: 38,
            background: "linear-gradient(135deg, #17D94B 0%, #2896FB 100%)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
          }}
        >
          <Mail size={14} color="#0B1426" strokeWidth={2.5} />
          <div
            style={{
              marginLeft: 6,
              color: "#0B1426",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.05em",
            }}
          >
            HIGHLEVEL · NEW
          </div>
        </motion.div>
        <div style={{ padding: "10px 12px 12px" }}>
          {[80, 65, 90].map((w, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.3 }}
              style={{
                height: 6,
                width: `${w}%`,
                background: "rgba(248,250,252,0.18)",
                borderRadius: 3,
                marginBottom: 6,
              }}
            />
          ))}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.3 }}
            style={{
              marginTop: 8,
              padding: "5px 10px",
              background: "#17D94B",
              color: "#0B1426",
              fontSize: 9,
              fontWeight: 800,
              borderRadius: 6,
              display: "inline-block",
              boxShadow: "0 4px 12px rgba(23,217,75,0.35)",
            }}
          >
            CLAIM OFFER →
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function BeatEdit() {
  const [colorIdx, setColorIdx] = useState(0);
  const colors = ["#17D94B", "#2896FB", "#FFC328"];

  useEffect(() => {
    const id = setInterval(() => setColorIdx((c) => (c + 1) % 3), 700);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          background: PANEL_BG,
          backdropFilter: "blur(8px)",
          borderRadius: 10,
          overflow: "hidden",
          border: PANEL_BORDER,
          padding: "12px 14px",
          position: "relative",
          boxShadow: "0 8px 22px rgba(0,0,0,0.35)",
        }}
      >
        <motion.div
          animate={{
            outline: [
              "2px dashed rgba(40,150,251,0)",
              "2px dashed rgba(40,150,251,0.85)",
              "2px dashed rgba(40,150,251,0)",
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity }}
          style={{ padding: "4px 6px", borderRadius: 4, marginBottom: 6 }}
        >
          <div
            style={{
              height: 6,
              width: "70%",
              background: "rgba(248,250,252,0.28)",
              borderRadius: 3,
            }}
          />
        </motion.div>
        <div
          style={{
            height: 6,
            width: "55%",
            background: "rgba(248,250,252,0.16)",
            borderRadius: 3,
            marginBottom: 6,
            marginLeft: 6,
          }}
        />
        <div
          style={{
            height: 6,
            width: "85%",
            background: "rgba(248,250,252,0.16)",
            borderRadius: 3,
            marginBottom: 10,
            marginLeft: 6,
          }}
        />

        <motion.div
          animate={{ background: colors[colorIdx] }}
          transition={{ duration: 0.4 }}
          style={{
            marginLeft: 6,
            padding: "5px 10px",
            color: "#0B1426",
            fontSize: 9,
            fontWeight: 800,
            borderRadius: 6,
            display: "inline-block",
          }}
        >
          CLAIM OFFER →
        </motion.div>

        <motion.div
          initial={{ x: 110, y: -2 }}
          animate={{ x: [110, 30, 30, 110], y: [-2, -38, -38, -2] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: 50,
            left: 0,
            color: "#F8FAFC",
            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))",
          }}
        >
          <MousePointer2 size={14} fill="#F8FAFC" />
        </motion.div>
      </div>
    </motion.div>
  );
}

function Typewriter({ text }: { text: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const id = setInterval(() => {
      setN((c) => {
        if (c >= text.length) {
          clearInterval(id);
          return c;
        }
        return c + 1;
      });
    }, 55);
    return () => clearInterval(id);
  }, [text]);
  return (
    <span>
      {text.slice(0, n)}
      <motion.span
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
        style={{ display: "inline-block", marginLeft: 1 }}
      >
        |
      </motion.span>
    </span>
  );
}
