import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, MousePointer2, Link2, Mail, Play, Check, Download, Camera, Image as ImageIcon } from "lucide-react";

type TutorialConfig = {
  badge: string;
  title: string;
  body: string;
  cta: string;
  scene: "email" | "shaun" | "army" | "didyouknow" | "bizdev";
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
  "content-army": {
    badge: "NEW",
    title: "Content Army thumbnails",
    body: "Pick your team member, choose a layout, paste a doc, and batch-export branded thumbnails in seconds.",
    cta: "Build a batch",
    scene: "army",
  },
  "did-you-know": {
    badge: "NEW",
    title: "Did You Know thumbnails",
    body: "Pick a person, choose a layout, type your fact, and batch-export branded Did You Know thumbnails.",
    cta: "Start a batch",
    scene: "didyouknow",
  },
  "bizdev-templates": {
    badge: "NEW",
    title: "Virtual Workshop kits",
    body: "Pick a size, fill in the details, drop a guest photo, and export every variant in one go.",
    cta: "Build a kit",
    scene: "bizdev",
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
              {config.scene === "army" && <ArmyScene />}
              {config.scene === "didyouknow" && <DidYouKnowScene />}
              {config.scene === "bizdev" && <BizDevScene />}
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
        {beat === 1 && <BeatScreenshot key="screenshot" />}
        {beat === 2 && <BeatPlaceOnGraphic key="place" />}
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

/* Beat 2: SCREENSHOT a Shaun video — minimal wireframe video player + capture flash */
function BeatScreenshot() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 700); // selection box
    const t2 = setTimeout(() => setStage(2), 1300); // flash
    const t3 = setTimeout(() => setStage(3), 1700); // captured chip
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
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
        Screenshot Shaun's video
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* minimal video player wireframe */}
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            borderRadius: 8,
            border: "1.5px solid rgba(248,250,252,0.18)",
            background: "rgba(11,20,38,0.6)",
            overflow: "hidden",
          }}
        >
          {/* center play/Shaun outline placeholder */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 999,
                border: "1.5px solid rgba(248,250,252,0.35)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play
                size={14}
                color="rgba(248,250,252,0.7)"
                fill="rgba(248,250,252,0.7)"
                strokeWidth={0}
                style={{ marginLeft: 2 }}
              />
            </div>
          </div>

          {/* timeline bar */}
          <div
            style={{
              position: "absolute",
              left: 8,
              right: 8,
              bottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <div
              style={{
                flex: 1,
                height: 3,
                background: "rgba(248,250,252,0.12)",
                borderRadius: 999,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "42%",
                  background: "#2896FB",
                  borderRadius: 999,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 7,
                fontWeight: 700,
                color: "rgba(248,250,252,0.45)",
                fontFamily: "ui-monospace, monospace",
              }}
            >
              0:14
            </span>
          </div>

          {/* dashed selection marquee */}
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{
              opacity: stage >= 1 ? 1 : 0,
              scale: stage >= 1 ? 1 : 1.05,
            }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              inset: 8,
              border: "1.5px dashed #2896FB",
              borderRadius: 4,
              boxShadow: "0 0 0 1px rgba(40,150,251,0.15)",
            }}
          >
            {/* corner ticks */}
            {([
              [0, 0],
              [1, 0],
              [0, 1],
              [1, 1],
            ] as const).map(([x, y], i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  width: 6,
                  height: 6,
                  background: "#2896FB",
                  borderRadius: 1,
                  left: x ? "auto" : -3,
                  right: x ? -3 : "auto",
                  top: y ? "auto" : -3,
                  bottom: y ? -3 : "auto",
                }}
              />
            ))}
          </motion.div>

          {/* shutter flash */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: stage === 2 ? 0.85 : 0 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              inset: 0,
              background: "#F8FAFC",
              pointerEvents: "none",
            }}
          />

          {/* "captured" chip */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{
              opacity: stage >= 3 ? 1 : 0,
              y: stage >= 3 ? 0 : -6,
            }}
            transition={{ duration: 0.3 }}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              background: "#2896FB",
              color: "#0B1426",
              fontSize: 8,
              fontWeight: 800,
              letterSpacing: "0.06em",
              padding: "3px 6px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
              boxShadow: "0 4px 10px rgba(40,150,251,0.5)",
            }}
          >
            <Camera size={9} strokeWidth={2.6} />
            CAPTURED
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* (legacy beat — kept for reference, no longer rendered) */
function _BeatBatchUploadLegacy() {
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

/* Beat 3: SKELETON — wireframe text + silhouette placeholders on the branded graphic */
function BeatPlaceOnGraphic() {
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
        Build the layout
      </div>
      <style>{`
        @keyframes shaunSkelShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -100% 0; }
        }
        @keyframes shaunSkelScan {
          0% { transform: translateX(-30%); opacity: 0; }
          12% { opacity: 1; }
          88% { opacity: 1; }
          100% { transform: translateX(110%); opacity: 0; }
        }
        @keyframes shaunSkelPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
        .skel-bar {
          position: relative;
          background: rgba(248,250,252,0.10);
          border-radius: 4px;
          overflow: hidden;
        }
        .skel-bar::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            100deg,
            transparent 20%,
            rgba(248,250,252,0.18) 38%,
            rgba(124,194,251,0.55) 50%,
            rgba(248,250,252,0.18) 62%,
            transparent 80%
          );
          background-size: 220% 100%;
          background-repeat: no-repeat;
          animation: shaunSkelShimmer 1.8s ease-in-out infinite;
        }
        .skel-blob {
          position: relative;
          background: rgba(248,250,252,0.10);
          overflow: hidden;
        }
        .skel-blob::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            100deg,
            transparent 20%,
            rgba(248,250,252,0.18) 38%,
            rgba(124,194,251,0.55) 50%,
            rgba(248,250,252,0.18) 62%,
            transparent 80%
          );
          background-size: 220% 100%;
          background-repeat: no-repeat;
          animation: shaunSkelShimmer 1.8s ease-in-out infinite;
        }
        .skel-corner {
          position: absolute;
          width: 8px;
          height: 8px;
          border: 1.5px solid rgba(40,150,251,0.85);
          animation: shaunSkelPulse 1.8s ease-in-out infinite;
        }
      `}</style>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* HighLevel branded canvas */}
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
            display: "flex",
            alignItems: "stretch",
            padding: "14px 14px",
            gap: 10,
          }}
        >
          {/* dot texture */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "8px 8px",
              opacity: 0.45,
              pointerEvents: "none",
            }}
          />
          {/* faint vertical guide line down the middle */}
          <div
            style={{
              position: "absolute",
              top: 6,
              bottom: 6,
              left: "60%",
              width: 1,
              background:
                "repeating-linear-gradient(180deg, rgba(40,150,251,0.35) 0 3px, transparent 3px 6px)",
              opacity: 0.6,
              pointerEvents: "none",
            }}
          />
          {/* corner registration marks */}
          <div className="skel-corner" style={{ top: 5, left: 5, borderRight: "none", borderBottom: "none" }} />
          <div className="skel-corner" style={{ top: 5, right: 5, borderLeft: "none", borderBottom: "none" }} />
          <div className="skel-corner" style={{ bottom: 5, left: 5, borderRight: "none", borderTop: "none" }} />
          <div className="skel-corner" style={{ bottom: 5, right: 5, borderLeft: "none", borderTop: "none" }} />

          {/* sweeping scan line — premium "loading" feel */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: 0,
              width: "20%",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(124,194,251,0.18) 45%, rgba(40,150,251,0.45) 50%, rgba(124,194,251,0.18) 55%, transparent 100%)",
              animation: "shaunSkelScan 2.6s ease-in-out infinite",
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />

          {/* LEFT — text skeleton stack */}
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 6,
              maxWidth: "58%",
              zIndex: 1,
            }}
          >
            {/* logo + badge row */}
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.3 }}
              style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}
            >
              <div
                className="skel-blob"
                style={{ width: 12, height: 12, borderRadius: 3 }}
              />
              <div
                className="skel-bar"
                style={{ height: 6, width: 38, borderRadius: 999 }}
              />
            </motion.div>
            {/* headline bar 1 — grows in width */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "92%", opacity: 1 }}
              transition={{ delay: 0.18, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="skel-bar"
              style={{ height: 14 }}
            />
            {/* headline bar 2 — grows in width */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "68%", opacity: 1 }}
              transition={{ delay: 0.32, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="skel-bar"
              style={{ height: 14 }}
            />
            {/* subtext bar */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "44%", opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="skel-bar"
              style={{ height: 5, marginTop: 4 }}
            />
            {/* CTA button skeleton */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.65, duration: 0.35 }}
              className="skel-bar"
              style={{ height: 14, width: 56, borderRadius: 999, marginTop: 6 }}
            />
          </div>

          {/* RIGHT — Shaun silhouette skeleton (proper figure proportions) */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "relative",
              width: "32%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 0,
              zIndex: 1,
            }}
          >
            {/* head */}
            <div
              className="skel-blob"
              style={{
                width: "48%",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                marginBottom: -3,
              }}
            />
            {/* neck */}
            <div
              className="skel-blob"
              style={{
                width: "16%",
                height: 6,
                borderRadius: 2,
              }}
            />
            {/* shoulders + torso (curved trapezoid via radius) */}
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "55%",
                marginTop: -2,
              }}
            >
              <div
                className="skel-blob"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "55% 55% 14px 14px / 90% 90% 14px 14px",
                }}
              />
              {/* tiny "logo patch" on shirt for character */}
              <div
                className="skel-bar"
                style={{
                  position: "absolute",
                  top: "38%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 14,
                  height: 5,
                  borderRadius: 2,
                  opacity: 0.6,
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* legacy — kept for reference, not rendered */
function _BeatNextStepsLegacy() {
  const STEPS = [
    { n: "1", text: "Pick the Shaun pose that fits your message" },
    { n: "2", text: "Screenshot the moment from his video" },
    { n: "3", text: "Drop it onto the HighLevel graphic" },
    { n: "4", text: "Repeat for each thumbnail you need" },
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
        }}
      >
        What to do next
      </div>
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 7,
        }}
      >
        {STEPS.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.12, duration: 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 999,
                background: "rgba(40,150,251,0.15)",
                border: "1px solid rgba(40,150,251,0.5)",
                color: "#2896FB",
                fontSize: 9,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {s.n}
            </div>
            <div
              style={{
                color: "#F8FAFC",
                fontSize: 10,
                fontWeight: 600,
                lineHeight: 1.25,
                letterSpacing: "0.005em",
              }}
            >
              {s.text}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* (legacy beat — kept for reference, no longer rendered) */
function _BeatComposeBatchLegacy() {
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
function BeatExport({
  zipName = "shaun-thumbnails.zip",
  subtitle = "4 thumbnails · 2.4 MB",
}: { zipName?: string; subtitle?: string } = {}) {
  // stages: 0 init → 1 thumbs added → 2 zipping (collapse into ZIP) → 3 download glow
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 200);  // batch list appears
    const t2 = setTimeout(() => setStage(2), 1100); // collapse into zip
    const t3 = setTimeout(() => setStage(3), 1750); // download pulse
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const THUMBS = [
    "linear-gradient(135deg, #2896FB 0%, #0B1426 100%)",
    "linear-gradient(135deg, #7CC2FB 0%, #2896FB 100%)",
    "linear-gradient(135deg, #1268C2 0%, #0B1426 100%)",
    "linear-gradient(135deg, #2896FB 0%, #1268C2 100%)",
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
        <span>
          {stage < 2 ? "Adding to batch" : stage < 3 ? "Zipping…" : "Ready"}
        </span>
        <span
          style={{
            color: "#2896FB",
            fontSize: 8,
            letterSpacing: "0.05em",
          }}
        >
          {stage < 2 ? "+4" : "1 file"}
        </span>
      </div>

      {/* main stage — batch list collapses into the ZIP card */}
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* ZIP target (centered, fades in once collapse starts) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{
            opacity: stage >= 2 ? 1 : 0,
            scale: stage >= 2 ? 1 : 0.85,
          }}
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
            boxShadow:
              stage >= 3
                ? "0 0 24px rgba(40,150,251,0.6), 0 8px 22px rgba(40,150,251,0.35)"
                : "0 8px 22px rgba(40,150,251,0.25)",
            width: "85%",
            transition: "box-shadow 0.3s",
          }}
        >
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
              {zipName}
            </div>
            <div
              style={{
                color: "rgba(248,250,252,0.55)",
                fontSize: 8,
                fontWeight: 600,
                marginTop: 2,
              }}
            >
              {subtitle}
            </div>
          </div>
          {/* check pop once ready */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: stage >= 3 ? 1 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 18 }}
            style={{
              width: 16,
              height: 16,
              borderRadius: 999,
              background: "#17D94B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 8px rgba(23,217,75,0.7)",
              flexShrink: 0,
            }}
          >
            <Check size={10} color="#0B1426" strokeWidth={3.5} />
          </motion.div>
        </motion.div>

        {/* Batch thumbnails — appear in a row, then fly into the ZIP */}
        {THUMBS.map((bg, i) => {
          const offsetX = (i - 1.5) * 38; // initial spread
          const showInBatch = stage === 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: offsetX, y: 14, scale: 0.6 }}
              animate={
                stage === 0
                  ? { opacity: 0, x: offsetX, y: 14, scale: 0.6 }
                  : showInBatch
                    ? { opacity: 1, x: offsetX, y: 0, scale: 1 }
                    : // collapse into the zip (center)
                      { opacity: 0, x: 0, y: 0, scale: 0.4 }
              }
              transition={{
                delay: stage === 1 ? 0.05 + i * 0.08 : 0,
                duration: 0.42,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{
                position: "absolute",
                width: 34,
                height: 20,
                borderRadius: 4,
                background: bg,
                border: "1.5px solid rgba(40,150,251,0.7)",
                boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
                overflow: "hidden",
              }}
            >
              {/* tiny silhouette */}
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
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{
          opacity: stage >= 3 ? 1 : 0.35,
          y: 0,
          scale: stage >= 3 ? [1, 1.04, 1] : 1,
        }}
        transition={{
          duration: stage >= 3 ? 0.6 : 0.3,
          repeat: stage >= 3 ? Infinity : 0,
          repeatDelay: 0.4,
        }}
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

/* ===================== CONTENT ARMY SCENE ===================== */
const ARMY_INITIALS = ["BS", "AG", "TD", "UM"];

function ArmyScene() {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBeat((b) => (b + 1) % 5), 2400);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18 }}>
      <AnimatePresence mode="wait">
        {beat === 0 && <BeatArmyPick key="pick" />}
        {beat === 1 && <BeatArmyLayout key="layout" />}
        {beat === 2 && <BeatArmyDoc key="doc" />}
        {beat === 3 && <BeatArmyHeadline key="headline" />}
        {beat === 4 && (
          <BeatExport
            key="export"
            zipName="content-army-thumbnails.zip"
            subtitle="4 thumbnails · 2.4 MB"
          />
        )}
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
        {[0, 1, 2, 3, 4].map((i) => (
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

/* Beat 1 — sleek initial boxes, one selected */
function BeatArmyPick({
  initials = ARMY_INITIALS,
  selectedIdx = 2,
}: { initials?: string[]; selectedIdx?: number } = {}) {
  const [picked, setPicked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPicked(true), 700);
    return () => clearTimeout(t);
  }, []);
  const SELECTED = selectedIdx;
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
          display: "grid",
          gridTemplateColumns: `repeat(${initials.length}, 1fr)`,
          gap: 10,
          width: "100%",
        }}
      >
        {initials.map((label, i) => {
          const selected = i === SELECTED && picked;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.07, duration: 0.3 }}
              style={{
                position: "relative",
                aspectRatio: "1 / 1",
                borderRadius: 10,
                background: PANEL_BG,
                backdropFilter: "blur(8px)",
                border: selected
                  ? "1.5px solid #2896FB"
                  : PANEL_BORDER,
                boxShadow: selected
                  ? "0 0 0 4px rgba(40,150,251,0.18), 0 8px 22px rgba(40,150,251,0.25)"
                  : "0 4px 12px rgba(0,0,0,0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: selected ? "#F8FAFC" : "rgba(248,250,252,0.7)",
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: "0.04em",
                fontFamily: "ui-monospace, monospace",
                transition: "border-color 0.25s, box-shadow 0.25s, color 0.25s",
              }}
            >
              {label}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* Beat 2 — Layout selector (3 mini thumbnail previews, one selected) */
function BeatArmyLayout() {
  const [picked, setPicked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPicked(true), 700);
    return () => clearTimeout(t);
  }, []);
  // Matches ContentArmyWorkspace LAYOUT_PRESETS:
  // classic: person right, text bottom-centered
  // left: person left, text on right
  // right: person right, text on left
  const LAYOUTS: Array<{ key: string; label: string }> = [
    { key: "classic", label: "Classic" },
    { key: "left", label: "Left" },
    { key: "right", label: "Right" },
  ];
  const SELECTED = 1;
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
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
          width: "100%",
        }}
      >
        {LAYOUTS.map((l, i) => {
          const selected = i === SELECTED && picked;
          return (
            <motion.div
              key={l.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.08, duration: 0.3 }}
              style={{
                position: "relative",
                aspectRatio: "16 / 10",
                borderRadius: 8,
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, rgba(40,150,251,0.45) 0%, rgba(11,20,38,0.85) 100%)",
                border: selected
                  ? "1.5px solid #2896FB"
                  : "1px solid rgba(255,255,255,0.12)",
                boxShadow: selected
                  ? "0 0 0 4px rgba(40,150,251,0.18), 0 8px 22px rgba(40,150,251,0.25)"
                  : "0 4px 12px rgba(0,0,0,0.25)",
                transition: "border-color 0.25s, box-shadow 0.25s",
              }}
            >
              {/* dot texture */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "5px 5px",
                  opacity: 0.5,
                }}
              />

              {/* PERSON puck */}
              <div
                style={{
                  position: "absolute",
                  width: "32%",
                  aspectRatio: "1 / 1",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 35% 30%, rgba(248,250,252,0.55), rgba(248,250,252,0.18) 70%)",
                  ...(l.key === "classic"
                    ? { right: "8%", top: "50%", transform: "translateY(-50%)" }
                    : l.key === "left"
                      ? { left: "8%", top: "50%", transform: "translateY(-50%)" }
                      : { right: "8%", top: "50%", transform: "translateY(-50%)" }),
                }}
              />

              {/* TEXT bars */}
              {l.key === "classic" ? (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: "12%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <div
                    style={{
                      width: "60%",
                      height: 4,
                      background: "rgba(248,250,252,0.85)",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: "40%",
                      height: 2.5,
                      background: "rgba(248,250,252,0.45)",
                      borderRadius: 2,
                    }}
                  />
                </div>
              ) : (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "48%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 3,
                    ...(l.key === "left"
                      ? { right: "6%" }
                      : { left: "6%" }),
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: 4,
                      background: "rgba(248,250,252,0.85)",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: "75%",
                      height: 2.5,
                      background: "rgba(248,250,252,0.45)",
                      borderRadius: 2,
                    }}
                  />
                  <div
                    style={{
                      width: "55%",
                      height: 2.5,
                      background: "rgba(248,250,252,0.45)",
                      borderRadius: 2,
                    }}
                  />
                </div>
              )}

              {/* label */}
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: 6,
                  fontSize: 7,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: selected ? "#2896FB" : "rgba(248,250,252,0.7)",
                  textTransform: "uppercase",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  transition: "color 0.25s",
                }}
              >
                {l.label}
              </div>

              {/* selected check */}
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: "#2896FB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 8px rgba(40,150,251,0.8)",
                  }}
                >
                  <Check size={8} color="#0B1426" strokeWidth={4} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* Beat 3 — Support Doc URL paste (sleek single input, like Email) */
