import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  ReceiptText, 
  Quote, 
  Users, 
  Settings, 
  Plus, 
  Minus,
  Search, 
  Bell, 
  CircleHelp,
  Check,
  Image as ImageIcon,
  Video,
  Sparkles,
  Bot,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Info,
  ShieldCheck,
  Download,
  RotateCcw,
  Monitor,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types & Interfaces ---

interface BasicInfo {
  company: string;
  contact: string;
  project: string;
  date: string;
}

interface PanelInfo {
  count: number;
  size: string;
  orientation: 'horizontal' | 'vertical';
  resolution: 'hd' | 'fhd' | 'uhd';
  isVideoWall: boolean;
}

interface DetailedRequests {
  image: {
    count: number;
    tasks: string[];
    needsResearch: boolean;
  };
  video: {
    duration: number;
    tasks: string[];
    effects: {
      transition: 'none' | 'basic' | 'pro';
      entrance: 'none' | 'basic' | 'pro';
      highlight: 'none' | 'basic' | 'pro';
      fx: 'none' | 'basic' | 'pro';
      animation: 'none' | 'basic' | 'pro';
    };
    effectCounts: {
      transition: number;
      entrance: number;
      highlight: number;
      fx: number;
      animation: number;
    };
    quality: 'fhd' | '4k';
  };
  aiImage: {
    count: number;
  };
  aiVideo: {
    count: number;
  };
}

interface QuoteItem {
  category: string;
  name: string;
  standard: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

// --- Constants (Pricing Data) ---

const UNIT_PRICES = {
  image: {
    resize: 392,
    clipping: 11753,
    separation: 17629,
    composite: 5876,
    text: 5876,
    design: 5876,
  },
  video: {
    rolling: 196,
    transition_basic: 392,
    entrance_basic: 3918,
    highlight_basic: 3918,
    fx_basic: 2938,
    animation_basic: 2938,
    videoWall_basic: 1959,
    render_fhd: 784,
    convert_mp4: 784,
    convert_usb: 1959,
  },
  ai: {
    image: 43675,
    video: 100503,
  }
};

const STEPS = [
  { id: 1, label: '기본 정보' },
  { id: 2, label: '패널 정보' },
  { id: 3, label: '콘텐츠 유형' },
  { id: 4, label: '세부 요청' },
  { id: 5, label: '마진 설정' },
  { id: 6, label: '견적 결과' },
];

const CONTENT_OPTIONS = [
  { id: 'image', title: '이미지 제작', description: '기존 사진·이미지 편집 및 합성', icon: <ImageIcon size={24} /> },
  { id: 'video', title: '영상·모션 제작', description: '컷 편집, 모션그래픽, 특수효과', icon: <Video size={24} /> },
  { id: 'ai-image', title: 'AI 이미지 생성', description: 'Midjourney·Gemini로 이미지 생성', icon: <Sparkles size={24} /> },
  { id: 'ai-video', title: 'AI 영상 생성', description: 'AI 영상 생성 및 후보정', icon: <Bot size={24} /> },
];

// --- Utilities ---

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(Math.round(value)) + '원';
};

// --- Components ---

