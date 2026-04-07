import { useState, useRef, useEffect } from "react";
import { UploadCloud, X, Eraser, Eye } from "lucide-react";

const BG_URL = `${import.meta.env.BASE_URL}assets/backgrounds-dark/Type=Small Planet Bottom Right.png`;
const LOGO_URL = `${import.meta.env.BASE_URL}assets/logos/Lockup=Full Horizontal, Color=Light.png`;

export function ZoomWorkspace() {
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgRemovedImage, setBgRemovedImage] = useState<string | null>(null);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [bgRemoveProgress, setBgRemoveProgress] = useState(0);
  const [bgRemoveStatus, setBgRemoveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [bgRemoveMsg, setBgRemoveMsg] = useState("");
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'failed'>('loading');

  const [scale, setScale] = useState(88);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const { preload } = await import("https://esm.run/@imgly/background-removal");
        await preload();
        setModelStatus('ready');
      } catch (err) {
        console.error("Failed to load imgly model:", err);
        setModelStatus('failed');
      }
    }
    loadModel();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
        setBgRemovedImage(null);
        setBgRemoveStatus('idle');
        setBgRemoveProgress(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeBackground = async () => {
    if (!bgImage) return;
    
    setIsRemovingBg(true);
    setBgRemoveStatus('idle');
    setBgRemoveProgress(10);
    
    try {
      const { removeBackground: removeBg } = await import("https://esm.run/@imgly/background-removal");
      
      setBgRemoveProgress(30);
      
      const blob = await removeBg(bgImage, {
        progress: (key: string, current: number, total: number) => {
          const p = Math.round((current / total) * 100);
          if (p > 30) setBgRemoveProgress(p);
        }
      });
      
      const url = URL.createObjectURL(blob);
      setBgRemovedImage(url);
      setBgRemoveStatus('success');
      setBgRemoveMsg("Background removed successfully");
      setShowOriginal(false);
    } catch (err) {
      console.error("Background removal error:", err);
      setBgRemoveStatus('error');
      setBgRemoveMsg("Failed to remove background");
    } finally {
      setIsRemovingBg(false);
    }
  };

  const clearPhoto = () => {
    setBgImage(null);
    setBgRemovedImage(null);
    setBgRemoveStatus('idle');
    setBgRemoveProgress(0);
    setScale(88);
    setOffsetX(0);
    setOffsetY(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const currentDisplayImage = showOriginal ? bgImage : (bgRemovedImage || bgImage);

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0">
      <div className="w-[400px] min-w-[400px] overflow-y-auto pt-[20px] px-[28px] pb-[28px] border-r border-[rgba(255,255,255,0.06)] flex flex-col">
        <div className="text-[16px] font-bold text-white mb-[4px]">Zoom Background</div>
        <div className="text-[12px] text-[#64748B] mb-[20px] leading-[1.5]">Branded virtual background for Zoom, Meet & Teams. Upload your photo, remove the background, and customize.</div>
        
        <div className={`inline-flex items-center gap-[6px] py-[5px] px-[10px] rounded-[8px] text-[10px] font-semibold mb-[18px] self-start transition-all duration-300
          ${modelStatus === 'loading' ? 'bg-[rgba(255,208,0,0.08)] border border-[rgba(255,208,0,0.15)] text-[rgba(255,208,0,0.7)]' : 
            modelStatus === 'ready' ? 'bg-[rgba(0,178,169,0.08)] border border-[rgba(0,178,169,0.15)] text-[rgba(0,178,169,0.8)]' : 
            'bg-[rgba(255,77,77,0.08)] border border-[rgba(255,77,77,0.15)] text-[rgba(255,77,77,0.7)]'}`}
        >
          <div className={`w-[6px] h-[6px] rounded-full
            ${modelStatus === 'loading' ? 'bg-[rgba(255,208,0,0.6)] animate-[pulse-dot_1.2s_infinite]' : 
              modelStatus === 'ready' ? 'bg-[#00B2A9]' : 'bg-[rgba(255,77,77,0.6)]'}`}></div>
          {modelStatus === 'loading' ? 'Loading AI model...' : modelStatus === 'ready' ? 'AI Background Removal Ready' : 'AI Model Failed to Load'}
        </div>

        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[10px]">Your Photo</div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*" 
          className="hidden" 
        />

        <div 
          onClick={() => !bgImage && fileInputRef.current?.click()}
          className={`flex items-center gap-[14px] py-[14px] px-[16px] rounded-[16px] transition-all duration-250 relative overflow-hidden mb-[14px]
            ${bgImage 
              ? 'border-solid border border-[rgba(0,178,169,0.15)] bg-[rgba(0,178,169,0.04)] cursor-default' 
              : 'border-dashed border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.025)] hover:border-[rgba(0,178,169,0.2)] hover:bg-[rgba(0,178,169,0.03)] cursor-pointer'}`}
        >
          <div className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0
            ${bgImage ? 'bg-[rgba(0,178,169,0.1)]' : 'bg-[rgba(255,255,255,0.04)]'}`}>
            <UploadCloud className={`w-[16px] h-[16px] ${bgImage ? 'text-[#00B2A9]' : 'text-[#64748B]'}`} />
          </div>
          <div className="text-[12.5px] font-medium text-[#94A3B8] flex-1">
            {bgImage ? 'Photo uploaded' : 'Upload your photo'}
            <span className="block text-[10.5px] text-[#64748B] mt-[2px]">PNG, JPG — we'll remove the background</span>
          </div>
          {bgImage && (
            <button 
              onClick={(e) => { e.stopPropagation(); clearPhoto(); }}
              className="ml-auto w-[24px] h-[24px] border-none bg-[rgba(255,255,255,0.06)] rounded-[6px] text-[#64748B] flex items-center justify-center cursor-pointer shrink-0 hover:bg-[rgba(255,77,77,0.15)] hover:text-[#FF4D4D]"
            >
              <X className="w-[12px] h-[12px]" />
            </button>
          )}
        </div>

        {bgImage && (
          <>
            <div className="flex gap-[8px] mb-[10px] animate-in fade-in slide-in-from-top-2 duration-300">
              <button 
                onClick={removeBackground}
                disabled={isRemovingBg || bgRemovedImage !== null || modelStatus !== 'ready'}
                className="flex-1 flex items-center justify-center gap-[8px] py-[10px] px-[16px] border border-[rgba(0,178,169,0.2)] rounded-[10px] bg-[rgba(0,178,169,0.06)] font-inherit text-[12px] font-semibold text-[#00B2A9] cursor-pointer transition-all duration-200 hover:bg-[rgba(0,178,169,0.12)] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isRemovingBg ? (
                  <div className="w-[14px] h-[14px] border-[2px] border-[rgba(0,178,169,0.2)] border-t-[#00B2A9] rounded-full animate-spin"></div>
                ) : (
                  <Eraser className="w-[14px] h-[14px]" />
                )}
                {isRemovingBg ? 'Removing...' : bgRemovedImage ? 'Background Removed' : 'Remove Background'}
              </button>
              
              {bgRemovedImage && (
                <button 
                  onClick={() => setShowOriginal(!showOriginal)}
                  className="flex items-center justify-center gap-[6px] py-[10px] px-[14px] border border-[rgba(255,255,255,0.08)] rounded-[10px] bg-[rgba(255,255,255,0.03)] font-inherit text-[11px] font-semibold text-[#94A3B8] cursor-pointer transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)] hover:text-[#CBD5E1] whitespace-nowrap"
                >
                  <Eye className="w-[13px] h-[13px]" />
                  {showOriginal ? 'Show Cutout' : 'Show Original'}
                </button>
              )}
            </div>

            {isRemovingBg && (
              <div className="mb-[12px]">
                <div className="w-full h-[4px] bg-[rgba(255,255,255,0.06)] rounded-[4px] overflow-hidden">
                  <div 
                    className="h-full rounded-[4px] bg-gradient-to-r from-[#00B2A9] to-[#2896FB] transition-all duration-400 ease-out"
                    style={{ width: `${bgRemoveProgress}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-[#64748B] mt-[4px] text-center">Processing... {bgRemoveProgress}%</div>
              </div>
            )}

            {bgRemoveStatus !== 'idle' && (
              <div className={`text-[10.5px] text-center mb-[10px] min-h-[16px]
                ${bgRemoveStatus === 'success' ? 'text-[rgba(0,178,169,0.7)]' : 'text-[rgba(255,77,77,0.7)]'}`}>
                {bgRemoveMsg}
              </div>
            )}

            <div className="flex flex-col gap-[14px] mb-[16px] animate-in fade-in duration-300">
              <div className="flex gap-[14px]">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[6px]">
                    Scale <span className="font-semibold text-[#94A3B8]">{scale}%</span>
                  </div>
                  <input 
                    type="range" min="30" max="150" value={scale}
                    onChange={e => setScale(Number(e.target.value))}
                    className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                  />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[6px]">
                    Offset X <span className="font-semibold text-[#94A3B8]">{offsetX}</span>
                  </div>
                  <input 
                    type="range" min="-50" max="50" value={offsetX}
                    onChange={e => setOffsetX(Number(e.target.value))}
                    className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                  />
                </div>
              </div>
              <div className="flex gap-[14px]">
                <div className="flex-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#64748B] mb-[6px]">
                    Offset Y <span className="font-semibold text-[#94A3B8]">{offsetY}</span>
                  </div>
                  <input 
                    type="range" min="-30" max="30" value={offsetY}
                    onChange={e => setOffsetY(Number(e.target.value))}
                    className="w-full h-[4px] rounded-[4px] bg-[rgba(255,255,255,0.06)] outline-none appearance-none"
                  />
                </div>
                <div className="flex-1"></div>
              </div>
            </div>
          </>
        )}

        <div className="text-[10px] font-bold uppercase tracking-[1.5px] text-[#475569] mb-[10px] mt-[4px]">Details</div>
        
        <div className="flex flex-col gap-[12px] pb-[16px]">
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] block">Full Name</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Tyler Jorgenson"
              maxLength={30}
              className="w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-['Poppins'] text-[16px] font-bold text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569]"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[11px] font-semibold uppercase tracking-[1px] text-[#64748B] mb-[8px] block">Designation / Title</label>
            <input 
              type="text"
              value={designation}
              onChange={e => setDesignation(e.target.value)}
              placeholder="e.g. Sr. Director of Integrated Marketing"
              maxLength={50}
              className="w-full py-[10px] px-[14px] bg-[rgba(0,0,0,0.15)] border border-[rgba(255,255,255,0.06)] rounded-[12px] font-inherit text-[13.5px] text-[#E2E8F0] outline-none focus:border-[rgba(0,178,169,0.3)] focus:bg-[rgba(0,0,0,0.25)] placeholder:text-[#475569]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 pt-[20px] px-[24px] pb-[24px]">
        <div className="flex items-center justify-between pb-[14px]">
          <div className="text-[13px] font-medium text-[#64748B] flex items-center gap-[9px]">
            <div className="w-[8px] h-[8px] rounded-full bg-[#00B2A9] shadow-[0_0_10px_rgba(0,178,169,0.4)] animate-[pulse-dot_2s_infinite]"></div>
            Live Preview
          </div>
        </div>
        
        <div className="flex-1 flex justify-center items-center p-[32px]">
          <div className="w-full max-w-[720px] aspect-video rounded-[22px] relative overflow-hidden shadow-[0_16px_60px_rgba(0,0,0,0.4)] font-['Poppins']">
            
            <img 
              src={BG_URL} 
              alt="Background" 
              className="absolute inset-0 w-full h-full object-cover z-0"
            />

            <div className="absolute top-[5%] left-[4%] z-[5]">
              <img 
                src={LOGO_URL} 
                alt="HighLevel" 
                className="h-[28px] w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
              />
            </div>

            {(name || designation) && (
              <div className="absolute top-[18%] left-[4%] z-[4]">
                {name && (
                  <div className="font-['Poppins'] font-extrabold text-[clamp(18px,2.8vw,36px)] leading-[1.05] text-[#00B2A9] drop-shadow-[0_2px_12px_rgba(0,0,0,0.5)] uppercase tracking-[-0.5px]">
                    {name}
                  </div>
                )}
                {designation && (
                  <div className="font-sans font-medium text-[clamp(9px,1.1vw,14px)] text-[rgba(255,255,255,0.7)] mt-[4px] tracking-[0.3px]">
                    {designation}
                  </div>
                )}
              </div>
            )}

            {currentDisplayImage && (
              <img 
                src={currentDisplayImage} 
                alt="Person" 
                className="absolute right-[4%] bottom-0 z-[3] object-contain transition-all duration-300 drop-shadow-[0_0_24px_rgba(0,178,169,0.2)] drop-shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
                style={{ 
                  height: `${scale}%`,
                  transform: `translateX(${offsetX}%) translateY(${offsetY}%)`,
                  transformOrigin: 'bottom center'
                }}
              />
            )}

            {!currentDisplayImage && !name && !designation && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-[10] text-center gap-[8px]">
                <UploadCloud className="w-[32px] h-[32px] text-[rgba(255,255,255,0.25)] mb-[4px]" />
                <p className="text-[14px] text-[rgba(255,255,255,0.35)] font-medium m-0">Upload your photo to get started</p>
                <span className="text-[11px] text-[rgba(255,255,255,0.2)]">AI will remove the background automatically</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