function BeatArmyDoc() {
  const url = "docs.gohighlevel.com/voice-agent";
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

/* Beat 4 — Headline appearing as skeleton, centered bottom on the branded thumbnail */
function BeatArmyHeadline() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 500);
    const t2 = setTimeout(() => setStage(2), 1100);
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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <style>{`
        @keyframes armyShimmer2 {
          0% { background-position: 200% 0; }
          100% { background-position: -100% 0; }
        }
        .army-skel2 {
          position: relative;
          background: rgba(248,250,252,0.18);
          overflow: hidden;
        }
        .army-skel2::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            100deg,
            transparent 20%,
            rgba(248,250,252,0.25) 38%,
            rgba(124,194,251,0.6) 50%,
            rgba(248,250,252,0.25) 62%,
            transparent 80%
          );
          background-size: 220% 100%;
          background-repeat: no-repeat;
          animation: armyShimmer2 1.5s ease-in-out infinite;
        }
      `}</style>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 10,
          overflow: "hidden",
          background: "linear-gradient(135deg, #2896FB 0%, #0B1426 100%)",
          border: "1.5px solid rgba(40,150,251,0.5)",
          boxShadow: "0 8px 22px rgba(40,150,251,0.25)",
        }}
      >
        {/* dot texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
            opacity: 0.5,
          }}
        />
        {/* HighLevel mark — top-left */}
        <div
          style={{
            position: "absolute",
            top: 8,
            left: 10,
            color: "#F8FAFC",
            fontSize: 8,
            fontWeight: 800,
            letterSpacing: "0.12em",
            opacity: 0.85,
          }}
        >
          HIGHLEVEL
        </div>

        {/* headline skeleton — centered bottom */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{
            opacity: stage >= 1 ? 1 : 0,
            y: stage >= 1 ? 0 : 6,
          }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 16,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 5,
            padding: "0 16px",
          }}
        >
          <div
            className="army-skel2"
            style={{
              height: 10,
              width: "70%",
              borderRadius: 3,
            }}
          />
          <motion.div
            className="army-skel2"
            initial={{ opacity: 0, y: 4 }}
            animate={{
              opacity: stage >= 2 ? 1 : 0,
              y: stage >= 2 ? 0 : 4,
            }}
            transition={{ duration: 0.35 }}
            style={{
              height: 6,
              width: "45%",
              borderRadius: 3,
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
}


/* ===================== END CONTENT ARMY SCENE ===================== */

/* ===================== DID YOU KNOW SCENE ===================== */

const DYK_INITIALS = ["AG", "BS", "UM"];

function DidYouKnowScene() {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBeat((b) => (b + 1) % 4), 2400);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18 }}>
      <AnimatePresence mode="wait">
        {beat === 0 && (
          <BeatArmyPick key="pick" initials={DYK_INITIALS} selectedIdx={0} />
        )}
        {beat === 1 && <BeatDykLayout key="layout" />}
        {beat === 2 && <BeatDykHeadline key="headline" />}
        {beat === 3 && (
          <BeatExport
            key="export"
            zipName="did-you-know.zip"
            subtitle="4 thumbnails · 2.1 MB"
          />
        )}
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

