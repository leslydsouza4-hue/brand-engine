import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MousePointer2, Link2, Mail, Play, Check, Download } from "lucide-react";

type TutorialConfig = {
  badge: string;
  title: string;
  body: string;
  cta: string;
  scene: "email" | "shaun";
};

const TUTORIALS: Record<string, TutorialConfig> = {
  "email-templates": {
    badge: "NEW",
    title: "Marketing Email is live",
    body: "Drop a Google Doc link, get a fully designed branded email. Tweak any text or color in one click.",
    cta: "Try it now",
    scene: "email",
  },
  "shaun-thumbnails": {
    badge: "NEW",
    title: "Batch thumbnails with Shaun",
    body: "Pick a Shaun pose, drop in your backgrounds, and export the whole batch as ready-to-post thumbnails.",
    cta: "Start a batch",
    scene: "shaun",
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
                    "radial-gradient(circle, rgba(40,150,251,0.22), transparent 60%)",
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
                    "radial-gradient(circle, rgba(40,150,251,0.18), transparent 60%)",
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
              {config.scene === "shaun" && <ShaunScene />}
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
      {/* pulsing halo BEHIND the button */}
      <motion.span
        animate={{ scale: [1, 1.6, 1], opacity: [0.55, 0, 0.55] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
        style={{
          position: "absolute",
          inset: -10,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(23,217,75,0.55), transparent 65%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <Play
        size={20}
        strokeWidth={2.5}
        fill="#0B1426"
        color="#0B1426"
        style={{ position: "relative", zIndex: 2, marginLeft: 2 }}
      />
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
              background: i === beat ? "#2896FB" : "rgba(248,250,252,0.2)",
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
          border: "1.5px solid rgba(40,150,251,0.6)",
          boxShadow: "0 0 0 4px rgba(40,150,251,0.12)",
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
          width: 52,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
          style={{
            position: "absolute",
            inset: -6,
            borderRadius: 999,
            background:
              "radial-gradient(circle, rgba(40,150,251,0.6), transparent 65%)",
          }}
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 999,
            background:
              "conic-gradient(from 0deg, rgba(40,150,251,0.95), rgba(40,150,251,0.2), rgba(40,150,251,0.95))",
            mask: "radial-gradient(circle, transparent 64%, black 66%)",
            WebkitMask: "radial-gradient(circle, transparent 64%, black 66%)",
          }}
        />
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            background: "linear-gradient(135deg, #2896FB, #0B1426)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 12px rgba(40,150,251,0.55)",
          }}
        >
          <Sparkles size={13} color="#F8FAFC" strokeWidth={2.5} fill="#F8FAFC" />
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
            background: "linear-gradient(135deg, #2896FB 0%, #0B1426 100%)",
            position: "relative",
            display: "flex",
            alignItems: "center",
            padding: "0 12px",
          }}
        >
          <Mail size={14} color="#F8FAFC" strokeWidth={2.5} />
          <div
            style={{
              marginLeft: 6,
              color: "#F8FAFC",
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
              background: "#2896FB",
              color: "#F8FAFC",
              fontSize: 9,
              fontWeight: 800,
              borderRadius: 6,
              display: "inline-block",
              boxShadow: "0 4px 12px rgba(40,150,251,0.45)",
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
  const colors = ["#2896FB", "#7CC2FB", "#FFC328"];

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
            color: colorIdx === 2 ? "#0B1426" : "#F8FAFC",
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

/* ===================== SHAUN SCENE ===================== */

const SHAUN_THUMBS = [
  "ShaunClark_03057_StudioSura-Photoroom.png",
  "ShaunClark_03096_StudioSura-Photoroom.png",
  "ShaunClark_03141_StudioSura-Photoroom.png",
].map((f) => `${import.meta.env.BASE_URL}assets/shaun/${f}`);

const SHAUN_BG_COLORS = [
  "linear-gradient(135deg, #2896FB 0%, #0B1426 100%)",
  "linear-gradient(135deg, #7CC2FB 0%, #2896FB 100%)",
  "linear-gradient(135deg, #FFC328 0%, #FB923C 100%)",
  "linear-gradient(135deg, #17D94B 0%, #0E8E33 100%)",
];

function ShaunScene() {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBeat((b) => (b + 1) % 4), 2600);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, padding: 18 }}>
      <AnimatePresence mode="wait">
        {beat === 0 && <BeatPickShaun key="pick" />}
        {beat === 1 && <BeatBatchUpload key="batch" />}
        {beat === 2 && <BeatComposeBatch key="compose" />}
        {beat === 3 && <BeatExport key="export" />}
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
              background: i === beat ? "#2896FB" : "rgba(248,250,252,0.2)",
              transition: "all 0.3s",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* shared thumbnail-card builder (16:9 with title bar + Shaun silhouette accent) */
