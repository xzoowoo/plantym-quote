export interface BasicInfo {
  companyName: string;
  contactName: string;
  projectName: string;
  date: string;
}

export interface PanelInfo {
  count: number;
  size: string;
  isVideoWall: boolean;
}

export type ContentType = "image" | "video" | "ai-image" | "ai-video";

export type ImageTask =
  | "resize"
  | "remove-bg"
  | "separate"
  | "reposition"
  | "composite"
  | "text"
  | "design-element";

export interface ImageDetails {
  hasSource: boolean;
  imageCount: number;
  tasks: ImageTask[];
}

export type EffectLevel = "none" | "basic" | "advanced";

export interface VideoDetails {
  durationSeconds: number;
  cutEdit: boolean;
  subtitle: boolean;
  rolling: boolean;
  rollingCount: number;
  transition: EffectLevel;
  transitionCount: number;
  entrance: EffectLevel;
  entranceCount: number;
  emphasis: EffectLevel;
  emphasisCount: number;
  special: EffectLevel;
  specialCount: number;
  animation: EffectLevel;
  animationCount: number;
  renderQuality: "fhd" | "4k";
  usbConvert: boolean;
}

export interface AIImageDetails {
  count: number;
}

export interface AIVideoDetails {
  count: number;
}

export interface QuoteInput {
  basicInfo: BasicInfo;
  panelInfo: PanelInfo;
  contentTypes: ContentType[];
  imageDetails: ImageDetails;
  videoDetails: VideoDetails;
  aiImageDetails: AIImageDetails;
  aiVideoDetails: AIVideoDetails;
  freeText: string;
  marginRate: number;
}

export interface LineItem {
  category: "image" | "video" | "motion" | "render" | "ai-image" | "ai-video";
  name: string;
  unit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface CategorySummary {
  label: string;
  amount: number;
}

export interface QuoteResult {
  lineItems: LineItem[];
  costSubtotal: number;
  marginAmount: number;
  totalPrice: number;
  categorySummary: CategorySummary[];
}

export interface WizardState {
  step: number;
  input: QuoteInput;
  result: QuoteResult | null;
}