/* DYK Beat 2 — Layout selector (only 2 options: text-left, text-right) */
function BeatDykLayout() {
  const [picked, setPicked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPicked(true), 700);
    return () => clearTimeout(t);
  }, []);
  const LAYOUTS: Array<{ key: "text-left" | "text-right"; label: string }> = [
    { key: "text-left", label: "Text Left" },
    { key: "text-right", label: "Text Right" },
  ];
  const SELECTED = 0;
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
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          width: "100%",
        }}
      >
        {LAYOUTS.map((l, i) => {
          const selected = i === SELECTED && picked;
          const personOnRight = l.key === "text-left";
          return (
            <motion.div
              key={l.key}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.08, duration: 0.3 }}
              style={{
                position: "relative",
                aspectRatio: "16 / 10",
                borderRadius: 8,
                overflow: "hidden",
                background:
                  "linear-gradient(135deg, rgba(40,150,251,0.45) 0%, rgba(11,20,38,0.85) 100%)",
                border: selected
                  ? "1.5px solid #2896FB"
                  : "1px solid rgba(255,255,255,0.12)",
                boxShadow: selected
                  ? "0 0 0 4px rgba(40,150,251,0.18), 0 8px 22px rgba(40,150,251,0.25)"
                  : "0 4px 12px rgba(0,0,0,0.25)",
                transition: "border-color 0.25s, box-shadow 0.25s",
              }}
            >
              {/* dot texture */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
                  backgroundSize: "5px 5px",
                  opacity: 0.5,
                }}
              />

              {/* PERSON puck */}
              <div
                style={{
                  position: "absolute",
                  width: "32%",
                  aspectRatio: "1 / 1",
                  borderRadius: "50%",
                  background:
                    "radial-gradient(circle at 35% 30%, rgba(248,250,252,0.55), rgba(248,250,252,0.18) 70%)",
                  top: "50%",
                  transform: "translateY(-50%)",
                  ...(personOnRight ? { right: "8%" } : { left: "8%" }),
                }}
              />

              {/* TEXT bars on opposite side */}
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "48%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 3,
                  ...(personOnRight ? { left: "6%" } : { right: "6%" }),
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 4,
                    background: "rgba(248,250,252,0.85)",
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: "75%",
                    height: 2.5,
                    background: "rgba(248,250,252,0.45)",
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    width: "55%",
                    height: 2.5,
                    background: "rgba(248,250,252,0.45)",
                    borderRadius: 2,
                  }}
                />
              </div>

              {/* label */}
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: 6,
                  fontSize: 7,
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  color: selected ? "#2896FB" : "rgba(248,250,252,0.7)",
                  textTransform: "uppercase",
                  textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  transition: "color 0.25s",
                }}
              >
                {l.label}
              </div>

              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: "#2896FB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 8px rgba(40,150,251,0.8)",
                  }}
                >
                  <Check size={8} color="#0B1426" strokeWidth={4} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* DYK Beat 3 — Left-aligned headline + subtext skeleton on branded canvas */
