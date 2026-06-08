import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { StampCard } from "@/components/StampCard";
import { stamps } from "@/lib/stamps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Camera,
  Mic,
  ScanLine,
  Sparkles,
  Upload,
  CornerDownLeft,
  Loader2,
  ArrowRight,
  RefreshCw,
  Search,
  Trash2,
  FileImage,
  HelpCircle,
  Volume2,
  VolumeX,
} from "lucide-react";

function getBudgetFromPrompt(prompt: string) {
  const match = prompt.match(/(?:under|below|budget|upto|up to|₹|rs\.?)\s*([0-9,]+)/i);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

function getCatalogMatches(prompt: string) {
  const q = prompt.toLowerCase();
  const budget = getBudgetFromPrompt(prompt);
  const yearMatch = q.match(/\b(18\d{2}|19\d{2}|20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

  return stamps
    .map((stamp) => {
      let score = 0;
      const searchable =
        `${stamp.name} ${stamp.category} ${stamp.rarity} ${stamp.year} ${stamp.description}`.toLowerCase();

      for (const token of q.split(/\W+/).filter((token) => token.length > 2)) {
        if (searchable.includes(token)) score += 12;
      }

      if (year && stamp.year === year) score += 35;
      if (year && Math.abs(stamp.year - year) <= 5) score += 14;
      if (budget && stamp.price <= budget) score += 18;
      if (budget && stamp.price > budget) score -= 18;
      if (
        /rare|valuable|investment|premium/.test(q) &&
        /Rare|Very Rare|Legendary/.test(stamp.rarity)
      ) {
        score += 24;
      }
      if (/beginner|start|affordable|cheap/.test(q) && stamp.price <= 1500) score += 20;

      return { stamp, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

const CHAT_LANGUAGES = [{ code: "en-IN", label: "EN", name: "English" }] as const;

type ChatLanguageCode = (typeof CHAT_LANGUAGES)[number]["code"];

function getLanguageName(language?: string) {
  return CHAT_LANGUAGES.find((item) => item.code === language)?.name || "Hindi";
}

function buildOfflineChatReply(
  prompt: string,
  stampContext?: string,
  language: ChatLanguageCode = "en-IN",
) {
  const q = prompt.toLowerCase();
  const isEnglish = language === "en-IN";
  const isMarathi = language === "mr-IN";

  if (stampContext) {
    if (isEnglish) {
      return `${stampContext} should be checked for condition, perforation, watermark, gum and cancellation marks. These details decide authenticity and value. Ask about price, history or storage and I can guide you further.`;
    }
    if (isMarathi) {
      return `${stampContext} साठी condition, perforation, watermark, gum आणि cancellation तपासा. यावर authenticity आणि value ठरते. Price, history किंवा storage बद्दल विचारू शकता.`;
    }
    if (q.includes("worth") || q.includes("price") || q.includes("value")) {
      return `${stampContext} ki value condition par depend karti hai: mint gum, clean perforations, centering, aur cancellation marks sab matter karte hain. Roughly, strong-condition Indian commemoratives ₹1,000 se ₹15,000+ tak ja sakte hain. Clear front/back photos, watermark, aur perforation count se estimate kaafi better ho jayega.`;
    }
    if (q.includes("history") || q.includes("why") || q.includes("who")) {
      return `${stampContext} ko historical ya cultural commemoration ke liye issue kiya gaya tha. Stamp ke design, inscription, denomination, aur issue year se uska context identify hota hai. Agar aap image scan result ke saath year/denomination bhejenge, main uska exact postal-history angle aur collector value explain kar sakta hoon.`;
    }
    return `${stampContext} ke liye best next check: condition, perforation, watermark, gum, aur cancellation. In details se authenticity aur value dono clear hote hain. Aap price, history, ya storage ke baare me specific pooch sakte hain.`;
  }

  const matches = getCatalogMatches(prompt);
  const isSearchLike =
    /search|find|show|suggest|recommend|best|under|below|budget|rare|valuable/.test(q);

  if (matches.length && isSearchLike) {
    const picks = matches
      .map(
        ({ stamp }, index) =>
          `${index + 1}. ${stamp.name} (${stamp.year}) - ${stamp.rarity}, ₹${stamp.price.toLocaleString("en-IN")}`,
      )
      .join("\n");
    if (isEnglish) {
      return `Best catalog matches:\n${picks}\n\nMy pick: ${matches[0].stamp.name}, because its theme is "${matches[0].stamp.category}" and its rarity score is ${matches[0].stamp.rarityScore}/100.`;
    }
    if (isMarathi) {
      return `Catalog मधील best matches:\n${picks}\n\nमाझी pick: ${matches[0].stamp.name}. Theme "${matches[0].stamp.category}" आहे आणि rarity score ${matches[0].stamp.rarityScore}/100 आहे.`;
    }
    return `Archive ke hisaab se best matches:\n${picks}\n\nMera pick: ${matches[0].stamp.name}, kyunki iska theme "${matches[0].stamp.category}" hai aur rarity score ${matches[0].stamp.rarityScore}/100 hai. Agar aap budget ya theme aur specific karenge, main list aur tight kar dunga.`;
  }

  if (q.includes("gandhi")) {
    if (isEnglish) {
      return "The 1948 Mahatma Gandhi mourning issue is a landmark Indian philately set. The 10 Rupee value is especially desirable. Condition, gum, perforation, centering, stains and certification strongly affect value.";
    }
    if (isMarathi) {
      return "1948 Mahatma Gandhi mourning issue हा Indian philately मधील महत्त्वाचा set आहे. 10 Rupee stamp जास्त desirable असतो. Condition, gum, perforation, centering आणि certificate value ठरवतात.";
    }
    return "1948 Mahatma Gandhi mourning issue Indian philately ka landmark set hai. Values 1.5 anna, 3.5 anna, 12 anna, aur 10 Rupee me aayi thi. 10 Rs mint copy sabse desirable hoti hai. Value judge karte waqt gum, perforation, centering, stains, aur certificate zaroor check karein.";
  }
  if (q.includes("scinde") || q.includes("first stamp") || q.includes("dawk")) {
    if (isEnglish) {
      return "Scinde Dawk from 1852 is widely considered Asia's first postage stamp. It was used in the Sindh region and exists in red, blue and white variants. Genuine examples should be expert certified.";
    }
    if (isMarathi) {
      return "Scinde Dawk 1852 हा Asia मधील पहिला postage stamp मानला जातो. तो Sindh region मध्ये वापरला गेला. Red, blue आणि white variants मिळतात; genuine stamp साठी expert certificate महत्त्वाचे आहे.";
    }
    return "Scinde Dawk 1852 Asia ka pehla postage stamp mana jata hai. Ye Sindh region me Sir Bartle Frere ke postal reforms ke dauraan issue hua tha. Red, blue, aur white variants milte hain; red wax examples especially rare hain. Genuine examples ke liye expert certificate almost mandatory hai.";
  }
  if (q.includes("value") || q.includes("price") || q.includes("worth")) {
    if (isEnglish) {
      return "Stamp value depends on rarity, condition, centering, gum or cancellation and demand. In India, pre-independence issues, Gandhi stamps, early Republic commemoratives and complete thematic sets often have stronger demand.";
    }
    if (isMarathi) {
      return "Stamp value rarity, condition, centering, gum/cancellation आणि demand वर depend करते. India मध्ये pre-independence issues, Gandhi stamps आणि early Republic commemoratives ची demand जास्त असते.";
    }
    return "Stamp value ke 5 main factors hain: rarity, condition, centering, gum/cancellation, aur demand. Indian stamps me pre-independence issues, 1947-1952 early Republic/Independence items, Gandhi issues, aur strong thematic sets zyada demand me rehte hain. Clear photos ke bina exact valuation risky hoti hai.";
  }
  if (q.includes("clean") || q.includes("care") || q.includes("store")) {
    if (isEnglish) {
      return "Do not wash or clean valuable stamps. Use stamp tongs, keep them in acid-free stockbooks, avoid sunlight and humidity, and never touch mint gum directly.";
    }
    if (isMarathi) {
      return "Valuable stamps धुवू किंवा clean करू नका. Stamp tongs वापरा, acid-free stockbook मध्ये ठेवा, sunlight आणि humidity पासून दूर ठेवा, आणि mint gum हाताने touch करू नका.";
    }
    return "Stamps ko clean karne ki koshish mat kijiye. Stamp tongs use karein, acid-free stockbook me rakhein, humidity aur sunlight se bachayein, aur mint stamps ke gum ko touch na karein. Agar stamp valuable lag raha hai, restoration se pehle expert opinion lena better hai.";
  }
  if (q.includes("wildlife") || q.includes("tiger")) {
    if (isEnglish) {
      return "Indian wildlife stamps are a strong beginner theme. Project Tiger, birds, flowers, national parks and conservation issues are popular. Complete series are usually more meaningful than random singles.";
    }
    if (isMarathi) {
      return "Indian wildlife stamps beginners साठी strong theme आहे. Project Tiger, birds, flowers, national parks आणि conservation issues popular आहेत. Complete series random singles पेक्षा चांगली असते.";
    }
    return "Indian wildlife stamps beginners ke liye strong theme hain. Project Tiger, birds, flowers, national parks, aur conservation issues popular hain. Affordable collection ke liye used-condition sets se start karein; investment ke liye clean mint blocks, first-day covers, aur complete series better hote hain.";
  }

  if (isEnglish) {
    return "Tell me the stamp name, year, theme, budget or image details. Try: “rare history stamps under ₹5000”, “Gandhi 1948 value”, or “wildlife stamps for beginner”.";
  }
  if (isMarathi) {
    return "Stamp चे नाव, year, theme, budget किंवा image details सांगा. Try करा: “rare history stamps under ₹5000”, “Gandhi 1948 value”, किंवा “wildlife stamps for beginner”.";
  }
  return "Aap stamp ka naam, year, theme, budget, ya image details batayein. Example: “rare history stamps under ₹5000”, “Gandhi 1948 value”, ya “wildlife stamps for beginner”. Main archive-style matches, value logic, aur collecting advice de dunga.";
}

// Server action to query Gemini API (with simulated/mock fallbacks if API Key is not set)
export async function aiServiceFn({ data }: { data: { prompt?: string; imageBase64?: string; filename?: string; stampContext?: string; language?: ChatLanguageCode } }) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "https://stamp-safar-backend.onrender.com";
  try {
    const response = await fetch(`${backendUrl}/api/ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `Gemini API returned status ${response.status}`);
    }
    return await response.json();
  } catch (error: unknown) {
    console.error("Gemini API execution failed:", error);
    const message = error instanceof Error ? error.message : "Failed to process AI request";
    return { success: false, error: message };
  }
}

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Tools — Scan, Recommend & Search · Stamp Safar" },
      {
        name: "description",
        content:
          "Identify any stamp with Scan & Know, get personalised AI recommendations and search by voice.",
      },
    ],
  }),
  component: AIPage,
});

// Scanning steps
const SCAN_STEPS = [
  "Uploading stamp image to securely scan...",
  "Optimizing contrast and alignment for edge-detection...",
  "Analyzing stamp borders and perforation count...",
  "Running optical character recognition (OCR) on inscriptions...",
  "Querying Stamp Safar historical archives for matches...",
  "Synthesizing final classification parameters...",
];

interface ChatMessage {
  sender: "user" | "bot";
  text: string;
  imageUrl?: string;
  imageAlt?: string;
}

interface IdentifiedStamp {
  id?: string;
  name: string;
  year: number;
  price?: number;
  category: string;
  rarity: string;
  confidence: number;
  origin: string;
  description: string;
  historicalFact: string;
  estimatedValue: string;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface SpeechRecognitionResultEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

type SpeechRecognitionWindow = Window &
  typeof globalThis & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

type Stamp = (typeof stamps)[number];

interface RecommendationResult {
  stamp: Stamp;
  score: number;
  reason: string;
  focus: string;
}

const RECOMMENDATION_CATEGORIES = [
  "Any",
  "History",
  "Wildlife",
  "Culture",
  "Festivals",
  "Science",
  "Transport",
  "Military",
  "Monuments",
] as const;

const rarityWeights: Record<string, number> = {
  Common: 10,
  Uncommon: 20,
  Rare: 32,
  "Very Rare": 44,
  Legendary: 58,
};

function buildRecommendations(
  goal: string,
  budget: number,
  category: string,
): RecommendationResult[] {
  const normalizedGoal = goal.toLowerCase();
  const wantsInvestment = /invest|value|rare|premium|auction|appreciat|worth/.test(normalizedGoal);
  const wantsBeginner = /beginner|start|starter|first|cheap|budget/.test(normalizedGoal);
  const wantsHistory = /history|freedom|gandhi|leader|independence|heritage/.test(normalizedGoal);
  const wantsWildlife = /wildlife|animal|tiger|bird|nature/.test(normalizedGoal);
  const wantsScience = /science|space|satellite|technology|aryabhata/.test(normalizedGoal);

  return stamps
    .map((stamp) => {
      let score = stamp.rarityScore + (rarityWeights[stamp.rarity] ?? 0);

      if (category !== "Any" && stamp.category === category) score += 42;
      if (category !== "Any" && stamp.category !== category) score -= 22;

      if (stamp.price <= budget) score += 28;
      if (stamp.price > budget) score -= Math.min(40, Math.ceil((stamp.price - budget) / 500));

      if (wantsInvestment)
        score += stamp.rarity === "Very Rare" || stamp.rarity === "Rare" ? 34 : 8;
      if (wantsBeginner) score += stamp.price < 1500 ? 28 : -12;
      if (wantsHistory && stamp.category === "History") score += 35;
      if (wantsWildlife && stamp.category === "Wildlife") score += 35;
      if (wantsScience && stamp.category === "Science") score += 35;
      if (
        normalizedGoal &&
        `${stamp.name} ${stamp.description}`.toLowerCase().includes(normalizedGoal)
      )
        score += 30;

      const focus =
        stamp.price <= budget ? "fits your budget" : "stretches the budget for stronger rarity";

      const reason = `${stamp.category} theme, ${stamp.rarity.toLowerCase()} rating, and a ${stamp.rarityScore}/100 rarity score make it a strong ${wantsBeginner ? "starter" : wantsInvestment ? "investment-minded" : "collector"} match that ${focus}.`;

      return {
        stamp,
        score: Math.max(0, Math.min(100, score)),
        reason,
        focus,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

function AIPage() {
  const navigate = useNavigate();
  const [activeTab] = useState<"scan" | "chat" | "voice">("chat");

  // --- SCAN STATE ---
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [scanResult, setScanResult] = useState<IdentifiedStamp | null>(null);
  const [scanQaInput, setScanQaInput] = useState("");
  const [scanQaLoading, setScanQaLoading] = useState(false);
  const [scanQaMessages, setScanQaMessages] = useState<ChatMessage[]>([]);

  // --- CHAT STATE ---
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: "Namaste! I am DakBot, your AI Philatelist expert. Ask me anything about Indian postal history, famous stamp series, or how to identify and value your stamp collection.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [voiceRepliesEnabled, setVoiceRepliesEnabled] = useState(true);
  const [chatLanguage] = useState<ChatLanguageCode>("en-IN");
  const chatLogRef = useRef<HTMLDivElement | null>(null);
  const chatFileInputRef = useRef<HTMLInputElement | null>(null);
  const lastSpokenMessageRef = useRef(0);
  const cameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chatInputModeRef = useRef<"typed" | "voice">("typed");
  const pendingVoiceReplyRef = useRef(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // --- VOICE STATE ---
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceTranscriptRef = useRef("");
  const voiceTargetRef = useRef<"chat" | "search">("search");

  // --- RECOMMENDATION STATE ---
  const [collectorGoal, setCollectorGoal] = useState(
    "I want historically important Indian stamps with good long-term value.",
  );
  const [recommendationBudget, setRecommendationBudget] = useState(5000);
  const [recommendationCategory, setRecommendationCategory] =
    useState<(typeof RECOMMENDATION_CATEGORIES)[number]>("History");
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [recommendationSummary, setRecommendationSummary] = useState("");

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as SpeechRecognitionWindow).SpeechRecognition ||
      (window as SpeechRecognitionWindow).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-IN";

      rec.onstart = () => {
        setIsListening(true);
        setVoiceTranscript("");
        voiceTranscriptRef.current = "";
        setVoiceError(null);
      };

      rec.onresult = (event: SpeechRecognitionResultEventLike) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentTranscript = event.results[i][0].transcript;
          } else {
            currentTranscript += event.results[i][0].transcript;
          }
        }
        voiceTranscriptRef.current = currentTranscript;
        setVoiceTranscript(currentTranscript);
      };

      rec.onerror = (event: SpeechRecognitionErrorEventLike) => {
        console.error("Speech recognition error:", event);
        setVoiceError(event.error || "Microphone access failed.");
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
        if (voiceTargetRef.current === "chat" && voiceTranscriptRef.current.trim()) {
          chatInputModeRef.current = "voice";
          setChatInput(voiceTranscriptRef.current.trim());
        }
        voiceTargetRef.current = "search";
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTo({
        top: chatLogRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatMessages, chatLoading]);

  useEffect(() => {
    if (!voiceRepliesEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    const latestIndex = chatMessages.length - 1;
    const latestMessage = chatMessages[latestIndex];

    if (
      !latestMessage ||
      latestMessage.sender !== "bot" ||
      latestIndex <= lastSpokenMessageRef.current ||
      !pendingVoiceReplyRef.current
    ) {
      return;
    }

    pendingVoiceReplyRef.current = false;
    lastSpokenMessageRef.current = latestIndex;
    window.speechSynthesis.cancel();

    const spokenText = latestMessage.text
      .replace(/[₹•*#`]/g, "")
      .replace(/\n+/g, ". ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.lang = chatLanguage;
    utterance.rate = 0.95;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  }, [chatMessages, voiceRepliesEnabled, chatLanguage]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (cameraVideoRef.current && cameraStream) {
      cameraVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream]);

  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraStream]);

  // Handle Voice Search Start/Stop
  const handleVoiceToggle = (target: "chat" | "search" = "search") => {
    if (!recognitionRef.current) {
      setVoiceError(
        "Speech recognition is not supported on this browser. Please try Google Chrome or Safari.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      voiceTargetRef.current = target;
      startListening();
    }
  };

  const startListening = () => {
    try {
      if (recognitionRef.current) {
        recognitionRef.current.lang = chatLanguage;
        recognitionRef.current.start();
      }
    } catch (e) {
      console.error("Failed to start speech recognition", e);
    }
  };

  // Redirection from Voice Search
  const handleVoiceSearchSubmit = () => {
    if (voiceTranscript) {
      navigate({
        to: "/stamps",
        search: { q: voiceTranscript },
      });
    }
  };

  // Handle Image Upload Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
      setScanQaMessages([]);
      setScanProgress(0);
      setScanStepIndex(0);
    }
  };

  // Convert File to Base64 String
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(",")[1];
        resolve(base64String);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const analyzeChatImage = async (file: File, imageUrl: string, label: string) => {
    setChatMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: label,
        imageUrl,
        imageAlt: file.name,
      },
    ]);
    setChatLoading(true);

    try {
      const base64 = await fileToBase64(file);
      const res = await aiServiceFn({
        data: {
          imageBase64: base64,
          filename: file.name,
          language: chatLanguage,
        },
      });

      if (res.success && res.stamp) {
        const stamp = res.stamp as IdentifiedStamp;
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: `Stamp identified:\n${stamp.name} (${stamp.year})\nOrigin: ${stamp.origin}\nCategory: ${stamp.category}\nRarity: ${stamp.rarity}\nEstimated value: ${stamp.estimatedValue}\nConfidence: ${stamp.confidence}%\n\n${stamp.description}\n\nHistorical note: ${stamp.historicalFact}`,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Image scan complete nahi ho paya. Please clearer stamp photo upload karein.",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Image process karte waqt error aaya. Please dobara try karein.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || chatLoading) return;

    await analyzeChatImage(file, URL.createObjectURL(file), `Uploaded stamp image: ${file.name}`);
    e.target.value = "";
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setCameraOpen(false);
  };

  const handleOpenCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera access is not supported in this browser.");
      return;
    }

    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      setCameraOpen(true);
    } catch (error) {
      console.error("Camera access failed", error);
      setCameraError(
        "Camera permission nahi mili. Browser permission allow karke dobara try karein.",
      );
    }
  };

  const handleCaptureStamp = async () => {
    const video = cameraVideoRef.current;
    const canvas = cameraCanvasRef.current;
    if (!video || !canvas || chatLoading) return;

    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);
    const imageUrl = canvas.toDataURL("image/jpeg", 0.9);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );

    if (!blob) {
      setCameraError("Camera frame capture nahi ho paya. Please dobara try karein.");
      return;
    }

    const file = new File([blob], `camera-stamp-${Date.now()}.jpg`, { type: "image/jpeg" });
    stopCamera();
    await analyzeChatImage(file, imageUrl, "Captured stamp from camera");
  };

  // Run Scan Analysis
  const handleAnalyseStamp = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setScanResult(null);
    setScanProgress(5);
    setScanStepIndex(0);

    // Dynamic scanning progress steps simulator
    const stepDuration = 500;
    const progressInterval = setInterval(() => {
      setScanProgress((prev) => {
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return next > 95 ? 95 : next;
      });
    }, 200);

    const stepInterval = setInterval(() => {
      setScanStepIndex((prev) => {
        if (prev < SCAN_STEPS.length - 1) {
          return prev + 1;
        }
        clearInterval(stepInterval);
        return prev;
      });
    }, stepDuration * 1.5);

    try {
      const base64 = await fileToBase64(selectedFile);
      const filename = selectedFile.name;

      // Invoke server-side Gemini or mock handler
      const res = await aiServiceFn({
        data: {
          imageBase64: base64,
          filename: filename,
        },
      });

      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setScanProgress(100);
      setScanStepIndex(SCAN_STEPS.length - 1);

      // Simulate a final pause for visual smoothness
      setTimeout(() => {
        setIsScanning(false);
        if (res.success && res.stamp) {
          setScanResult(res.stamp as IdentifiedStamp);
        } else {
          console.error("AI Error:", res.error);
        }
      }, 500);
    } catch (err) {
      console.error(err);
      clearInterval(progressInterval);
      clearInterval(stepInterval);
      setIsScanning(false);
    }
  };

  // Handle Q&A specifically for the scanned stamp
  const handleScanQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanQaInput.trim() || !scanResult) return;

    const userText = scanQaInput;
    setScanQaMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setScanQaInput("");
    setScanQaLoading(true);

    try {
      const res = await aiServiceFn({
        data: {
          prompt: userText,
          stampContext: `${scanResult.name} (${scanResult.year})`,
          language: chatLanguage,
        },
      });

      if (res.success && res.response) {
        setScanQaMessages((prev) => [...prev, { sender: "bot", text: res.response }]);
      } else {
        setScanQaMessages((prev) => [
          ...prev,
          { sender: "bot", text: "Apologies, I encountered an issue processing your query." },
        ]);
      }
    } catch (e) {
      console.error(e);
      setScanQaMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Sorry, I am unable to connect to the AI model right now." },
      ]);
    } finally {
      setScanQaLoading(false);
    }
  };

  // Handle chatbot query
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    pendingVoiceReplyRef.current = chatInputModeRef.current === "voice";
    chatInputModeRef.current = "typed";
    setChatMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await aiServiceFn({
        data: {
          prompt: userText,
          language: chatLanguage,
        },
      });

      if (res.success && res.response) {
        setChatMessages((prev) => [...prev, { sender: "bot", text: res.response }]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: "bot",
            text: "Apologies, I had trouble answering that. Could you ask in a different way?",
          },
        ]);
      }
    } catch (err) {
      console.error(err);
      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to AI service. Please try again later." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  // Chat chips trigger helper
  const handleChipClick = (question: string) => {
    setChatInput(question);
  };

  const handleGenerateRecommendations = () => {
    setRecommendations(
      buildRecommendations(collectorGoal, recommendationBudget, recommendationCategory),
    );
    setRecommendationSummary(
      `${recommendationCategory} theme · Budget ₹${recommendationBudget.toLocaleString("en-IN")} · ${collectorGoal.trim() || "general collector goal"}`,
    );
  };

  return (
    <SiteLayout>
      {/* HEADER SECTION */}
      <section className="container mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-4 sm:pb-6 text-center max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-gold" /> AI Philately Suite
        </div>
        <h1 className="mt-4 text-3xl sm:text-5xl font-semibold leading-tight">
          A Smarter Way to Collect
        </h1>
        <p className="mt-3 text-sm sm:text-base text-muted-foreground">
          Identify stamps in seconds, ask questions to our AI curator, and explore archives
          hands-free.
        </p>
      </section>

      <section className="container mx-auto px-3 sm:px-6 py-3 sm:py-4 max-w-5xl">
        {/* ==================== TAB 1: SCAN & KNOW ==================== */}
        {activeTab === "scan" && (
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            {/* Left Column: Image Upload & Preview */}
            <div className="stamp-card p-6 lg:p-8 flex flex-col gap-6">
              <div>
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <ScanLine className="w-5 h-5 text-gold" /> Image Identifier
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Upload a clear image of a postage stamp. The AI will inspect details, text, and
                  visual designs to match it.
                </p>
              </div>

              {/* Upload Zone */}
              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isScanning}
                />
                <div className="border-2 border-dashed border-border hover:border-gold rounded-2xl p-8 text-center cursor-pointer bg-secondary/40 hover:bg-secondary/60 transition-colors flex flex-col items-center justify-center min-h-[220px]">
                  {previewUrl ? (
                    <div className="relative group max-w-[200px]">
                      <img
                        src={previewUrl}
                        alt="Stamp Preview"
                        className="rounded-lg max-h-[160px] object-contain shadow-md border border-border"
                      />
                      <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <RefreshCw className="w-6 h-6 text-white animate-spin-slow" />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                      <div className="font-medium text-foreground text-sm">
                        Drop your stamp photo here
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        or click to browse from device
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 mt-3 px-2 py-0.5 rounded bg-border/40">
                        PNG, JPG, JPEG up to 10MB
                      </span>
                    </>
                  )}
                </div>
              </label>

              {previewUrl && (
                <div className="flex gap-3">
                  <Button
                    onClick={handleAnalyseStamp}
                    disabled={isScanning}
                    className="flex-1 bg-gold text-gold-foreground font-semibold hover:bg-gold/95 h-12 text-sm shadow-md"
                  >
                    {isScanning ? (
                      <span className="flex items-center gap-2 justify-center">
                        <Loader2 className="w-4 h-4 animate-spin" /> Analyzing Stamp...
                      </span>
                    ) : (
                      "Analyse Stamp"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setScanResult(null);
                      setScanQaMessages([]);
                    }}
                    disabled={isScanning}
                    className="h-12 border-border hover:bg-white/5"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )}

              {/* Scanning Progress */}
              {isScanning && (
                <div className="mt-4 p-5 rounded-2xl bg-secondary/30 border border-border/40 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gold font-medium flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> SCAN STATUS: RUNNING
                    </span>
                    <span className="text-muted-foreground font-semibold">{scanProgress}%</span>
                  </div>
                  <Progress value={scanProgress} className="h-1.5 bg-border accent-gold" />
                  <div className="flex items-start gap-2.5 text-xs text-foreground mt-1">
                    <FileImage className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                    <p className="italic leading-normal">{SCAN_STEPS[scanStepIndex]}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Matched Scan Results */}
            <div className="space-y-6">
              {scanResult ? (
                <div className="stamp-card border-gold/45 shadow-gold p-6 lg:p-8 space-y-5 animate-fade-in">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge className="bg-gold/15 text-gold border border-gold/30 hover:bg-gold/20 text-xs px-2 py-0.5">
                        Matched with {scanResult.confidence}% confidence
                      </Badge>
                      <h3 className="text-2xl font-bold text-foreground mt-2">{scanResult.name}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {scanResult.origin} · {scanResult.year}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-3 border-y border-border/40 text-xs">
                    <div>
                      <div className="text-muted-foreground font-medium">Category / Theme</div>
                      <div className="font-semibold text-foreground text-sm mt-0.5">
                        {scanResult.category}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Rarity Rating</div>
                      <div className="font-semibold text-gold text-sm mt-0.5">
                        {scanResult.rarity}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Estimated Value</div>
                      <div className="font-semibold text-foreground text-sm mt-0.5">
                        {scanResult.estimatedValue}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground font-medium">Archival ID</div>
                      <div className="font-semibold text-muted-foreground text-sm mt-0.5">
                        DK-{scanResult.year}-{scanResult.id || "AI"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Archival Description
                    </h4>
                    <p className="text-sm text-foreground/90 mt-1 leading-relaxed">
                      {scanResult.description}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gold/5 border border-gold/20">
                    <h4 className="text-xs font-semibold text-gold uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Historical Fact
                    </h4>
                    <p className="text-xs text-foreground/95 mt-1 leading-relaxed">
                      {scanResult.historicalFact}
                    </p>
                  </div>

                  {/* Dynamic catalog match linking */}
                  {stamps.some((s) => s.id === scanResult.id) && (
                    <Button
                      onClick={() => navigate({ to: `/stamps/${scanResult.id}` })}
                      variant="outline"
                      className="w-full border-border flex items-center justify-center gap-2 hover:bg-gold/10 hover:border-gold hover:text-gold"
                    >
                      View Catalog Details <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}

                  {/* Stamp Q&A Section */}
                  <div className="pt-4 border-t border-border/30">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Ask AI about this stamp
                    </h4>
                    <div className="max-h-[160px] overflow-y-auto space-y-3 mb-3 pr-1 text-xs">
                      {scanQaMessages.map((m, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-xl max-w-[85%] ${m.sender === "user" ? "bg-gold text-gold-foreground ml-auto" : "bg-secondary border border-border"}`}
                        >
                          {m.text}
                        </div>
                      ))}
                      {scanQaLoading && (
                        <div className="bg-secondary/40 p-2.5 rounded-xl max-w-[85%] flex items-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking...
                        </div>
                      )}
                    </div>
                    <form onSubmit={handleScanQaSubmit} className="flex gap-2">
                      <Input
                        value={scanQaInput}
                        onChange={(e) => setScanQaInput(e.target.value)}
                        placeholder={`Ask something about ${scanResult.name}...`}
                        className="bg-secondary/50 h-10 border-border text-xs focus-visible:ring-gold"
                        disabled={scanQaLoading}
                      />
                      <Button
                        type="submit"
                        disabled={scanQaLoading}
                        className="h-10 bg-gold text-gold-foreground hover:bg-gold/90 px-3"
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="stamp-card p-8 text-center text-muted-foreground h-full flex flex-col items-center justify-center min-h-[300px] border-dashed">
                  <HelpCircle className="w-12 h-12 text-muted-foreground/35 mb-3" />
                  <h3 className="font-semibold text-foreground">No Stamp Scanned</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto leading-relaxed">
                    Upload and analyze an image of a stamp to view detailed AI identification
                    parameters.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== TAB 2: DAKBOT CHAT ==================== */}
        {activeTab === "chat" && (
          <div className="stamp-card p-3 sm:p-6 lg:p-8 flex flex-col h-[min(74vh,720px)] min-h-[560px] max-sm:h-[calc(100svh-220px)] max-sm:min-h-[500px] justify-between">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border/40 pb-3 sm:pb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-gold/10 border border-gold/30 grid place-items-center text-gold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                    DakBot{" "}
                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-0 text-[10px] px-1.5 py-0">
                      Online
                    </Badge>
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Image scan, voice input and spoken answers all work here.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (voiceRepliesEnabled && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                  setVoiceRepliesEnabled((enabled) => !enabled);
                }}
                className={`h-9 sm:h-10 w-fit gap-2 rounded-xl border-border px-3 text-xs ${
                  voiceRepliesEnabled ? "border-gold bg-gold/10 text-gold" : ""
                }`}
              >
                {voiceRepliesEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                {voiceRepliesEnabled ? "Voice on" : "Voice off"}
              </Button>
            </div>

            {/* Conversation Log */}
            <div
              ref={chatLogRef}
              className="flex-1 overflow-y-auto py-3 sm:py-4 space-y-3 sm:space-y-4 pr-1 sm:pr-2 scrollbar-thin"
            >
              {chatMessages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[78%] whitespace-pre-line rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 text-sm leading-relaxed shadow-sm break-words ${
                      m.sender === "user"
                        ? "bg-gold text-gold-foreground rounded-tr-none font-medium"
                        : "bg-secondary/80 border border-border/60 rounded-tl-none text-foreground/90"
                    }`}
                  >
                    {m.imageUrl && (
                      <img
                        src={m.imageUrl}
                        alt={m.imageAlt || "Uploaded stamp"}
                        className="mb-2 max-h-48 w-full rounded-xl border border-border object-contain bg-background/60"
                      />
                    )}
                    <div>{m.text}</div>
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-secondary/40 border border-border/40 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin text-gold" /> Thinking...
                  </div>
                </div>
              )}
            </div>

            {cameraOpen && (
              <div className="mb-3 rounded-2xl border border-gold/30 bg-secondary/40 p-3">
                <div className="overflow-hidden rounded-xl border border-border bg-black">
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="h-56 w-full object-cover sm:h-72"
                  />
                </div>
                <canvas ref={cameraCanvasRef} className="hidden" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={handleCaptureStamp}
                    disabled={chatLoading}
                    className="flex-1 bg-gold text-gold-foreground hover:bg-gold/90"
                  >
                    <Camera className="mr-2 h-4 w-4" /> Capture stamp
                  </Button>
                  <Button type="button" variant="outline" onClick={stopCamera}>
                    Close camera
                  </Button>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="mb-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {cameraError}
              </div>
            )}

            {/* Suggestions Chips */}
            <div className="py-2 flex gap-2 text-xs border-t border-border/30 pt-3 sm:pt-4 overflow-x-auto">
              <span className="text-muted-foreground flex items-center shrink-0">Try asking:</span>
              {[
                "What is the Scinde Dawk?",
                "Mahatma Gandhi mourning stamp valuation",
                "How do I care for stamps?",
                "Which was the first independent Indian stamp?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => handleChipClick(q)}
                  className="shrink-0 px-2.5 py-1 rounded-full bg-secondary hover:bg-gold/15 hover:text-gold border border-border hover:border-gold/30 transition-all text-muted-foreground text-left"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form onSubmit={handleChatSubmit} className="mt-2 flex flex-wrap gap-2 sm:gap-3">
              <input
                ref={chatFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleChatImageUpload}
              />
              <Button
                type="button"
                variant="outline"
                disabled={chatLoading}
                onClick={() => chatFileInputRef.current?.click()}
                className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl border-border p-0 hover:border-gold hover:bg-gold/10"
                aria-label="Upload stamp image"
              >
                <Upload className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={chatLoading}
                onClick={cameraOpen ? stopCamera : handleOpenCamera}
                className={`h-11 sm:h-12 w-11 sm:w-12 rounded-xl border-border p-0 hover:border-gold hover:bg-gold/10 ${
                  cameraOpen ? "border-gold bg-gold/10 text-gold" : ""
                }`}
                aria-label="Open camera"
              >
                <Camera className="w-5 h-5" />
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={chatLoading}
                onClick={() => handleVoiceToggle("chat")}
                className={`h-11 sm:h-12 w-11 sm:w-12 rounded-xl border-border p-0 hover:border-gold hover:bg-gold/10 ${
                  isListening ? "border-red-400 bg-red-500/10 text-red-500" : ""
                }`}
                aria-label="Speak question"
              >
                {isListening ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </Button>
              <Input
                value={chatInput}
                onChange={(e) => {
                  chatInputModeRef.current = "typed";
                  pendingVoiceReplyRef.current = false;
                  setChatInput(e.target.value);
                }}
                placeholder={
                  isListening
                    ? "Listening... boliye, text yahin aa jayega"
                    : "Ask, upload, or speak about Indian stamps..."
                }
                className="bg-secondary/50 border-border h-11 sm:h-12 rounded-xl focus-visible:ring-gold flex-1 min-w-[210px] max-sm:order-first max-sm:basis-full text-sm placeholder:text-muted-foreground/60"
                disabled={chatLoading}
              />
              <Button
                type="submit"
                disabled={chatLoading || !chatInput.trim()}
                className="h-11 sm:h-12 w-11 sm:w-12 rounded-xl bg-gold text-gold-foreground hover:bg-gold/95 shadow-md flex-shrink-0"
              >
                <CornerDownLeft className="w-5 h-5" />
              </Button>
            </form>
          </div>
        )}

        {/* ==================== TAB 3: VOICE SEARCH ==================== */}
        {activeTab === "voice" && (
          <div className="stamp-card p-8 lg:p-12 flex flex-col items-center justify-center text-center space-y-6 max-w-xl mx-auto min-h-[440px]">
            <div className="w-14 h-14 rounded-2xl bg-gold/15 border border-gold/30 grid place-items-center text-gold">
              <Mic className="w-6 h-6" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground">AI Voice Search</h2>
              <p className="text-muted-foreground text-sm mt-1.5 max-w-sm mx-auto">
                Speak details like "Wildlife stamps in 1970s" or "Gandhi 1948" to find matches in
                our archive.
              </p>
            </div>

            {/* Mic Activation Button & Wave Animation */}
            <div className="py-6 flex flex-col items-center justify-center w-full">
              <button
                onClick={handleVoiceToggle}
                className={`relative w-28 h-28 rounded-full flex items-center justify-center shadow-lg transition-transform ${
                  isListening
                    ? "bg-red-500 text-white scale-105"
                    : "bg-gradient-to-br from-gold to-gold/70 text-gold-foreground hover:scale-105"
                }`}
              >
                {isListening && (
                  <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
                )}
                <Mic className="w-9 h-9" />
              </button>

              {/* Speech Waveform Simulation */}
              {isListening && (
                <div className="flex gap-1.5 mt-8 h-8 items-center justify-center">
                  {[0.5, 1, 0.7, 1.2, 0.4, 0.8, 1, 0.6].map((h, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-red-500 rounded-full"
                      style={{
                        height: `${h * 100}%`,
                        animation: "wave 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Real-time transcription */}
            <div className="w-full bg-secondary/40 border border-border/50 rounded-2xl p-5 min-h-[90px] flex items-center justify-center">
              {isListening ? (
                <p className="text-foreground font-medium text-sm animate-pulse">
                  {voiceTranscript || "Listening... Speak now."}
                </p>
              ) : voiceTranscript ? (
                <div className="space-y-4 w-full">
                  <div>
                    <span className="text-[10px] text-gold uppercase tracking-widest font-semibold">
                      What we heard
                    </span>
                    <p className="text-foreground font-bold text-base mt-0.5">
                      "{voiceTranscript}"
                    </p>
                  </div>
                  <Button
                    onClick={handleVoiceSearchSubmit}
                    className="bg-gold text-gold-foreground font-semibold hover:bg-gold/90 h-10 w-full"
                  >
                    Search Archive <Search className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-muted-foreground text-xs leading-normal">
                  Tap the microphone and start speaking. When you finish, tap the mic again to
                  compile search parameters.
                </p>
              )}
            </div>

            {voiceError && (
              <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5 w-full">
                {voiceError}
              </p>
            )}
          </div>
        )}
      </section>

      {/* WAVE KEYFRAMES INLINE STYLE */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </SiteLayout>
  );
}
