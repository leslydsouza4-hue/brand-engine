const BASE = import.meta.env.BASE_URL;

export interface HighlyPose {
  id: string;
  name: string;
  image: string;
  description: string;
}

export const HIGHLY_POSES: HighlyPose[] = [
  { id: "pointing-up", name: "Pointing Up", image: `${BASE}assets/highly/highly-pointing-up.png`, description: "Highly is floating and pointing one hand upward toward the sky, with happy curved-arc eyes on the black visor, the other hand relaxed at the side" },
  { id: "pointing-left", name: "Pointing Left", image: `${BASE}assets/highly/highly-pointing-left.png`, description: "Highly is pointing to the left with one hand extended, with neutral upright oval eyes on the black visor, body angled slightly" },
  { id: "professor", name: "Professor", image: `${BASE}assets/highly/highly-professor.png`, description: "Highly is wearing small round glasses over the black visor and holding a teacher's pointer stick in one hand, in an educational/presenting pose" },
  { id: "heart-pointing", name: "Heart Eyes Pointing", image: `${BASE}assets/highly/highly-heart-eyes-pointing.png`, description: "Highly has glowing pink heart-shaped eyes on the black visor instead of the usual teal eyes, floating and pointing upward excitedly with one hand" },
  { id: "heart-laptop", name: "Heart Laptop", image: `${BASE}assets/highly/highly-heart-laptop.png`, description: "Highly has glowing pink heart-shaped eyes on the black visor, typing on a floating laptop with both detached hands, blue glow behind" },
  { id: "happy-pointing", name: "Happy Pointing", image: `${BASE}assets/highly/highly-happy-pointing.png`, description: "Highly has happy curved-arc eyes on the black visor, pointing to the left side with one extended hand" },
  { id: "tablet", name: "Tablet", image: `${BASE}assets/highly/highly-tablet.png`, description: "Highly is holding a tablet/iPad device in both detached hands showing a HighLevel interface, with neutral oval eyes, blue glow behind the tablet" },
  { id: "money-eyes", name: "Money Eyes", image: `${BASE}assets/highly/highly-money-eyes.png`, description: "Highly has bright green dollar-sign ($) shaped eyes on the black visor instead of the usual teal eyes, in an excited money/revenue themed pose" },
  { id: "happy-hover", name: "Happy Hover", image: `${BASE}assets/highly/highly-happy-hover.png`, description: "Highly is hovering in a relaxed pose with happy curved-arc eyes on the black visor, both detached hands floating casually at the sides, blue glow from jet thruster" },
  { id: "heart-hover", name: "Heart Hover", image: `${BASE}assets/highly/highly-heart-eyes-hover.png`, description: "Highly is hovering with pink heart-shaped eyes on the black visor, in a loving/affectionate relaxed floating pose with blue glow from jet thruster" },
  { id: "happy-laptop", name: "Happy Laptop", image: `${BASE}assets/highly/highly-happy-laptop.png`, description: "Highly has happy curved-arc eyes on the black visor, typing on a floating laptop with both detached hands" },
  { id: "thinking", name: "Thinking", image: `${BASE}assets/highly/highly-thinking.png`, description: "Highly is in a thinking pose with one hand on chin, question mark icons floating around the head, with contemplative oval eyes on the black visor" },
  { id: "working", name: "Working", image: `${BASE}assets/highly/highly-working.png`, description: "Highly is intensely focused working at a laptop, leaning forward slightly with both detached hands on the keyboard, blue glow from the screen" },
  { id: "waving", name: "Waving Hi", image: `${BASE}assets/highly/highly-waving.png`, description: "Highly is waving hello with one open hand raised high, with friendly upright oval eyes on the black visor, in a welcoming greeting pose" },
];