function BeatDykHeadline() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 1000);
    const t3 = setTimeout(() => setStage(3), 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
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
      <style>{`
        @keyframes dykShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -100% 0; }
        }
        .dyk-skel {
          position: relative;
          background: rgba(248,250,252,0.18);
          overflow: hidden;
        }
        .dyk-skel::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            100deg,
            transparent 20%,
            rgba(248,250,252,0.25) 38%,
            rgba(124,194,251,0.6) 50%,
            rgba(248,250,252,0.25) 62%,
            transparent 80%
          );
          background-size: 220% 100%;
          background-repeat: no-repeat;
          animation: dykShimmer 1.5s ease-in-out infinite;
        }
      `}</style>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 10,
          overflow: "hidden",
          background: "linear-gradient(135deg, #2896FB 0%, #0B1426 100%)",
          border: "1.5px solid rgba(40,150,251,0.5)",
          boxShadow: "0 8px 22px rgba(40,150,251,0.25)",
        }}
      >
        {/* dot texture */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
            opacity: 0.5,
          }}
        />
        {/* DID YOU KNOW chip — top-left */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 12,
            background: "#FFC328",
            color: "#0B1426",
            fontSize: 7,
            fontWeight: 800,
            letterSpacing: "0.12em",
            padding: "2px 6px",
            borderRadius: 3,
            boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
          }}
        >
          DID YOU KNOW?
        </div>

        {/* left-aligned skeleton stack */}
        <div
          style={{
            position: "absolute",
            left: 14,
            top: "50%",
            transform: "translateY(-50%)",
            width: "62%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 6,
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{
              opacity: stage >= 1 ? 1 : 0,
              x: stage >= 1 ? 0 : -8,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="dyk-skel"
            style={{ height: 11, width: "100%", borderRadius: 3 }}
          />
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{
              opacity: stage >= 2 ? 1 : 0,
              x: stage >= 2 ? 0 : -8,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="dyk-skel"
            style={{ height: 11, width: "75%", borderRadius: 3 }}
          />
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{
              opacity: stage >= 3 ? 1 : 0,
              x: stage >= 3 ? 0 : -8,
            }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="dyk-skel"
            style={{
              height: 6,
              width: "55%",
              borderRadius: 3,
              marginTop: 2,
              opacity: 0.7,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}

/* ===================== END DID YOU KNOW SCENE ===================== */

/* ===================== BIZDEV / VIRTUAL WORKSHOP SCENE ===================== */

function BizDevScene() {
  const [beat, setBeat] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setBeat((b) => (b + 1) % 5), 2600);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ position: "absolute", inset: 0, padding: 18 }}>
      <AnimatePresence mode="wait">
        {beat === 0 && <BeatBizSize key="size" />}
        {beat === 1 && <BeatBizText key="text" />}
        {beat === 2 && <BeatBizUpload key="upload" />}
        {beat === 3 && <BeatBizVariants key="variants" />}
        {beat === 4 && <BeatBizGrid key="grid" />}
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
        {[0, 1, 2, 3, 4].map((i) => (
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

/* Beat 1 — SIZE selector (3 size cards, accurate aspect ratios) */
function BeatBizSize() {
  const [picked, setPicked] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setPicked(true), 700);
    return () => clearTimeout(t);
  }, []);
  const SIZES = [
    { key: "horizontal", label: "Horizontal", dim: "1920×1080", w: 80, h: 45 },
    { key: "square", label: "Square", dim: "1080×1080", w: 50, h: 50 },
    { key: "portrait", label: "Portrait", dim: "1080×1350", w: 40, h: 50 },
  ];
  const SELECTED = 0;
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
      }}
    >
      {SIZES.map((s, i) => {
        const selected = i === SELECTED && picked;
        return (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.08, duration: 0.3 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 5,
            }}
          >
            <div
              style={{
                position: "relative",
                width: s.w,
                height: s.h,
                borderRadius: 4,
                background: selected
                  ? "linear-gradient(135deg, rgba(40,150,251,0.55), rgba(11,20,38,0.85))"
                  : "rgba(255,255,255,0.06)",
                border: selected
                  ? "1.5px solid #2896FB"
                  : "1.5px solid rgba(255,255,255,0.18)",
                boxShadow: selected
                  ? "0 0 0 4px rgba(40,150,251,0.18), 0 6px 18px rgba(40,150,251,0.3)"
                  : "0 4px 10px rgba(0,0,0,0.25)",
                transition: "all 0.3s",
              }}
            >
              {selected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  style={{
                    position: "absolute",
                    top: -5,
                    right: -5,
                    width: 14,
                    height: 14,
                    borderRadius: 999,
                    background: "#2896FB",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #0B1426",
                  }}
                >
                  <Check size={7} color="#0B1426" strokeWidth={4} />
                </motion.div>
              )}
            </div>
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.06em",
                color: selected ? "#2896FB" : "rgba(248,250,252,0.7)",
                textTransform: "uppercase",
                transition: "color 0.25s",
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 7,
                color: "rgba(248,250,252,0.4)",
                fontFamily: "ui-monospace, monospace",
                marginTop: -2,
              }}
            >
              {s.dim}
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* Beat 2 — Text fields filling in: HEADLINE / GUEST / CTA (skeleton) */
function BeatBizText() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 350);
    const t2 = setTimeout(() => setStage(2), 950);
    const t3 = setTimeout(() => setStage(3), 1550);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);
  const FIELDS = [
    { label: "HEADLINE", text: "AI Voice Agents Live" },
    { label: "GUEST", text: "Robin Alex" },
    { label: "CTA", text: "Save Your Seat →" },
  ];
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 8,
      }}
    >
      {FIELDS.map((f, i) => {
        const filled = stage >= i + 1;
        return (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 + i * 0.08, duration: 0.3 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 10px",
              borderRadius: 8,
              background: PANEL_BG,
              border: filled
                ? "1px solid rgba(40,150,251,0.55)"
                : PANEL_BORDER,
              boxShadow: filled
                ? "0 0 0 3px rgba(40,150,251,0.12)"
                : "none",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          >
            <div
              style={{
                fontSize: 8,
                fontWeight: 800,
                letterSpacing: "0.1em",
                color: filled ? "#2896FB" : "rgba(248,250,252,0.4)",
                width: 56,
                flexShrink: 0,
                textTransform: "uppercase",
                transition: "color 0.3s",
              }}
            >
              {f.label}
            </div>
            <div
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: 600,
                color: "#F8FAFC",
                fontFamily: "ui-monospace, monospace",
                minHeight: 14,
              }}
            >
              {filled ? <Typewriter text={f.text} /> : (
                <div
                  style={{
                    height: 5,
                    width: "60%",
                    background: "rgba(248,250,252,0.12)",
                    borderRadius: 2,
                  }}
                />
              )}
            </div>
            {filled && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 999,
                  background: "#17D94B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Check size={8} color="#0B1426" strokeWidth={4} />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </motion.div>
  );
}

/* Beat 3 — Guest image upload (drop zone → progress → done) */
function BeatBizUpload() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 350);
    const t2 = setTimeout(() => setStage(2), 1700);
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
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          borderRadius: 10,
          border: stage >= 2
            ? "1.5px solid rgba(23,217,75,0.6)"
            : "1.5px dashed rgba(40,150,251,0.65)",
          background: stage >= 2
            ? "rgba(23,217,75,0.06)"
            : "rgba(40,150,251,0.06)",
          boxShadow: stage >= 2
            ? "0 0 0 4px rgba(23,217,75,0.12)"
            : "0 0 0 4px rgba(40,150,251,0.10)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          position: "relative",
          transition: "all 0.35s",
          overflow: "hidden",
        }}
      >
        {/* Stage 0: idle drop zone */}
        {stage === 0 && (
          <>
            <UploadCloudFallback />
            <div
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: "rgba(248,250,252,0.65)",
                letterSpacing: "0.04em",
              }}
            >
              Drop guest photo here
            </div>
          </>
        )}

        {/* Stage 1: uploading — file card with progress bar */}
        {stage === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              width: "75%",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  background: "linear-gradient(135deg, #2896FB, #1268C2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 8px rgba(40,150,251,0.4)",
                }}
              >
                <ImageIcon size={14} color="#F8FAFC" strokeWidth={2.4} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: "#F8FAFC",
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "ui-monospace, monospace",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  robin-alex.jpg
                </div>
                <div
                  style={{
                    color: "rgba(248,250,252,0.45)",
                    fontSize: 8,
                    marginTop: 1,
                  }}
                >
                  1.4 MB
                </div>
              </div>
            </div>
            <div
              style={{
                height: 4,
                background: "rgba(255,255,255,0.08)",
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{
                  height: "100%",
                  background: "linear-gradient(90deg, #2896FB, #7CC2FB)",
                  boxShadow: "0 0 8px rgba(40,150,251,0.5)",
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Stage 2: success — guest card preview */}
        {stage === 2 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 30%, rgba(248,250,252,0.85), rgba(124,194,251,0.4) 70%)",
                border: "2px solid rgba(23,217,75,0.7)",
                boxShadow: "0 0 0 4px rgba(23,217,75,0.18), 0 6px 14px rgba(0,0,0,0.4)",
                position: "relative",
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 16, delay: 0.15 }}
                style={{
                  position: "absolute",
                  bottom: -3,
                  right: -3,
                  width: 18,
                  height: 18,
                  borderRadius: 999,
                  background: "#17D94B",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #0B1426",
                }}
              >
                <Check size={9} color="#0B1426" strokeWidth={4} />
              </motion.div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div
                style={{
                  fontSize: 7,
                  fontWeight: 800,
                  color: "#00B2A9",
                  letterSpacing: "0.12em",
                }}
              >
                GUEST:
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: "#F8FAFC",
                  letterSpacing: "0.02em",
                }}
              >
                ROBIN ALEX
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* tiny upload icon stand-in */
function UploadCloudFallback() {
  return (
    <motion.div
      animate={{ y: [0, -3, 0] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      style={{
        width: 32,
        height: 32,
        borderRadius: "50%",
        background: "rgba(40,150,251,0.18)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <ImageIcon size={16} color="#2896FB" strokeWidth={2.4} />
    </motion.div>
  );
}

/* Beat 4 — Variant chips (Dates, CTA, Replays, Day 1, Day 2), one selected */
function BeatBizVariants() {
  const [selectedIdx, setSelectedIdx] = useState<number>(-1);
  useEffect(() => {
    // sweep through the chips landing on CTA (index 1)
    const order = [0, 1, 2, 3, 4, 1];
    let i = 0;
    setSelectedIdx(order[0]);
    const id = setInterval(() => {
      i++;
      if (i >= order.length) {
        clearInterval(id);
        return;
      }
      setSelectedIdx(order[i]);
    }, 380);
    return () => clearInterval(id);
  }, []);
  const VARIANTS = ["Dates", "CTA", "Replays", "Day 1", "Day 2"];
  return (
    <motion.div
      {...sceneAnim}
      style={{
        position: "absolute",
        inset: 18,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "rgba(248,250,252,0.55)",
          textTransform: "uppercase",
        }}
      >
        Pick variants
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: 6,
          width: "100%",
        }}
      >
        {VARIANTS.map((v, i) => {
          const active = i === selectedIdx;
          return (
            <motion.div
              key={v}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.06, duration: 0.3 }}
              style={{
                padding: "6px 11px",
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.04em",
                background: active
                  ? "linear-gradient(135deg, #2896FB, #1268C2)"
                  : "rgba(255,255,255,0.06)",
                color: active ? "#F8FAFC" : "rgba(248,250,252,0.7)",
                border: active
                  ? "1px solid rgba(124,194,251,0.6)"
                  : "1px solid rgba(255,255,255,0.12)",
                boxShadow: active
                  ? "0 4px 12px rgba(40,150,251,0.5), 0 0 0 3px rgba(40,150,251,0.18)"
                  : "none",
                transition: "all 0.25s",
              }}
            >
              {v}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* Beat 5 — Grid of all variants + Download All button */
function BeatBizGrid() {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 1100);
    return () => clearTimeout(t1);
  }, []);
  const TILES = ["Dates", "CTA", "Replays", "Day 1", "Day 2"];
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
          fontSize: 8,
          fontWeight: 800,
          letterSpacing: "0.12em",
          color: "rgba(248,250,252,0.55)",
          textTransform: "uppercase",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>All variants</span>
        <span style={{ color: "#2896FB", fontSize: 8 }}>5 ready</span>
      </div>
      {/* grid */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 5,
        }}
      >
        {TILES.map((label, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: i * 0.08,
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            style={{
              position: "relative",
              aspectRatio: "16 / 9",
              borderRadius: 5,
              background:
                "linear-gradient(135deg, rgba(40,150,251,0.45), rgba(11,20,38,0.85))",
              border: "1px solid rgba(40,150,251,0.4)",
              boxShadow: "0 3px 8px rgba(0,0,0,0.3)",
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: "0 0 3px 0",
            }}
          >
            {/* dot texture */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.08) 1px, transparent 1px)",
                backgroundSize: "4px 4px",
                opacity: 0.5,
              }}
            />
            {/* mini headline bar */}
            <div
              style={{
                position: "absolute",
                left: "10%",
                right: "10%",
                top: "30%",
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <div
                style={{
                  height: 3,
                  background: "rgba(248,250,252,0.85)",
                  borderRadius: 1,
                }}
              />
              <div
                style={{
                  height: 2,
                  width: "65%",
                  background: "rgba(248,250,252,0.45)",
                  borderRadius: 1,
                }}
              />
            </div>
            <div
              style={{
                position: "relative",
                zIndex: 2,
                fontSize: 6,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: "#FFC328",
                textTransform: "uppercase",
                textShadow: "0 1px 2px rgba(0,0,0,0.6)",
              }}
            >
              {label}
            </div>
          </motion.div>
        ))}
      </div>
      {/* Download All button */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{
          opacity: stage >= 1 ? 1 : 0,
          y: stage >= 1 ? 0 : 6,
        }}
        transition={{ duration: 0.3 }}
        style={{ display: "flex", justifyContent: "center", marginTop: 2 }}
      >
        <motion.div
          animate={{
            boxShadow: [
              "0 4px 14px rgba(40,150,251,0.45), 0 0 0 0 rgba(40,150,251,0.5)",
              "0 4px 14px rgba(40,150,251,0.45), 0 0 0 8px rgba(40,150,251,0)",
            ],
          }}
          transition={{ duration: 1.4, repeat: Infinity }}
          style={{
            background: "linear-gradient(135deg, #2896FB, #1268C2)",
            color: "#F8FAFC",
            padding: "6px 14px",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.06em",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Download size={11} strokeWidth={2.6} />
          DOWNLOAD ALL
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ===================== END BIZDEV SCENE ===================== */

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
