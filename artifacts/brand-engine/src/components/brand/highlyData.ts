const BASE = import.meta.env.BASE_URL;

export interface HighlyPose {
  id: string;
  name: string;
  image: string;
  description: string;
}

export const HIGHLY_POSES: HighlyPose[] = [
  { id: "pointing-up", name: "Pointing Up", image: `${BASE}assets/highly/highly-pointing-up.png`, description: "Highly mascot floating and pointing upward with one hand, happy curved-eye expression" },
  { id: "pointing-left", name: "Pointing Left", image: `${BASE}assets/highly/highly-pointing-left.png`, description: "Highly mascot pointing to the left with one hand, neutral oval-eye expression" },
  { id: "professor", name: "Professor", image: `${BASE}assets/highly/highly-professor.png`, description: "Highly mascot wearing glasses holding a pointer stick, teacher/professor pose" },
  { id: "heart-pointing", name: "Heart Eyes Pointing", image: `${BASE}assets/highly/highly-heart-eyes-pointing.png`, description: "Highly mascot with heart-shaped eyes, floating and pointing upward excitedly" },
  { id: "heart-laptop", name: "Heart Laptop", image: `${BASE}assets/highly/highly-heart-laptop.png`, description: "Highly mascot with heart-shaped eyes typing on a laptop with blue glow" },
  { id: "happy-pointing", name: "Happy Pointing", image: `${BASE}assets/highly/highly-happy-pointing.png`, description: "Highly mascot with happy curved-eye expression pointing to the left" },
  { id: "tablet", name: "Tablet", image: `${BASE}assets/highly/highly-tablet.png`, description: "Highly mascot holding a tablet device with HighLevel logo, blue glow behind" },
  { id: "money-eyes", name: "Money Eyes", image: `${BASE}assets/highly/highly-money-eyes.png`, description: "Highly mascot with green dollar sign eyes, money/revenue themed" },
  { id: "happy-hover", name: "Happy Hover", image: `${BASE}assets/highly/highly-happy-hover.png`, description: "Highly mascot hovering with happy curved-eye expression and blue glow" },
  { id: "heart-hover", name: "Heart Hover", image: `${BASE}assets/highly/highly-heart-eyes-hover.png`, description: "Highly mascot hovering with heart-shaped eyes and blue glow" },
  { id: "happy-laptop", name: "Happy Laptop", image: `${BASE}assets/highly/highly-happy-laptop.png`, description: "Highly mascot with happy curved-eye expression typing on laptop" },
  { id: "thinking", name: "Thinking", image: `${BASE}assets/highly/highly-thinking.png`, description: "Highly mascot in thinking pose with question marks floating around head" },
  { id: "working", name: "Working", image: `${BASE}assets/highly/highly-working.png`, description: "Highly mascot focused on working at laptop with blue glow" },
  { id: "waving", name: "Waving Hi", image: `${BASE}assets/highly/highly-waving.png`, description: "Highly mascot waving hello with open hand, friendly welcoming pose" },
];