function ThumbCard({
  bg,
  label,
  showShaun = true,
  badge,
  style,
}: {
  bg: string;
  label?: string;
  showShaun?: boolean;
  badge?: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "16 / 9",
        borderRadius: 6,
        overflow: "hidden",
        background: bg,
        border: "1px solid rgba(255,255,255,0.12)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        ...style,
      }}
    >
      {/* faint avatar silhouette in the corner to suggest "Shaun" without spamming his face */}
      {showShaun && (
        <div
          style={{
            position: "absolute",
            right: 4,
            bottom: 0,
            width: "32%",
            height: "78%",
            background:
              "radial-gradient(ellipse at 50% 25%, rgba(11,20,38,0.7) 0 40%, transparent 60%), linear-gradient(180deg, transparent 28%, rgba(11,20,38,0.7) 32% 100%)",
            borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
            opacity: 0.85,
          }}
        />
      )}
      {label && (
        <div
          style={{
            position: "relative",
            zIndex: 2,
            padding: "3px 5px",
            fontSize: 7,
            fontWeight: 800,
            letterSpacing: "0.06em",
            color: "#F8FAFC",
            textTransform: "uppercase",
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.45))",
          }}
        >
          {label}
        </div>
      )}
      {badge}
    </div>
  );
}

/* Beat 1: PICK SHAUN — three thumbnail-shaped poses, one selected */
function BeatPickShaun() {
  const [selected, setSelected] = useState(-1);
  useEffect(() => {
    const t = setTimeout(() => setSelected(1), 600);
    return () => clearTimeout(t);
  }, []);
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "rgba(248,250,252,0.55)",
          textTransform: "uppercase",
        }}
      >
        Pick a Shaun
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
          flex: 1,
          alignContent: "center",
        }}
      >
        {SHAUN_THUMBS.map((src, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: selected !== -1 && selected !== i ? 0.35 : 1, y: 0, scale: selected === i ? 1.04 : 1 }}
            transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
            style={{
              position: "relative",
              aspectRatio: "1 / 1.15",
              borderRadius: 8,
              overflow: "hidden",
              background:
                "linear-gradient(135deg, rgba(40,150,251,0.22), rgba(11,20,38,0.55))",
              border:
                selected === i
                  ? "1.5px solid #2896FB"
                  : "1px solid rgba(255,255,255,0.08)",
              boxShadow:
                selected === i ? "0 0 0 3px rgba(40,150,251,0.3), 0 6px 18px rgba(40,150,251,0.35)" : "none",
              transition: "all 0.25s",
            }}
          >
            <img
              src={src}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center 18%",
              }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            {selected === i && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "#2896FB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(40,150,251,0.65)",
                }}
              >
                <Check size={10} color="#0B1426" strokeWidth={3.5} />
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* Beat 2: PLACE Shaun on a single background → completed thumbnail */
function BeatBatchUpload() {
  // re-trigger landing animation each loop
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 600); // shaun lands
    const t2 = setTimeout(() => setStage(2), 1300); // headline appears
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "rgba(248,250,252,0.55)",
          textTransform: "uppercase",
        }}
      >
        Place on background
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* The 16:9 canvas */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: 10,
            overflow: "hidden",
            background:
              "linear-gradient(135deg, #2896FB 0%, #0B1426 100%)",
            border: "1.5px solid rgba(40,150,251,0.5)",
            boxShadow: "0 8px 22px rgba(40,150,251,0.25)",
          }}
        >
          {/* dotted texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "8px 8px",
              opacity: 0.6,
            }}
          />
          {/* Shaun lands from the right — smaller, anchored right-bottom corner */}
          <motion.img
            src={SHAUN_THUMBS[1]}
            alt=""
            initial={{ opacity: 0, x: 60, y: 6 }}
            animate={{
              opacity: stage >= 1 ? 1 : 0,
              x: stage >= 1 ? 0 : 60,
              y: 0,
            }}
            transition={{
              duration: 0.55,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: "absolute",
              right: 4,
              bottom: 0,
              height: "88%",
              width: "30%",
              objectFit: "contain",
              objectPosition: "bottom right",
              filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.5))",
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />

          {/* drop guide that fades once Shaun lands */}
          <motion.div
            initial={{ opacity: 0.65 }}
            animate={{ opacity: stage >= 1 ? 0 : 0.65 }}
            transition={{ duration: 0.35 }}
            style={{
              position: "absolute",
              right: 8,
              bottom: 8,
              top: 8,
              width: "30%",
              border: "1.5px dashed rgba(40,150,251,0.7)",
              borderRadius: 6,
              background: "rgba(40,150,251,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 8,
              fontWeight: 700,
              color: "rgba(40,150,251,0.95)",
              letterSpacing: "0.06em",
            }}
          >
            DROP HERE
          </motion.div>

          {/* Headline block — top-left, above & away from Shaun, with drop shadow */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: stage >= 2 ? 1 : 0, y: stage >= 2 ? 0 : -6 }}
            transition={{ duration: 0.35 }}
            style={{
              position: "absolute",
              left: 12,
              top: 12,
              width: "62%",
              filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.55))",
            }}
          >
            <div
              style={{
                background: "#2896FB",
                color: "#0B1426",
                fontSize: 7,
                fontWeight: 800,
                letterSpacing: "0.08em",
                padding: "2px 6px",
                borderRadius: 3,
                display: "inline-block",
                marginBottom: 5,
                boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
              }}
            >
              FEATURE UPDATE
            </div>
            <div
              style={{
                color: "#F8FAFC",
                fontSize: 14,
                fontWeight: 900,
                lineHeight: 1,
                letterSpacing: "-0.015em",
                textShadow: "0 2px 8px rgba(0,0,0,0.6)",
              }}
            >
              AI Voice
              <br />
              Agent
            </div>
            <div
              style={{
                color: "rgba(248,250,252,0.85)",
                fontSize: 8,
                fontWeight: 600,
                marginTop: 3,
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
              }}
            >
              now in beta
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* Beat 3: ADD TO BATCH QUEUE — finished thumbs stack into a queue list one by one */
function BeatComposeBatch() {
  const QUEUE = [
    { name: "AI_Voice_Agent", bg: "linear-gradient(135deg, #2896FB 0%, #0B1426 100%)" },
    { name: "Workflow_Update", bg: "linear-gradient(135deg, #7CC2FB 0%, #2896FB 100%)" },
    { name: "Q2_Roadmap", bg: "linear-gradient(135deg, #1268C2 0%, #0B1426 100%)" },
    { name: "New_Integrations", bg: "linear-gradient(135deg, #2896FB 0%, #1268C2 100%)" },
  ];
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "rgba(248,250,252,0.55)",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>Batch queue</span>
        <span
          style={{
            color: "#2896FB",
            background: "rgba(40,150,251,0.12)",
            padding: "1px 5px",
            borderRadius: 3,
            fontSize: 8,
            letterSpacing: "0.05em",
          }}
        >
          +ADD MORE
        </span>
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 5,
        }}
      >
        {QUEUE.map((q, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{
              delay: 0.15 + i * 0.32,
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 6px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {/* tiny 16:9 preview */}
            <div
              style={{
                width: 32,
                height: 18,
                borderRadius: 3,
                background: q.bg,
                flexShrink: 0,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* tiny shaun silhouette in corner */}
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  bottom: 0,
                  width: "38%",
                  height: "85%",
                  background:
                    "radial-gradient(ellipse at 50% 30%, rgba(11,20,38,0.85) 0 40%, transparent 60%), linear-gradient(180deg, transparent 30%, rgba(11,20,38,0.85) 35% 100%)",
                  borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
                }}
              />
            </div>
            <div
              style={{
                flex: 1,
                fontSize: 9,
                fontWeight: 700,
                color: "#F8FAFC",
                letterSpacing: "0.02em",
              }}
            >
              {q.name}
              <span style={{ color: "rgba(248,250,252,0.4)" }}>.png</span>
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                delay: 0.45 + i * 0.32,
                type: "spring",
                stiffness: 500,
                damping: 18,
              }}
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "rgba(23,217,75,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Check size={9} color="#17D94B" strokeWidth={3.5} />
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* Beat 4: DOWNLOAD A ZIP — one click, whole batch packaged */
function BeatExport() {
  const FILES = [
    "AI_Voice_Agent.png",
    "Workflow_Update.png",
    "Q2_Roadmap.png",
    "New_Integrations.png",
  ];
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        justifyContent: "center",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "rgba(248,250,252,0.55)",
          textTransform: "uppercase",
        }}
      >
        Download · zip bundle
      </div>

      {/* ZIP card */}
      <motion.div
        initial={{ opacity: 0, y: 8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "relative",
          background: "linear-gradient(135deg, rgba(40,150,251,0.18), rgba(11,20,38,0.6))",
          border: "1.5px solid rgba(40,150,251,0.55)",
          borderRadius: 10,
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          boxShadow: "0 8px 22px rgba(40,150,251,0.25)",
        }}
      >
        {/* zip folder icon */}
        <div
          style={{
            position: "relative",
            width: 36,
            height: 36,
            borderRadius: 6,
            background: "linear-gradient(135deg, #2896FB, #1268C2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 4px 10px rgba(40,150,251,0.5)",
          }}
        >
          <span
            style={{
              color: "#F8FAFC",
              fontSize: 9,
              fontWeight: 900,
              letterSpacing: "0.08em",
            }}
          >
            ZIP
          </span>
          {/* zipper teeth */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: 3,
              bottom: 3,
              width: 1.5,
              transform: "translateX(-50%)",
              background:
                "repeating-linear-gradient(180deg, rgba(11,20,38,0.6) 0 2px, transparent 2px 4px)",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "#F8FAFC",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.01em",
            }}
          >
            shaun-thumbnails.zip
          </div>
          <div
            style={{
              color: "rgba(248,250,252,0.55)",
              fontSize: 8,
              fontWeight: 600,
              marginTop: 2,
            }}
          >
            4 thumbnails · 2.4 MB
          </div>
        </div>
      </motion.div>

      {/* file list peek */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {FILES.map((name, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.25 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 8,
              color: "rgba(248,250,252,0.55)",
              fontWeight: 600,
              fontFamily: "ui-monospace, monospace",
              paddingLeft: 4,
            }}
          >
            <span style={{ color: "rgba(40,150,251,0.7)" }}>└</span>
            {name}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.3 }}
        style={{
          background: "linear-gradient(135deg, #2896FB 0%, #1268C2 100%)",
          color: "#F8FAFC",
          border: "none",
          padding: "9px 12px",
          borderRadius: 8,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: "0.04em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          boxShadow: "0 6px 18px rgba(40,150,251,0.45)",
        }}
      >
        <Download size={13} strokeWidth={2.6} />
        DOWNLOAD ZIP
      </motion.div>
    </motion.div>
  );
}

/* ===================== END SHAUN SCENE ===================== */

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