const Sidebar = () => (
  <aside className="fixed left-0 top-0 h-full w-[260px] bg-slate-50 border-r border-slate-200 flex flex-col py-6 px-4 z-50">
    <div className="flex items-center space-x-3 mb-8 px-2">
      <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200/50">
        <ReceiptText size={24} />
      </div>
      <div>
        <h1 className="text-lg font-black text-primary tracking-tight">BillFlow Pro</h1>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Financial Management</p>
      </div>
    </div>
    <nav className="flex-1 space-y-1">
      <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" />
      <NavItem icon={<ReceiptText size={20} />} label="Invoices" active />
      <NavItem icon={<Quote size={20} />} label="Quotes" />
      <NavItem icon={<Users size={20} />} label="Clients" />
      <NavItem icon={<Settings size={20} />} label="Settings" />
    </nav>
    <div className="pt-6 border-t border-slate-200">
      <button className="w-full bg-primary text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-3 shadow-lg shadow-blue-200/50 hover:bg-blue-700 active:scale-95 transition-all">
        <Plus size={20} strokeWidth={3} />
        <span className="text-sm">New Invoice</span>
      </button>
    </div>
  </aside>
);

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
  <a href="#" className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${active ? 'bg-blue-50 text-primary font-semibold border-r-4 border-primary rounded-r-none -mr-4' : 'text-slate-500 hover:bg-slate-100'}`}>
    <span className={`${active ? 'text-primary' : 'group-hover:text-primary transition-colors'}`}>{icon}</span>
    <span className="text-sm">{label}</span>
  </a>
);

const Header = () => (
  <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-40 px-8 flex justify-between items-center">
    <div className="flex items-center space-x-4">
      <span className="text-lg font-black text-primary tracking-tighter">BillFlow</span>
      <div className="h-4 w-px bg-slate-200 mx-2"></div>
      <div className="relative group">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
        <input className="bg-slate-50 border-none rounded-full py-2 pl-10 pr-4 text-xs w-64 focus:ring-2 focus:ring-primary/20 bg-slate-100/50 transition-all font-medium outline-none" placeholder="Search invoices..." type="text" />
      </div>
    </div>
    <div className="flex items-center space-x-3">
      <IconButton icon={<Bell size={20} />} />
      <IconButton icon={<CircleHelp size={20} />} />
      <div className="w-9 h-9 rounded-full bg-blue-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden ml-2">
        <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="Avatar" className="w-full h-full object-cover" />
      </div>
    </div>
  </header>
);

const IconButton = ({ icon }: { icon: React.ReactNode }) => (
  <button className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all">{icon}</button>
);

const InfoCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start space-x-4">
    <div className="shrink-0 p-3 bg-blue-50 rounded-xl">{icon}</div>
    <div>
      <h4 className="text-sm font-bold text-slate-900 mb-1">{title}</h4>
      <p className="text-[12px] leading-relaxed text-slate-500">{description}</p>
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [step, setStep] = useState(1);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    company: '',
    contact: '',
    project: '매장 디지털 사이니지',
    date: new Date().toISOString().split('T')[0]
  });
  const [panelInfo, setPanelInfo] = useState<PanelInfo>({
    count: 1,
    size: '55',
    orientation: 'horizontal',
    resolution: 'fhd',
    isVideoWall: false
  });
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['image', 'video', 'ai-image', 'ai-video']);
  const [detailedRequests, setDetailedRequests] = useState<DetailedRequests>({
    image: { count: 0, tasks: ['size', 'bg', 'layer', 'composite', 'text', 'design'], needsResearch: false },
    video: { 
      duration: 30, 
      tasks: ['rolling', 'usb'], 
      effects: { transition: 'basic', entrance: 'basic', highlight: 'basic', fx: 'basic', animation: 'basic' },
      effectCounts: { transition: 0, entrance: 0, highlight: 0, fx: 0, animation: 0 },
      quality: 'fhd' 
    },
    aiImage: { count: 0 },
    aiVideo: { count: 0 },
  });
  const [margin, setMargin] = useState(30);

  // --- Calculation Logic ---

  const quoteItems = useMemo(() => {
    const items: QuoteItem[] = [];

    if (selectedTypes.includes('image')) {
      const { count, tasks } = detailedRequests.image;
      if (tasks.includes('size')) items.push({ category: '이미지', name: '사이즈 변경', standard: '5장', quantity: Math.ceil(count / 5), unitPrice: UNIT_PRICES.image.resize, total: Math.ceil(count / 5) * UNIT_PRICES.image.resize });
      if (tasks.includes('bg')) items.push({ category: '이미지', name: '배경 제거(누끼)', standard: '1장', quantity: count, unitPrice: UNIT_PRICES.image.clipping, total: count * UNIT_PRICES.image.clipping });
      if (tasks.includes('layer')) items.push({ category: '이미지', name: '소스 분리', standard: '1장', quantity: count, unitPrice: UNIT_PRICES.image.separation, total: count * UNIT_PRICES.image.separation });
      if (tasks.includes('composite')) items.push({ category: '이미지', name: '합성', standard: '1장', quantity: count, unitPrice: UNIT_PRICES.image.composite, total: count * UNIT_PRICES.image.composite });
      if (tasks.includes('text')) items.push({ category: '이미지', name: '텍스트 추가', standard: '1장', quantity: count, unitPrice: UNIT_PRICES.image.text, total: count * UNIT_PRICES.image.text });
      if (tasks.includes('design')) items.push({ category: '이미지', name: '디자인 요소 추가', standard: '1장', quantity: count, unitPrice: UNIT_PRICES.image.design, total: count * UNIT_PRICES.image.design });
    }

    if (selectedTypes.includes('video')) {
      const { duration, tasks, effects, effectCounts, quality } = detailedRequests.video;
      if (tasks.includes('rolling')) items.push({ category: '영상', name: '롤링', standard: '1장', quantity: 5, unitPrice: UNIT_PRICES.video.rolling, total: 5 * UNIT_PRICES.video.rolling });
      
      const effectMultiplier = (lv: string) => lv === 'pro' ? 2.5 : 1;

      if (effects.transition !== 'none' && effectCounts.transition > 0) {
        items.push({ 
          category: '모션', 
          name: `화면전환 ${effects.transition === 'pro' ? '고급' : '기본'}`, 
          standard: '1건', 
          quantity: effectCounts.transition, 
          unitPrice: UNIT_PRICES.video.transition_basic * effectMultiplier(effects.transition), 
          total: effectCounts.transition * UNIT_PRICES.video.transition_basic * effectMultiplier(effects.transition) 
        });
      }
      if (effects.entrance !== 'none' && effectCounts.entrance > 0) {
        items.push({ 
          category: '모션', 
          name: `등장효과 ${effects.entrance === 'pro' ? '고급' : '기본'}`, 
          standard: '1건', 
          quantity: effectCounts.entrance, 
          unitPrice: UNIT_PRICES.video.entrance_basic * effectMultiplier(effects.entrance), 
          total: effectCounts.entrance * UNIT_PRICES.video.entrance_basic * effectMultiplier(effects.entrance) 
        });
      }
      if (effects.highlight !== 'none' && effectCounts.highlight > 0) {
        items.push({ 
          category: '모션', 
          name: `강조효과 ${effects.highlight === 'pro' ? '고급' : '기본'}`, 
          standard: '1건', 
          quantity: effectCounts.highlight, 
          unitPrice: UNIT_PRICES.video.highlight_basic * effectMultiplier(effects.highlight), 
          total: effectCounts.highlight * UNIT_PRICES.video.highlight_basic * effectMultiplier(effects.highlight) 
        });
      }
      if (effects.fx !== 'none' && effectCounts.fx > 0) {
        items.push({ 
          category: '모션', 
          name: `특수효과 ${effects.fx === 'pro' ? '고급' : '기본'}`, 
          standard: '1건', 
          quantity: effectCounts.fx, 
          unitPrice: UNIT_PRICES.video.fx_basic * effectMultiplier(effects.fx), 
          total: effectCounts.fx * UNIT_PRICES.video.fx_basic * effectMultiplier(effects.fx) 
        });
      }
      if (effects.animation !== 'none' && effectCounts.animation > 0) {
        items.push({ 
          category: '모션', 
          name: `애니메이션 ${effects.animation === 'pro' ? '고급' : '기본'}`, 
          standard: '1건', 
          quantity: effectCounts.animation, 
          unitPrice: UNIT_PRICES.video.animation_basic * effectMultiplier(effects.animation), 
          total: effectCounts.animation * UNIT_PRICES.video.animation_basic * effectMultiplier(effects.animation) 
        });
      }
      
      const renderQty = Math.ceil(duration / 60);
      items.push({ category: '렌더·인코딩', name: quality === '4k' ? '4K 출력' : 'FHD 출력', standard: '1분', quantity: renderQty, unitPrice: UNIT_PRICES.video.render_fhd, total: renderQty * UNIT_PRICES.video.render_fhd });
      items.push({ category: '렌더·인코딩', name: 'MP4 변환', standard: '1분', quantity: renderQty, unitPrice: UNIT_PRICES.video.convert_mp4, total: renderQty * UNIT_PRICES.video.convert_mp4 });
      
      if (tasks.includes('usb')) items.push({ category: '렌더·인코딩', name: 'USB 변환', standard: '1개', quantity: 1, unitPrice: UNIT_PRICES.video.convert_usb, total: UNIT_PRICES.video.convert_usb });
      if (panelInfo.isVideoWall) items.push({ category: '모션', name: '비디오월 기본', standard: '1건', quantity: 1, unitPrice: UNIT_PRICES.video.videoWall_basic, total: UNIT_PRICES.video.videoWall_basic });
    }

    if (selectedTypes.includes('ai-image')) {
      items.push({ category: 'AI 이미지', name: 'AI 이미지 생성', standard: '1건', quantity: detailedRequests.aiImage.count, unitPrice: UNIT_PRICES.ai.image, total: detailedRequests.aiImage.count * UNIT_PRICES.ai.image });
    }

    if (selectedTypes.includes('ai-video')) {
      items.push({ category: 'AI 영상', name: 'AI 영상 생성', standard: '1건', quantity: detailedRequests.aiVideo.count, unitPrice: UNIT_PRICES.ai.video, total: detailedRequests.aiVideo.count * UNIT_PRICES.ai.video });
    }

    return items;
  }, [selectedTypes, detailedRequests, panelInfo]);

  const subtotal = quoteItems.reduce((acc, item) => acc + item.total, 0);
  const marginAmount = subtotal * (margin / 100);
  const total = subtotal + marginAmount;

  const handleNext = () => setStep(s => Math.min(6, s + 1));
  const handlePrev = () => setStep(s => Math.max(1, s - 1));

  return (
    <div className="min-h-screen flex bg-slate-50 font-sans selection:bg-blue-100">
      <Sidebar />
      <main className="pl-[260px] flex-1 flex flex-col">
        <Header />
        <div className="flex-1 p-12 flex flex-col items-center">
          
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">영상 제작 견적 생성기</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">플랜티엠 콘텐츠 제작 단가 기준</p>
          </div>

          <div className="w-full max-w-4xl flex justify-between items-start relative px-4 mx-auto py-6 mb-10">
            {/* Background Line */}
            <div className="absolute top-[1.9rem] left-10 right-10 h-[2px] bg-slate-200 -z-10"></div>
            {/* Progress Line */}
            <motion.div 
              className="absolute top-[1.9rem] left-10 h-[2px] bg-primary -z-10"
              initial={false}
              animate={{ 
                width: `${((step - 1) / (STEPS.length - 1)) * 100}%`,
                // Adjusting width to account for the right padding/offset
                maxWidth: 'calc(100% - 5rem)' 
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-500 ${step === s.id ? 'bg-white border-primary text-primary shadow-lg shadow-blue-100 scale-110' : step > s.id ? 'bg-primary border-primary text-white' : 'bg-white border-slate-200 text-slate-400'}`}>
                  {step > s.id ? <Check size={18} strokeWidth={3} /> : s.id}
                </div>
                <span className={`text-[11px] font-black mt-3 tracking-tighter whitespace-nowrap ${step === s.id ? 'text-primary' : 'text-slate-400'}`}>{s.label}</span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={step} 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="w-full max-w-[900px] mb-12"
            >
              {step === 1 && (
                <StepCard 
                  title="기본 정보" 
                  description="견적서에 표시될 기본 정보를 입력해주세요."
                  onNext={handleNext}
                  isFirst
                >
                  <div className="grid grid-cols-2 gap-8">
                    <InputField label="업체명" placeholder="예: (주)플랜티엠" value={basicInfo.company} onChange={v => setBasicInfo({...basicInfo, company: v})} />
                    <InputField label="담당자명" placeholder="예: 홍길동" value={basicInfo.contact} onChange={v => setBasicInfo({...basicInfo, contact: v})} />
                    <InputField label="프로젝트명" placeholder="예: 매장 디지털 사이니지" value={basicInfo.project} onChange={v => setBasicInfo({...basicInfo, project: v})} />
                    <InputField label="견적일" type="date" value={basicInfo.date} onChange={v => setBasicInfo({...basicInfo, date: v})} />
                  </div>
                </StepCard>
              )}

              {step === 2 && (
                <StepCard 
                  title="패널 정보" 
                  description="제작 대상 패널의 상세 정보를 입력해주세요."
                  onNext={handleNext}
                  onPrev={handlePrev}
                >
                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <InputField label="패널 수" type="number" value={panelInfo.count.toString()} onChange={v => setPanelInfo({...panelInfo, count: Number(v)})} />
                      <SelectField 
                        label="패널 사이즈 (인치)" 
                        value={panelInfo.size} 
                        onChange={v => setPanelInfo({...panelInfo, size: v})}
                        options={[
                          { value: '32', label: '32인치' },
                          { value: '43', label: '43인치' },
                          { value: '49', label: '49인치' },
                          { value: '55', label: '55인치' },
                          { value: '65', label: '65인치' },
                          { value: '75', label: '75인치' },
                          { value: '86', label: '86인치' },
                          { value: 'custom', label: '기타 (직접입력)' },
                        ]}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">패널 형태 (방향)</label>
                        <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded-2xl">
                          <button 
                            className={`py-3 rounded-xl text-[13px] font-bold border transition-all ${panelInfo.orientation === 'horizontal' ? 'bg-white border-primary text-primary shadow-sm' : 'bg-transparent border-transparent text-slate-500'}`}
                            onClick={() => setPanelInfo({...panelInfo, orientation: 'horizontal'})}
                          >
                            가로형 (Landscape)
                          </button>
                          <button 
                            className={`py-3 rounded-xl text-[13px] font-bold border transition-all ${panelInfo.orientation === 'vertical' ? 'bg-white border-primary text-primary shadow-sm' : 'bg-transparent border-transparent text-slate-500'}`}
                            onClick={() => setPanelInfo({...panelInfo, orientation: 'vertical'})}
                          >
                            세로형 (Portrait)
                          </button>
                        </div>
                      </div>

                      <SelectField 
                        label="패널 해상도 (규격)" 
                        value={panelInfo.resolution} 
                        onChange={v => setPanelInfo({...panelInfo, resolution: v as any})}
                        options={[
                          { value: 'hd', label: '1280x720 (HD)' },
                          { value: 'fhd', label: '1920x1080 (FHD)' },
                          { value: 'uhd', label: '3840x2160 (UHD/4K)' },
                          { value: 'custom', label: '기타 해상도' },
                        ]}
                      />
                    </div>

                    <label className="flex items-center space-x-3 p-5 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                      <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary" checked={panelInfo.isVideoWall} onChange={e => setPanelInfo({...panelInfo, isVideoWall: e.target.checked})} />
                      <div className="flex items-center space-x-3">
                        <Monitor size={20} className="text-primary" />
                        <div>
                          <span className="text-sm font-bold text-slate-700 block">비디오월 (Video Wall)</span>
                          <span className="text-[11px] text-slate-400 font-medium tracking-tight">여러 패널을 하나처럼 동기화해서 보여주는 경우</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </StepCard>
              )}

              {step === 3 && (
                <StepCard 
                  title="콘텐츠 유형" 
                  description="필요한 작업을 모두 선택해주세요 (복수 선택 가능)"
                  onNext={handleNext}
                  onPrev={handlePrev}
                >
                  <div className="divide-y divide-slate-50 border border-slate-100 rounded-2xl overflow-hidden">
                    {CONTENT_OPTIONS.map((opt) => (
                      <label key={opt.id} className={`flex items-center p-6 transition-all hover:bg-slate-50 cursor-pointer ${selectedTypes.includes(opt.id) ? 'bg-blue-50/30' : ''}`}>
                        <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-primary" checked={selectedTypes.includes(opt.id)} onChange={() => setSelectedTypes(prev => prev.includes(opt.id) ? prev.filter(t => t !== opt.id) : [...prev, opt.id])} />
                        <div className="ml-6 flex-1 flex items-center">
                          <div className="p-2 bg-blue-50 rounded-lg text-primary mr-4">{opt.icon}</div>
                          <div>
                            <p className="font-bold text-slate-900">{opt.title}</p>
                            <p className="text-[12px] text-slate-400">{opt.description}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </StepCard>
              )}

              {step === 4 && (
                <StepCard 
                  title="세부 요청사항" 
                  description="선택한 유형별로 구체적인 작업 내용을 설정합니다."
                  onNext={handleNext}
                  onPrev={handlePrev}
                >
                  <div className="space-y-10">
                    {selectedTypes.includes('image') && (
                      <div className="space-y-6">
                        <h4 className="text-sm font-black text-primary border-b-2 border-primary w-fit pb-1">이미지 제작</h4>
                        <div className="grid grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl">
                          <button className={`p-3 rounded-lg text-[13px] font-bold border transition-all ${!detailedRequests.image.needsResearch ? 'bg-white border-primary text-primary shadow-sm' : 'bg-transparent border-slate-200 text-slate-500'}`} onClick={() => setDetailedRequests({...detailedRequests, image: {...detailedRequests.image, needsResearch: false}})}>이미지 보유 있음</button>
                          <button className={`p-3 rounded-lg text-[13px] font-bold border transition-all ${detailedRequests.image.needsResearch ? 'bg-white border-primary text-primary shadow-sm' : 'bg-transparent border-slate-200 text-slate-500'}`} onClick={() => setDetailedRequests({...detailedRequests, image: {...detailedRequests.image, needsResearch: true}})}>이미지 제작 필요 (리서치 포함)</button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                          <span className="text-[13px] text-slate-700 font-bold">총 이미지 수</span>
                            <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => setDetailedRequests({
                                ...detailedRequests,
                                image: { ...detailedRequests.image, count: Math.max(0, detailedRequests.image.count - 1) }
                              })}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                            >
                              <Minus size={12} strokeWidth={4} />
                            </button>
                            <div className="px-2 flex items-center space-x-0.5 min-w-[3rem] justify-center bg-slate-100/50 rounded-lg mx-1">
                              <input 
                                type="number" 
                                className="w-8 bg-transparent text-[14px] font-black text-slate-700 font-mono text-center outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={detailedRequests.image.count}
                                onChange={(e) => setDetailedRequests({
                                  ...detailedRequests,
                                  image: { ...detailedRequests.image, count: Math.max(0, Number(e.target.value)) }
                                })}
                              />
                              <span className="text-[11px] font-bold text-slate-300">장</span>
                            </div>
                            <button 
                              onClick={() => setDetailedRequests({
                                ...detailedRequests,
                                image: { ...detailedRequests.image, count: detailedRequests.image.count + 1 }
                              })}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                            >
                              <Plus size={12} strokeWidth={4} />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <p className="text-[11px] font-bold text-slate-400 uppercase">필요한 편집 작업 (복수 선택)</p>
                          <div className="grid grid-cols-2 gap-4">
                            {['size', 'bg', 'layer', 'composite', 'text', 'design'].map(t => (
                              <label key={t} className="flex items-center space-x-2 text-[13px] text-slate-600 cursor-pointer p-2 hover:bg-slate-50 rounded-lg">
                                <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary" checked={detailedRequests.image.tasks.includes(t)} onChange={() => {
                                  const tasks = detailedRequests.image.tasks.includes(t) ? detailedRequests.image.tasks.filter(x => x !== t) : [...detailedRequests.image.tasks, t];
                                  setDetailedRequests({...detailedRequests, image: {...detailedRequests.image, tasks}});
                                }} />
                                <span>{t === 'size' ? '사이즈/비율 변경' : t === 'bg' ? '배경 제거(누끼)' : t === 'layer' ? '소스 분리(레이어)' : t === 'composite' ? '합성' : t === 'text' ? '텍스트 추가' : '디자인 요소 추가'}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTypes.includes('video') && (
                      <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-black text-primary border-b-2 border-primary w-fit pb-1">영상·모션 제작</h4>
                        <InputField label="영상 길이 (초)" type="number" placeholder="예: 30" value={detailedRequests.video.duration.toString()} onChange={v => setDetailedRequests({...detailedRequests, video: {...detailedRequests.video, duration: Number(v)}})} />
                        <div className="grid grid-cols-2 gap-4">
                          {['rolling', 'subtitles', 'usb', 'conversion'].map(t => (
                            <label key={t} className="flex items-center space-x-2 text-[13px] text-slate-600 cursor-pointer">
                              <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary" checked={detailedRequests.video.tasks.includes(t)} onChange={() => {
                                const tasks = detailedRequests.video.tasks.includes(t) ? detailedRequests.video.tasks.filter(x => x !== t) : [...detailedRequests.video.tasks, t];
                                setDetailedRequests({...detailedRequests, video: {...detailedRequests.video, tasks}});
                              }} />
                              <span>{t === 'rolling' ? '컷 편집' : t === 'subtitles' ? '자막 삽입' : t === 'usb' ? 'USB 변환 필요 (LG 패널용)' : '이미지/영상 롤링'}</span>
                            </label>
                          ))}
                        </div>
                        <div className="space-y-4">
                          <p className="text-[11px] font-bold text-slate-400 uppercase">모션 효과 상세 설정 (수량 입력)</p>
                          {Object.entries(detailedRequests.video.effects).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                              <span className="text-[13px] text-slate-700 font-bold capitalize w-20 shrink-0">{key === 'transition' ? '화면전환' : key === 'entrance' ? '등장효과' : key === 'highlight' ? '강조효과' : key === 'fx' ? '특수효과' : '애니메이션'}</span>
                              
                              <div className="flex items-center space-x-6">
                                {value !== 'none' && (
                                  <div className="flex items-center space-x-1 animate-in fade-in slide-in-from-right-2 duration-300">
                                    <button 
                                      onClick={() => {
                                        const current = detailedRequests.video.effectCounts[key as keyof typeof detailedRequests.video.effectCounts];
                                        setDetailedRequests({
                                          ...detailedRequests,
                                          video: {
                                            ...detailedRequests.video,
                                            effectCounts: { ...detailedRequests.video.effectCounts, [key]: Math.max(0, current - 1) }
                                          }
                                        });
                                      }}
                                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                                    >
                                      <Minus size={10} strokeWidth={4} />
                                    </button>
                                    <div className="px-1 flex items-center space-x-0.5 min-w-[2.5rem] justify-center bg-slate-100/30 rounded-lg mx-0.5">
                                      <input 
                                        type="number" 
                                        className="w-7 bg-transparent text-[13px] font-black text-slate-700 font-mono text-center outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        value={detailedRequests.video.effectCounts[key as keyof typeof detailedRequests.video.effectCounts]}
                                        onChange={(e) => setDetailedRequests({
                                          ...detailedRequests,
                                          video: {
                                            ...detailedRequests.video,
                                            effectCounts: { ...detailedRequests.video.effectCounts, [key]: Math.max(0, Number(e.target.value)) }
                                          }
                                        })}
                                      />
                                      <span className="text-[10px] font-bold text-slate-300">건</span>
                                    </div>
                                    <button 
                                      onClick={() => {
                                        const current = detailedRequests.video.effectCounts[key as keyof typeof detailedRequests.video.effectCounts];
                                        setDetailedRequests({
                                          ...detailedRequests,
                                          video: {
                                            ...detailedRequests.video,
                                            effectCounts: { ...detailedRequests.video.effectCounts, [key]: current + 1 }
                                          }
                                        });
                                      }}
                                      className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                                    >
                                      <Plus size={10} strokeWidth={4} />
                                    </button>
                                  </div>
                                )}

                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                  {['none', 'basic', 'pro'].map(lv => (
                                    <button 
                                      key={lv} 
                                      className={`px-5 py-2 rounded-lg text-[11px] font-black transition-all ${value === lv ? 'bg-white text-primary shadow-md shadow-blue-100/30' : 'text-slate-400 hover:text-slate-500'}`} 
                                      onClick={() => setDetailedRequests({...detailedRequests, video: {...detailedRequests.video, effects: {...detailedRequests.video.effects, [key]: lv}}})}
                                    >
                                      {lv === 'none' ? '없음' : lv === 'basic' ? '기본' : '고급'}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      <div className="space-y-4 pt-4 border-t border-slate-50">
                        <p className="text-[11px] font-bold text-slate-400 uppercase">출력 품질</p>
                        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                          {['fhd', '4k'].map(q => (
                            <button 
                              key={q} 
                              className={`px-8 py-2 rounded-lg text-[12px] font-black transition-all ${detailedRequests.video.quality === q ? 'bg-white text-primary shadow-sm' : 'text-slate-400'}`}
                              onClick={() => setDetailedRequests({...detailedRequests, video: {...detailedRequests.video, quality: q as any}})}
                            >
                              {q === 'fhd' ? 'Full HD' : '4K 이상'}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedTypes.includes('ai-image') && (
                      <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-black text-primary border-b-2 border-primary w-fit pb-1">AI 이미지 생성</h4>
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                          <span className="text-[13px] text-slate-700 font-bold">생성 수량</span>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => setDetailedRequests({
                                ...detailedRequests,
                                aiImage: { count: Math.max(0, detailedRequests.aiImage.count - 1) }
                              })}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                            >
                              <Minus size={12} strokeWidth={4} />
                            </button>
                            <div className="px-2 flex items-center space-x-0.5 min-w-[3rem] justify-center bg-slate-100/50 rounded-lg mx-1">
                              <input 
                                type="number" 
                                className="w-8 bg-transparent text-[14px] font-black text-slate-700 font-mono text-center outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={detailedRequests.aiImage.count}
                                onChange={(e) => setDetailedRequests({
                                  ...detailedRequests,
                                  aiImage: { count: Math.max(0, Number(e.target.value)) }
                                })}
                              />
                              <span className="text-[11px] font-bold text-slate-300">건</span>
                            </div>
                            <button 
                              onClick={() => setDetailedRequests({
                                ...detailedRequests,
                                aiImage: { count: detailedRequests.aiImage.count + 1 }
                              })}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                            >
                              <Plus size={12} strokeWidth={4} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedTypes.includes('ai-video') && (
                      <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h4 className="text-sm font-black text-primary border-b-2 border-primary w-fit pb-1">AI 영상 생성</h4>
                        <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                          <span className="text-[13px] text-slate-700 font-bold">생성 수량</span>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => setDetailedRequests({
                                ...detailedRequests,
                                aiVideo: { count: Math.max(0, detailedRequests.aiVideo.count - 1) }
                              })}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                            >
                              <Minus size={12} strokeWidth={4} />
                            </button>
                            <div className="px-2 flex items-center space-x-0.5 min-w-[3rem] justify-center bg-slate-100/50 rounded-lg mx-1">
                              <input 
                                type="number" 
                                className="w-8 bg-transparent text-[14px] font-black text-slate-700 font-mono text-center outline-none border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                value={detailedRequests.aiVideo.count}
                                onChange={(e) => setDetailedRequests({
                                  ...detailedRequests,
                                  aiVideo: { count: Math.max(0, Number(e.target.value)) }
                                })}
                              />
                              <span className="text-[11px] font-bold text-slate-300">건</span>
                            </div>
                            <button 
                              onClick={() => setDetailedRequests({
                                ...detailedRequests,
                                aiVideo: { count: detailedRequests.aiVideo.count + 1 }
                              })}
                              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-primary transition-all active:scale-90"
                            >
                              <Plus size={12} strokeWidth={4} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </StepCard>
              )}

              {step === 5 && (
                <StepCard 
                  title="마진 설정" 
                  description="프로젝트의 마진율을 설정하여 최종 견적가를 산출합니다."
                  onNext={handleNext}
                  onPrev={handlePrev}
                  nextLabel="견적 확인"
                >
                  <div className="space-y-10">
                    <div>
                      <label className="text-[11px] font-black text-slate-400 uppercase mb-4 block">마진율 (%)</label>
                      <div className="flex items-center space-x-6">
                        <input type="range" min="0" max="100" step="5" value={margin} onChange={e => setMargin(Number(e.target.value))} className="flex-1 accent-primary" />
                        <div className="w-20 bg-blue-50 text-primary text-center py-2 rounded-xl font-black text-xl ring-2 ring-blue-100">{margin}%</div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        {[0, 10, 20, 30, 50].map(m => (
                          <button key={m} className={`px-4 py-1.5 rounded-lg text-[12px] font-bold transition-all ${margin === m ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`} onClick={() => setMargin(m)}>{m}%</button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-2xl p-8 text-white space-y-4 shadow-xl">
                      <div className="flex justify-between text-slate-400 text-sm">
                        <span>공급 원가 (Subtotal)</span>
                        <span className="font-mono">{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-blue-400 text-sm font-bold">
                        <span>마진 ({margin}%)</span>
                        <span className="font-mono">+ {formatCurrency(marginAmount)}</span>
                      </div>
                      <div className="h-px bg-slate-800 my-4"></div>
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold">최종 제작가</span>
                        <div className="text-right">
                          <p className="text-3xl font-black font-mono text-white leading-none">{formatCurrency(total)}</p>
                          <p className="text-[11px] text-slate-500 mt-2">※ VAT 별도</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </StepCard>
              )}

              {step === 6 && (
                <div className="w-full space-y-10">
                  <StepCard title="견적 결과 (내부용)" description={`${basicInfo.company} · ${basicInfo.project} · ${basicInfo.date}`}>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-y border-slate-100">
                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase">구분</th>
                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase">작업 항목</th>
                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase">기준</th>
                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase text-center">수량</th>
                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase text-right">단가</th>
                            <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase text-right">합계</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {quoteItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-6 py-4 text-[12px] font-bold text-slate-500">{item.category}</td>
                              <td className="px-6 py-4 text-[13px] font-bold text-slate-900">{item.name}</td>
                              <td className="px-6 py-4 text-[12px] text-slate-400">{item.standard}</td>
                              <td className="px-6 py-4 text-[13px] font-black text-slate-700 text-center font-mono">{item.quantity}</td>
                              <td className="px-6 py-4 text-[13px] text-slate-500 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                              <td className="px-6 py-4 text-[13px] font-black text-slate-900 text-right font-mono">{formatCurrency(item.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50/80 font-bold">
                            <td colSpan={5} className="px-6 py-5 text-right text-slate-500 text-sm">원가 소계</td>
                            <td className="px-6 py-5 text-right font-mono text-slate-900">{formatCurrency(subtotal)}</td>
                          </tr>
                          <tr className="bg-blue-50/30 font-bold border-y border-blue-100">
                            <td colSpan={5} className="px-6 py-5 text-right text-primary text-sm">마진 ({margin}%)</td>
                            <td className="px-6 py-5 text-right font-mono text-primary">+ {formatCurrency(marginAmount)}</td>
                          </tr>
                          <tr className="bg-primary/5 font-black text-lg">
                            <td colSpan={5} className="px-6 py-6 text-right text-slate-900 tracking-tighter">최종 견적가 (VAT 별도)</td>
                            <td className="px-6 py-6 text-right font-mono text-primary">{formatCurrency(total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </StepCard>

                  <div className="flex space-x-6">
                    <button className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-3xl font-black text-sm flex items-center justify-center space-x-3 shadow-sm hover:bg-slate-50 transition-all">
                      <Download size={20} />
                      <span>PDF 다운로드 (업체용)</span>
                    </button>
                    <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-sm flex items-center justify-center space-x-3 shadow-lg shadow-slate-200 hover:bg-black transition-all">
                      <RotateCcw size={20} />
                      <span>새 견적서 작성</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation Buttons are now inside StepCard footer */}
          <div className="h-12" />

          {/* Guidelines */}
          {step < 6 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[800px] mb-24">
              <InfoCard icon={<Info size={24} className="text-primary" />} title="다중 선택 안내" description="서로 다른 유형의 작업을 결합하여 한 번에 견적을 낼 수 있습니다. 다음 단계에서 세부 항목을 설정합니다." />
              <InfoCard icon={<ShieldCheck size={24} className="text-primary" />} title="표준 단가 준수" description="본 시스템은 2024년도 플랜티엠 콘텐츠 제작 표준 단가표를 기준으로 투명한 견적을 제공합니다." />
            </div>
          )}
          {/* Results Summary Info Card */}
          {step === 6 && (
            <div className="w-full max-w-[900px] mb-12">
               <div className="bg-slate-900 rounded-2xl p-6 text-white flex justify-between items-center shadow-lg">
                 <div className="flex items-center space-x-6 divide-x divide-slate-800">
                    <div className="px-4 first:pl-0">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">패널 규모</p>
                      <p className="text-sm font-bold">{panelInfo.count}대 / {panelInfo.size}인치</p>
                    </div>
                    <div className="px-4">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">해상도 / 방향</p>
                      <p className="text-sm font-bold uppercase">{panelInfo.resolution} / {panelInfo.orientation === 'horizontal' ? '가로' : '세로'}</p>
                    </div>
                    <div className="px-4">
                      <p className="text-[10px] text-slate-500 uppercase font-black mb-1">콘텐츠</p>
                      <p className="text-sm font-bold">{selectedTypes.length}개 유형 선택됨</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] text-blue-400 uppercase font-black mb-1">최종 제작가 (VAT 별도)</p>
                    <p className="text-2xl font-black font-mono text-white">{formatCurrency(total)}</p>
                 </div>
               </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// --- Helper Components ---

const StepCard = ({ title, description, children, onNext, onPrev, nextLabel, prevLabel, isFirst = false, isLast = false }: { 
  title: string, 
  description: string, 
  children: React.ReactNode,
  onNext?: () => void,
  onPrev?: () => void,
  nextLabel?: string,
  prevLabel?: string,
  isFirst?: boolean,
  isLast?: boolean
}) => (
  <div className="w-full bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
    <div className="p-10 border-b border-slate-50 bg-slate-50/30">
      <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-400 font-medium">{description}</p>
    </div>
    <div className="p-10">
      {children}
    </div>
    {(onNext || onPrev) && (
      <div className="flex border-t border-slate-100 divide-x divide-slate-100">
        {!isFirst && (
          <button 
            onClick={onPrev}
            className="flex-1 py-6 bg-slate-50 text-slate-500 font-bold flex items-center justify-center space-x-2 hover:bg-slate-100 active:bg-slate-200 transition-all"
          >
            <ArrowLeft size={18} />
            <span className="text-sm tracking-tighter uppercase">{prevLabel || '이전'}</span>
          </button>
        )}
        {!isLast && (
          <button 
            onClick={onNext}
            className="flex-1 py-6 bg-primary text-white font-bold flex items-center justify-center space-x-2 hover:bg-blue-700 active:scale-[0.98] transition-all"
          >
            <span className="text-sm tracking-tighter uppercase">{nextLabel || '다음'}</span>
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    )}
  </div>
);

const SelectField = ({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: { value: string, label: string }[] }) => (
  <div className="space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
    <div className="relative">
      <select 
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 focus:bg-white transition-all outline-none appearance-none cursor-pointer"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronRight size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none" />
    </div>
  </div>
);

const InputField = ({ label, type = 'text', placeholder, value, onChange }: { label: string, type?: string, placeholder?: string, value: string, onChange: (v: string) => void }) => (
  <div className="space-y-2">
    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
    <input 
      type={type} 
      placeholder={placeholder} 
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl py-3.5 px-5 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-primary/5 focus:border-primary/20 focus:bg-white transition-all outline-none" 
    />
  </div>
);
