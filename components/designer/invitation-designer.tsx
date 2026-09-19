"use client";

import { useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronDown,
  CircleDollarSign,
  Code2,
  Clock3,
  Copy,
  Eye,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  Info,
  LockKeyhole,
  Loader2,
  MapPin,
  Monitor,
  MoveDown,
  MoveUp,
  Palette,
  Phone,
  Plus,
  RotateCcw,
  Rocket,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { InvitationPhonePreview } from "@/components/invitation/invitation-preview";
import { OrderConfirmationModal } from "@/components/invitation/order-confirmation-modal";
import { WhatsAppIcon } from "@/components/shared/whatsapp-icon";
import { copyToClipboard } from "@/lib/copy-to-clipboard";
import { createPhotoPreparationManager, isHeicPhoto, maxOriginalImageBytes, preparePhotoPreview, selectedUploadedPhotos, uploadPendingPhotos } from "@/lib/photo-upload";
import type { UploadedPhoto } from "@/lib/media-submission";
import { customerWhatsAppUrl, invitationPublicUrl } from "@/lib/whatsapp-messages";
import {
  customSectionCssField,
  customSectionHtmlField,
  maxCustomSectionCssLength,
  maxCustomSectionHtmlLength,
} from "@/lib/custom-sections";
import {
  calculateInvitationPrice,
  createInitialInvitation,
  createSection,
  getCoupleInitials,
  getPalette,
  getHeroPresets,
  getSectionItems,
  invitationThemeVariableDefinitions,
  normalizeInvitationConfig,
  openingAssets,
  openingOptions,
  paletteOptions,
  sectionDefinitions,
  type HeroType,
  type InvitationConfig,
  type InvitationSection,
  type InvitationSectionItem,
  type OpeningType,
  type PaletteId,
  type SectionType,
} from "@/lib/invitation-designer";
import {
  getPrimaryEventDate,
  makeInvitationSlug,
  type InvitationOrderRecord,
  type InvitationOrderSummary,
} from "@/lib/invitation-orders";

type SubmissionIdentity = { id: string; uploadToken?: string };
type SaveState = "idle" | "saving" | "saved" | "submitted" | "error";
type PreviewFocus = { target: string; key: number };
export type AdminInvitationOrder = InvitationOrderRecord & { summary: InvitationOrderSummary };

type InvitationDesignerProps = {
  adminOrder?: AdminInvitationOrder;
  exampleConfig?: InvitationConfig;
  exampleName?: string;
  exampleSlug?: string;
  today?: string;
  publicOrigin?: string;
  onAdminBack?: () => void;
  onAdminOrderChange?: (order: AdminInvitationOrder) => void;
};

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const whatsappSupportNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
const whatsappSupportMessage = "Hi, I had trouble saving my invitation design. Could you please help me?";

export function InvitationDesigner({ adminOrder, exampleConfig, exampleName = "Example invitation", exampleSlug = "", today = "", publicOrigin = "https://www.paperless-invites.com", onAdminBack, onAdminOrderChange }: InvitationDesignerProps = {}) {
  const adminMode = Boolean(adminOrder);
  const readOnlyMode = Boolean(exampleConfig);
  const [config, setConfig] = useState<InvitationConfig>(() => exampleConfig
    ? normalizeInvitationConfig(exampleConfig)
    : adminOrder
      ? normalizeInvitationConfig(adminOrder.config)
      : createInitialInvitation());
  const previewConfig = useDeferredValue(config);
  const [addType, setAddType] = useState<SectionType>("special-message");
  const [newlyAddedSectionId, setNewlyAddedSectionId] = useState("");
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
  const [photoProcessing, setPhotoProcessing] = useState(0);
  const [photoPreviewProcessing, setPhotoPreviewProcessing] = useState(0);
  const [photoProcessingTarget, setPhotoProcessingTarget] = useState<"" | "hero" | "save" | `section:${string}:images`>("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [photoSizeNoticeKey, setPhotoSizeNoticeKey] = useState(0);
  const [photoCountNoticeKey, setPhotoCountNoticeKey] = useState(0);
  const [showDesktopTip, setShowDesktopTip] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [previewFocus, setPreviewFocus] = useState<PreviewFocus>({ target: "hero", key: 0 });
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [currentAdminOrder, setCurrentAdminOrder] = useState<AdminInvitationOrder | null>(adminOrder ?? null);
  const [adminPrice, setAdminPrice] = useState(adminOrder?.total_price ?? 1000);
  const [adminSlug, setAdminSlug] = useState(adminOrder?.slug ?? "");
  const [adminActiveUntil, setAdminActiveUntil] = useState(() => adminOrder ? suggestActiveUntil(adminOrder, normalizeInvitationConfig(adminOrder.config), today) : "");
  const [adminAction, setAdminAction] = useState<"deploy" | "deactivate" | "review" | "">("");
  const [adminConfirmation, setAdminConfirmation] = useState<"deactivate" | "review" | "">("");
  const [adminConfirmationError, setAdminConfirmationError] = useState("");
  const [adminNotice, setAdminNotice] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const submissionKeyRef = useRef<string | null>(null);
  const submissionRef = useRef<SubmissionIdentity | null>(null);
  const preparedPhotoRef = useRef(new Map<File, File>());
  const uploadedPhotoUrlsRef = useRef(new Map<string, UploadedPhoto>());
  const objectUrls = useRef<string[]>([]);
  const pendingFilesRef = useRef<Record<string, File[]>>({});
  const localPhotoIdsRef = useRef(new Map<File, string>());
  const photoSlotByFileRef = useRef(new Map<File, string>());
  const previewFileByUrlRef = useRef(new Map<string, File>());
  const previewSourceByFileRef = useRef(new Map<File, Blob>());
  const heicPreviewJobsRef = useRef(new Map<File, { id: string; target: "" | "hero" | `section:${string}:images`; promise: Promise<void> }>());
  const glimpseHeicReservationsRef = useRef(new Map<string, Set<File>>());
  const processingPhotosRef = useRef(0);
  const previewProcessingRef = useRef(0);
  const photoPreparationManagerRef = useRef<ReturnType<typeof createPhotoPreparationManager> | null>(null);
  const sectionMoveAnchor = useRef<{ id: string; top: number; focusedControl: HTMLElement | null } | null>(null);

  if (!photoPreparationManagerRef.current) {
    photoPreparationManagerRef.current = createPhotoPreparationManager(preparedPhotoRef.current, 2, (delta) => setProcessing(delta));
  }
  const price = useMemo(() => calculateInvitationPrice(config), [config]);
  const palette = getPalette(config.palette);
  const availableHeroPresets = getHeroPresets(config);
  const saveButtonText = saveState === "saving"
    ? "Saving…"
    : saveState === "submitted"
      ? "Invitation sent for processing"
      : saveState === "saved"
        ? "Changes saved"
        : adminMode
          ? currentAdminOrder?.status === "active" ? "Update live invitation" : "Save edits"
          : "Save my design";
  const hasCustomPart = config.sections.some((section) => section.type === "custom");
  const pendingPhotoCount = Object.values(pendingFiles).reduce((count, files) => count + files.length, 0);
  const photoProgressLabel = photoProcessingTarget === "save"
    ? photoProcessing > 0 ? "Optimizing…" : "Uploading…"
    : "Preparing preview…";
  const whatsappSupportUrl = whatsappSupportNumber
    ? `https://wa.me/${whatsappSupportNumber}?text=${encodeURIComponent(whatsappSupportMessage)}`
    : "/#consultation";

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current = [];
    previewFileByUrlRef.current.clear();
    previewSourceByFileRef.current.clear();
    localPhotoIdsRef.current.clear();
    photoSlotByFileRef.current.clear();
    heicPreviewJobsRef.current.clear();
    glimpseHeicReservationsRef.current.clear();
    photoPreparationManagerRef.current?.clear(false);
  }, []);

  useEffect(() => {
    function closeOpenPicker(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      document.querySelectorAll<HTMLDetailsElement>(".designer-part-picker details[open]").forEach((picker) => {
        if (!picker.contains(target)) picker.open = false;
      });
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      document.querySelectorAll<HTMLDetailsElement>(".designer-part-picker details[open]").forEach((picker) => {
        picker.open = false;
      });
    }

    document.addEventListener("pointerdown", closeOpenPicker);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOpenPicker);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = window.setTimeout(() => window.location.assign("/"), 7000);
    return () => window.clearTimeout(timer);
  }, [showSuccess]);

  useEffect(() => {
    if (!adminMode || (!adminNotice && !saveError)) return;
    const timer = window.setTimeout(() => { setAdminNotice(""); setSaveError(""); }, 5000);
    return () => window.clearTimeout(timer);
  }, [adminMode, adminNotice, saveError]);

  useLayoutEffect(() => {
    const anchor = sectionMoveAnchor.current;
    if (!anchor) return;
    sectionMoveAnchor.current = null;
    const editor = document.getElementById(`editor-${anchor.id}`);
    if (!editor) return;
    const topDifference = editor.getBoundingClientRect().top - anchor.top;
    if (Math.abs(topDifference) > 0.5) {
      window.scrollBy({ top: topDifference, left: 0, behavior: "instant" });
    }
    if (anchor.focusedControl?.isConnected) anchor.focusedControl.focus({ preventScroll: true });
  }, [config.sections]);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowDesktopTip(false), 7000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!photoSizeNoticeKey) return;
    const timer = window.setTimeout(() => setPhotoSizeNoticeKey(0), 3000);
    return () => window.clearTimeout(timer);
  }, [photoSizeNoticeKey]);

  useEffect(() => {
    if (!photoCountNoticeKey) return;
    const timer = window.setTimeout(() => setPhotoCountNoticeKey(0), 3000);
    return () => window.clearTimeout(timer);
  }, [photoCountNoticeKey]);

  function updateConfig(updater: (current: InvitationConfig) => InvitationConfig) {
    if (saveState === "saving" || adminAction) return;
    submissionKeyRef.current = null;
    submissionRef.current = null;
    uploadedPhotoUrlsRef.current.clear();
    setConfig((current) => updater(current));
    if (saveState === "saved") setSaveState("idle");
    if (saveError) setSaveError("");
    if (adminNotice) setAdminNotice("");
  }

  function activatePreview(target: string) {
    setPreviewFocus((current) => ({ target, key: current.key + 1 }));
  }

  function choosePalette(id: PaletteId) {
    updateConfig((current) => ({ ...current, palette: id }));
  }

  function chooseBismillah(enabled: boolean) {
    updateConfig((current) => ({ ...current, bismillah: { enabled } }));
    activatePreview("bismillah");
  }

  function chooseOpening(type: OpeningType) {
    const defaultAsset = type === "curtain" ? openingAssets.curtain[0].id : openingAssets.envelope[0].id;
    updateConfig((current) => ({ ...current, opening: { ...current.opening, type, asset: defaultAsset } }));
    setReplayKey((key) => key + 1);
    activatePreview(type === "none" ? "hero" : "opening");
  }

  function chooseHero(type: HeroType) {
    clearPhotoSlot("hero");
    updateConfig((current) => ({
      ...current,
      hero: { ...current.hero, type, photoSource: "preset", presetIndex: 0, uploadedUrl: "" },
    }));
    activatePreview("hero");
  }

  function chooseHeroPreset(index: number) {
    clearPhotoSlot("hero");
    updateConfig((current) => ({ ...current, hero: { ...current.hero, photoSource: "preset", presetIndex: index, uploadedUrl: "" } }));
    activatePreview("hero");
  }

  function updateHero(field: keyof InvitationConfig["hero"], value: string | number) {
    updateConfig((current) => {
      const hero = { ...current.hero, [field]: value } as InvitationConfig["hero"];
      return {
        ...current,
        hero,
        opening: field === "firstName" || field === "secondName"
          ? { ...current.opening, initials: getCoupleInitials(hero.firstName, hero.secondName) }
          : current.opening,
      };
    });
  }

  function updateContact(field: keyof InvitationConfig["contact"], value: string) {
    const normalized = field === "phone" ? value.replace(/\D/g, "").slice(0, 8) : value;
    if (validationErrors.length) setValidationErrors([]);
    updateConfig((current) => ({ ...current, contact: { ...current.contact, [field]: normalized } }));
  }

  function updateSection(id: string, updater: (section: InvitationSection) => InvitationSection) {
    updateConfig((current) => ({
      ...current,
      sections: current.sections.map((section) => section.id === id ? updater(section) : section),
    }));
  }

  function updateSectionField(id: string, field: string, value: string) {
    updateSection(id, (section) => ({ ...section, fields: { ...section.fields, [field]: value } }));
  }

  function updateSectionItem(id: string, itemIndex: number, field: string, value: string) {
    updateSection(id, (section) => {
      const items = getSectionItems(section).map((item) => ({ ...item }));
      items[itemIndex] = { ...items[itemIndex], [field]: value };
      return { ...section, items };
    });
  }

  function addSectionItem(id: string, item: InvitationSectionItem) {
    updateSection(id, (section) => ({ ...section, items: [...getSectionItems(section), item] }));
    activatePreview(id);
  }

  function removeSectionItem(id: string, itemIndex: number) {
    updateSection(id, (section) => ({ ...section, items: getSectionItems(section).filter((_, index) => index !== itemIndex) }));
    activatePreview(id);
  }

  function addSection(type = addType) {
    const section = createSection(type, false);
    if (adminMode && type === "custom") section.title = "Custom Section";
    setNewlyAddedSectionId(section.id);
    updateConfig((current) => ({ ...current, sections: [...current.sections, section] }));
    activatePreview(section.id);
    window.setTimeout(() => document.getElementById(`editor-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function duplicateSection(section: InvitationSection) {
    const copy: InvitationSection = {
      ...section,
      id: createSection(section.type).id,
      included: false,
      fields: { ...section.fields },
      items: getSectionItems(section).map((item) => ({ ...item })),
      images: section.images.filter((url) => !url.startsWith("blob:")),
    };
    setNewlyAddedSectionId(copy.id);
    updateConfig((current) => {
      const index = current.sections.findIndex((item) => item.id === section.id);
      const sections = [...current.sections];
      sections.splice(index + 1, 0, copy);
      return { ...current, sections };
    });
    activatePreview(copy.id);
    window.setTimeout(() => document.getElementById(`editor-${copy.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function removeSection(id: string) {
    const section = config.sections.find((item) => item.id === id);
    if (!section || section.included) return;
    const slot = `section:${id}:images`;
    clearPhotoSlot(slot);
    section.images.filter((url) => url.startsWith("blob:")).forEach((url) => {
      if (previewFileByUrlRef.current.has(url)) return;
      revokePreviewUrl(url);
    });
    updateConfig((current) => ({ ...current, sections: current.sections.filter((item) => item.id !== id) }));
  }

  function moveSection(id: string, direction: -1 | 1) {
    const editor = document.getElementById(`editor-${id}`);
    sectionMoveAnchor.current = editor
      ? {
          id,
          top: editor.getBoundingClientRect().top,
          focusedControl: document.activeElement instanceof HTMLElement ? document.activeElement : null,
        }
      : null;
    updateConfig((current) => {
      const index = current.sections.findIndex((section) => section.id === id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.sections.length) return current;
      const sections = [...current.sections];
      [sections[index], sections[nextIndex]] = [sections[nextIndex], sections[index]];
      return { ...current, sections };
    });
    activatePreview(id);
  }

  function validateFiles(files: File[]) {
    if (files.find((file) => !acceptedImageTypes.has(file.type) && !isHeicPhoto(file))) return "Please choose JPG, PNG, WebP or iPhone HEIC photos.";
    if (files.find((file) => file.size > maxOriginalImageBytes)) return "Each photo must be 5 MB or smaller.";
    return "";
  }

  function showFileValidationError(files: File[]) {
    const error = validateFiles(files);
    if (!error) return false;
    if (!adminMode && files.some((file) => file.size > maxOriginalImageBytes)) setPhotoSizeNoticeKey((key) => key + 1);
    else setSaveError(error);
    return true;
  }

  function setProcessing(delta: number) {
    processingPhotosRef.current = Math.max(0, processingPhotosRef.current + delta);
    setPhotoProcessing(processingPhotosRef.current);
  }

  function refreshPreviewProcessingTarget() {
    const active = [...heicPreviewJobsRef.current.values()].pop();
    setPhotoProcessingTarget((current) => current === "save" ? current : active?.target ?? "");
  }

  function setPreviewProcessing(delta: number) {
    previewProcessingRef.current = Math.max(0, previewProcessingRef.current + delta);
    setPhotoPreviewProcessing(previewProcessingRef.current);
    if (previewProcessingRef.current === 0) {
      setPhotoProcessingTarget((current) => current === "save" ? current : "");
    }
  }

  function updatePendingFiles(updater: (current: Record<string, File[]>) => Record<string, File[]>) {
    const next = updater(pendingFilesRef.current);
    pendingFilesRef.current = next;
    setPendingFiles(next);
  }

  function registerLocalPhoto(file: File, slot: string) {
    const id = crypto.randomUUID();
    localPhotoIdsRef.current.set(file, id);
    photoSlotByFileRef.current.set(file, slot);
    return id;
  }

  function isCurrentLocalPhoto(file: File, id: string) {
    return localPhotoIdsRef.current.get(file) === id;
  }

  function trackPreviewUrl(url: string, file: File) {
    objectUrls.current.push(url);
    previewFileByUrlRef.current.set(url, file);
  }

  function revokePreviewUrl(url: string) {
    if (!url.startsWith("blob:")) return;
    URL.revokeObjectURL(url);
    objectUrls.current = objectUrls.current.filter((item) => item !== url);
    previewFileByUrlRef.current.delete(url);
  }

  function discardLocalPhoto(file: File) {
    const manager = photoPreparationManagerRef.current!;
    const hadOptimizationError = Boolean(manager.getError(file));
    localPhotoIdsRef.current.delete(file);
    photoSlotByFileRef.current.delete(file);
    previewSourceByFileRef.current.delete(file);

    const previewJob = heicPreviewJobsRef.current.get(file);
    if (previewJob) {
      heicPreviewJobsRef.current.delete(file);
      setPreviewProcessing(-1);
      refreshPreviewProcessingTarget();
    }

    manager.cancel(file);
    for (const [url, previewFile] of [...previewFileByUrlRef.current.entries()]) {
      if (previewFile === file) revokePreviewUrl(url);
    }
    for (const [slot, reserved] of [...glimpseHeicReservationsRef.current.entries()]) {
      reserved.delete(file);
      if (!reserved.size) glimpseHeicReservationsRef.current.delete(slot);
    }
    if (hadOptimizationError) setSaveError("");
  }

  function clearPhotoSlot(slot: string) {
    const files = [...photoSlotByFileRef.current.entries()]
      .filter(([, currentSlot]) => currentSlot === slot)
      .map(([file]) => file);
    files.forEach(discardLocalPhoto);
    updatePendingFiles((current) => {
      if (!(slot in current)) return current;
      const next = { ...current };
      delete next[slot];
      return next;
    });
  }

  function clearAllLocalPhotoState() {
    const previewJobs = heicPreviewJobsRef.current.size;
    heicPreviewJobsRef.current.clear();
    if (previewJobs) setPreviewProcessing(-previewJobs);
    photoPreparationManagerRef.current?.clear(true);
    localPhotoIdsRef.current.clear();
    photoSlotByFileRef.current.clear();
    previewSourceByFileRef.current.clear();
    glimpseHeicReservationsRef.current.clear();
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current = [];
    previewFileByUrlRef.current.clear();
    pendingFilesRef.current = {};
    setPendingFiles({});
  }

  function startBackgroundOptimization(file: File, target: "hero" | "glimpse", id: string, previewSource?: Blob) {
    if (!isCurrentLocalPhoto(file, id)) return;
    const source = previewSource ?? previewSourceByFileRef.current.get(file);
    const promise = photoPreparationManagerRef.current!.prepare(file, target, source);
    void promise.catch((cause) => {
      if (!isCurrentLocalPhoto(file, id)) return;
      setSaveError(cause instanceof Error ? cause.message : `${file.name} could not be optimized.`);
    });
  }

  function startHeicPreview(
    file: File,
    id: string,
    target: "" | "hero" | `section:${string}:images`,
    onReady: (preview: Blob) => void,
  ) {
    setPhotoProcessingTarget(target);
    setPreviewProcessing(1);
    const promise = (async () => {
      await Promise.resolve();
      const preview = await preparePhotoPreview(file);
      if (!isCurrentLocalPhoto(file, id)) return;
      previewSourceByFileRef.current.set(file, preview);
      onReady(preview);
    })().catch((cause) => {
      if (!isCurrentLocalPhoto(file, id)) return;
      setSaveError(cause instanceof Error ? cause.message : `${file.name} could not be read.`);
      discardLocalPhoto(file);
    }).finally(() => {
      if (heicPreviewJobsRef.current.get(file)?.id === id) {
        heicPreviewJobsRef.current.delete(file);
        setPreviewProcessing(-1);
        refreshPreviewProcessingTarget();
      }
    });
    heicPreviewJobsRef.current.set(file, { id, target, promise });
    void promise.catch(() => undefined);
  }

  async function preparePhotosForSave() {
    const manager = photoPreparationManagerRef.current!;
    const jobs = Object.entries(pendingFilesRef.current).flatMap(([slot, files]) => {
      const target = slot === "hero" ? "hero" as const : "glimpse" as const;
      return files.map((file) => manager.prepare(file, target, previewSourceByFileRef.current.get(file)));
    });
    if (jobs.length) await Promise.all(jobs);
  }

  function selectHeroPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (showFileValidationError([file])) return;

    clearPhotoSlot("hero");
    const id = registerLocalPhoto(file, "hero");

    if (!isHeicPhoto(file)) {
      const url = URL.createObjectURL(file);
      trackPreviewUrl(url, file);
      updatePendingFiles((current) => ({ ...current, hero: [file] }));
      updateConfig((current) => ({ ...current, hero: { ...current.hero, photoSource: "upload", uploadedUrl: url } }));
      activatePreview("hero");
      startBackgroundOptimization(file, "hero", id, file);
      return;
    }

    // The previous local preview has already been invalidated. Show the normal
    // preset while HEIC compatibility conversion prepares a browser-safe preview.
    updateConfig((current) => ({ ...current, hero: { ...current.hero, photoSource: "preset", presetIndex: 0, uploadedUrl: "" } }));
    startHeicPreview(file, id, "hero", (preview) => {
      if (!isCurrentLocalPhoto(file, id)) return;
      const url = URL.createObjectURL(preview);
      trackPreviewUrl(url, file);
      updatePendingFiles((current) => ({ ...current, hero: [file] }));
      updateConfig((current) => ({ ...current, hero: { ...current.hero, photoSource: "upload", uploadedUrl: url } }));
      activatePreview("hero");
      startBackgroundOptimization(file, "hero", id, preview);
    });
  }

  function removeHeroPhoto() {
    clearPhotoSlot("hero");
    updateConfig((current) => ({
      ...current,
      hero: { ...current.hero, photoSource: "preset", presetIndex: 0, uploadedUrl: "" },
    }));
    activatePreview("hero");
  }

  function selectGlimpsePhotos(sectionId: string, list: FileList | null) {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    const slot = `section:${sectionId}:images` as const;
    const reservedCount = glimpseHeicReservationsRef.current.get(slot)?.size ?? 0;
    const currentCount = (config.sections.find((section) => section.id === sectionId)?.images.length ?? 0) + reservedCount;
    if (currentCount + files.length > 8) {
      if (!adminMode) setPhotoCountNoticeKey((key) => key + 1);
      else setSaveError("A maximum of 8 pictures is allowed in Glimpse of Us.");
      return;
    }
    if (showFileValidationError(files)) return;

    const normalFiles = files.filter((file) => !isHeicPhoto(file));
    if (normalFiles.length) {
      const previews = normalFiles.map((file) => {
        const id = registerLocalPhoto(file, slot);
        const url = URL.createObjectURL(file);
        trackPreviewUrl(url, file);
        return { file, id, url };
      });
      updatePendingFiles((current) => ({ ...current, [slot]: [...(current[slot] ?? []), ...normalFiles] }));
      updateSection(sectionId, (section) => ({ ...section, images: [...section.images, ...previews.map(({ url }) => url)] }));
      activatePreview(sectionId);
      previews.forEach(({ file, id }) => startBackgroundOptimization(file, "glimpse", id, file));
    }

    const heicFiles = files.filter(isHeicPhoto);
    if (!heicFiles.length) return;
    const reserved = glimpseHeicReservationsRef.current.get(slot) ?? new Set<File>();
    glimpseHeicReservationsRef.current.set(slot, reserved);

    for (const file of heicFiles) {
      const id = registerLocalPhoto(file, slot);
      reserved.add(file);
      startHeicPreview(file, id, slot, (preview) => {
        if (!isCurrentLocalPhoto(file, id)) return;
        const currentReserved = glimpseHeicReservationsRef.current.get(slot);
        currentReserved?.delete(file);
        if (currentReserved && !currentReserved.size) glimpseHeicReservationsRef.current.delete(slot);
        const url = URL.createObjectURL(preview);
        trackPreviewUrl(url, file);
        updatePendingFiles((current) => ({ ...current, [slot]: [...(current[slot] ?? []), file] }));
        updateSection(sectionId, (section) => ({ ...section, images: [...section.images, url] }));
        activatePreview(sectionId);
        startBackgroundOptimization(file, "glimpse", id, preview);
      });
    }
  }

  function removeGlimpsePhoto(sectionId: string, imageIndex: number) {
    const section = config.sections.find((item) => item.id === sectionId);
    const url = section?.images[imageIndex];
    if (!section || !url) return;

    if (url.startsWith("blob:")) {
      const file = previewFileByUrlRef.current.get(url);
      if (file) {
        discardLocalPhoto(file);
        const slot = `section:${sectionId}:images`;
        updatePendingFiles((current) => {
          const files = (current[slot] ?? []).filter((item) => item !== file);
          if (files.length) return { ...current, [slot]: files };
          const next = { ...current };
          delete next[slot];
          return next;
        });
      } else {
        revokePreviewUrl(url);
      }
    }

    updateSection(sectionId, (item) => ({
      ...item,
      images: item.images.filter((_, index) => index !== imageIndex),
    }));
    activatePreview(sectionId);
  }

  async function saveDesign(event: FormEvent) {
    event.preventDefault();
    if (saveState === "saving" || adminAction) return;
    if (previewProcessingRef.current) { setSaveError("Please wait for your HEIC photo preview to finish preparing, then save."); return; }
    if (Object.values(pendingFilesRef.current).reduce((count, files) => count + files.length, 0) > 32) {
      setSaveError("Choose no more than 32 photos in this invitation.");
      return;
    }
    const errors: string[] = [];
    if (config.contact.name.trim().length < 2) errors.push("Please enter your name so we know who placed the order.");
    if (!/^5\d{7}$/.test(config.contact.phone.trim())) errors.push("Enter a Mauritian phone number with exactly 8 digits, starting with 5.");
    if (errors.length) {
      setValidationErrors(errors);
      setSaveState("idle");
      window.setTimeout(() => document.getElementById("designer-validation-errors")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
      return;
    }
    setValidationErrors([]);
    setSaveState("saving");
    setSaveError("");
    if (pendingPhotoCount) setPhotoProcessingTarget("save");

    try {
      let workingConfig = removeLocalPhotoUrls(config);
      await preparePhotosForSave();
      const filesToUpload = pendingFilesRef.current;
      if (adminMode && currentAdminOrder) {
        const uploadedBySlot = await uploadPendingPhotos(currentAdminOrder.id, filesToUpload, "/api/dashboard/orders/media", preparedPhotoRef.current, uploadedPhotoUrlsRef.current);
        if (Object.keys(uploadedBySlot).length) workingConfig = applyUploadedUrls(workingConfig, uploadedBySlot);
        const updated = await updateAdminOrder(currentAdminOrder.id, currentAdminOrder.revision, currentAdminOrder.status === "active" ? "deploy" : "save", {
          config: workingConfig,
          totalPrice: adminPrice,
          slug: adminSlug,
          media: selectedUploadedPhotos(filesToUpload, uploadedPhotoUrlsRef.current),
          ...(currentAdminOrder.status === "active" ? { activeUntil: adminActiveUntil } : {}),
        });
        setConfig(normalizeInvitationConfig(updated.config));
        setCurrentAdminOrder(updated);
        setAdminPrice(updated.total_price);
        setAdminSlug(updated.slug ?? "");
        clearAllLocalPhotoState();
        uploadedPhotoUrlsRef.current.clear();
        setSaveState("saved");
        onAdminOrderChange?.(updated);
        window.setTimeout(() => onAdminBack?.(), 650);
        return;
      }

      const slots = Object.entries(filesToUpload).flatMap(([slot, files]) => files.map((_, index) => `${slot}:${index}`));
      submissionKeyRef.current ??= crypto.randomUUID();
      const submission = submissionRef.current ?? await createInvitation(workingConfig, slots, submissionKeyRef.current);
      if (slots.length) {
        if (!submission.uploadToken) throw new Error("The secure photo upload could not be started.");
        submissionRef.current = submission;
        const uploadedBySlot = await uploadPendingPhotos(submission.id, filesToUpload, "/api/invitations/media", preparedPhotoRef.current, uploadedPhotoUrlsRef.current, submission.uploadToken);
        workingConfig = applyUploadedUrls(workingConfig, uploadedBySlot);
        await finalizeInvitationMedia(workingConfig, submission, selectedUploadedPhotos(filesToUpload, uploadedPhotoUrlsRef.current));
      }

      setConfig(workingConfig);
      clearAllLocalPhotoState();
      submissionRef.current = null;
      uploadedPhotoUrlsRef.current.clear();
      setSaveState("submitted");
      setShowSuccess(true);
    } catch (error) {
      if (adminMode && currentAdminOrder && uploadedPhotoUrlsRef.current.size) {
        await cleanupUploadedPhotos("/api/dashboard/orders/media", currentAdminOrder.id, [...uploadedPhotoUrlsRef.current.values()]);
        uploadedPhotoUrlsRef.current.clear();
      } else if (submissionRef.current) {
        const committed = await cleanupUploadedPhotos("/api/invitations", submissionRef.current.id, [...uploadedPhotoUrlsRef.current.values()], submissionRef.current.uploadToken);
        if (committed) {
          submissionRef.current = null;
          clearAllLocalPhotoState();
          uploadedPhotoUrlsRef.current.clear();
          setSaveState("submitted");
          setShowSuccess(true);
          return;
        }
        if (error instanceof Error && /expired/i.test(error.message)) {
          // Start a fresh opaque order when the capability really expired;
          // the durable queue will remove the previous staged objects.
          submissionRef.current = null;
          submissionKeyRef.current = null;
          uploadedPhotoUrlsRef.current.clear();
        }
        // Otherwise retain the capability and receipts so a lost finalize
        // response can be retried without creating another order or photo.
      }
      console.error(adminMode ? "Unable to update invitation order" : "Unable to send invitation design", error);
      setSaveState("error");
      setSaveError(error instanceof Error ? error.message : "An error happened while saving your design. If it persists, please contact us on WhatsApp or social media.");
    } finally {
      setPhotoProcessingTarget("");
    }
  }

  async function runAdminLifecycle(nextAction: "deploy" | "deactivate" | "review") {
    if (!currentAdminOrder || adminAction || saveState === "saving") return;
    if (previewProcessingRef.current) { setSaveError("Please wait for your HEIC photo preview to finish preparing before publishing."); return; }
    if (Object.values(pendingFilesRef.current).reduce((count, files) => count + files.length, 0) > 32) {
      setSaveError("Choose no more than 32 new photos in this invitation.");
      return;
    }
    setAdminAction(nextAction);
    setAdminConfirmationError("");
    setAdminNotice("");
    setSaveError("");
    if (nextAction === "deploy" && pendingPhotoCount) setPhotoProcessingTarget("save");
    try {
      let workingConfig = removeLocalPhotoUrls(config);
      let filesToUpload = pendingFilesRef.current;
      if (nextAction === "deploy") {
        await preparePhotosForSave();
        filesToUpload = pendingFilesRef.current;
        const uploadedBySlot = await uploadPendingPhotos(currentAdminOrder.id, filesToUpload, "/api/dashboard/orders/media", preparedPhotoRef.current, uploadedPhotoUrlsRef.current);
        if (Object.keys(uploadedBySlot).length) workingConfig = applyUploadedUrls(workingConfig, uploadedBySlot);
      }
      const updated = await updateAdminOrder(currentAdminOrder.id, currentAdminOrder.revision, nextAction, nextAction === "deploy" ? {
        config: workingConfig,
        totalPrice: adminPrice,
        slug: adminSlug,
        activeUntil: adminActiveUntil,
        media: selectedUploadedPhotos(filesToUpload, uploadedPhotoUrlsRef.current),
      } : {});
      setCurrentAdminOrder(updated);
      setConfig(normalizeInvitationConfig(updated.config));
      setAdminPrice(updated.total_price);
      setAdminSlug(updated.slug ?? "");
      setAdminActiveUntil(suggestActiveUntil(updated, normalizeInvitationConfig(updated.config), today));
      clearAllLocalPhotoState();
      uploadedPhotoUrlsRef.current.clear();
      onAdminOrderChange?.(updated);
      setAdminNotice(nextAction === "deploy"
        ? `Invitation is live at /${updated.slug}.`
        : nextAction === "deactivate"
          ? "Invitation taken offline and moved to Previous orders."
          : "Invitation moved back to Need your review.");
      setAdminConfirmation("");
    } catch (error) {
      if (currentAdminOrder && uploadedPhotoUrlsRef.current.size) {
        await cleanupUploadedPhotos("/api/dashboard/orders/media", currentAdminOrder.id, [...uploadedPhotoUrlsRef.current.values()]);
        uploadedPhotoUrlsRef.current.clear();
      }
      const message = error instanceof Error ? error.message : "The order could not be updated.";
      setSaveError(message);
      setAdminConfirmationError(message);
    } finally {
      setPhotoProcessingTarget("");
      setAdminAction("");
    }
  }

  function showMobilePreview() {
    setMobileView("preview");
    setPreviewFocus((current) => ({ ...current, key: current.key + 1 }));
  }

  function openDesignerStep(event: ReactMouseEvent<HTMLAnchorElement>, targetId: string) {
    event.preventDefault();
    const step = document.getElementById(targetId);
    if (!(step instanceof HTMLDetailsElement)) return;
    step.open = true;
    window.history.replaceState(null, "", `#${targetId}`);
    window.setTimeout(() => step.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  return (
    <main className={`designer-page designer-mobile-${mobileView}${readOnlyMode ? " designer-readonly" : ""}`} style={{ "--builder-accent": palette.theme.primary, "--builder-soft": palette.theme.background } as CSSProperties}>
      <div className="designer-page-petals" aria-hidden="true">
        {Array.from({ length: 14 }, (_, index) => (
          <span key={index} style={{ "--petal-x": `${(index * 29) % 97}%`, "--petal-delay": `${-(index % 7) * 2.1}s`, "--petal-duration": `${15 + (index % 5) * 2.4}s` } as CSSProperties}>{index % 3 === 0 ? "❀" : "·"}</span>
        ))}
      </div>
      <header className={`designer-header${adminMode ? " designer-admin-header" : !readOnlyMode ? " designer-customer-header" : ""}`}>
        {adminMode
          ? <button type="button" className="designer-back designer-home-link designer-admin-back" onClick={onAdminBack} aria-label="Back to orders"><ArrowLeft aria-hidden="true" /></button>
          : readOnlyMode
            ? <Link href={`/examples/${exampleSlug}`} className="designer-back"><ArrowLeft aria-hidden="true" /> Back to example</Link>
            : <Link href="/" className="designer-back designer-home-link"><ArrowLeft aria-hidden="true" /> Back to Home</Link>}
        <div className={`designer-title${adminMode ? " designer-admin-title" : ""}`}>
          <span className="designer-brand-mark">PI</span>
          <div>{!adminMode && <p>{readOnlyMode ? "Read-only design setup" : "Invitation designer"}</p>}<h1>{adminMode ? "Edit Invitation" : readOnlyMode ? exampleName : "Create your invitation"}</h1></div>
        </div>
        <div className="designer-header-price"><span>{adminMode ? "Order price" : readOnlyMode ? "Example price" : "Your price"}</span><strong>Rs {(adminMode ? adminPrice : price.total).toLocaleString("en-US")}</strong></div>
      </header>

      {adminMode && currentAdminOrder && (
        <>
          <AdminOrderOverview
            order={currentAdminOrder}
            config={config}
            price={adminPrice}
            slug={adminSlug}
            publicOrigin={publicOrigin}
            onName={(value) => updateContact("name", value)}
            onPhone={(value) => updateContact("phone", value)}
            onEventDate={(value) => updateConfig((current) => updateOrderEventDate(current, value))}
            onPrice={setAdminPrice}
            onSlug={setAdminSlug}
          />
          <AdminDeployControls
            order={currentAdminOrder}
            activeUntil={adminActiveUntil}
            today={today}
            action={adminAction}
            photosProcessing={photoPreviewProcessing > 0}
            publicOrigin={publicOrigin}
            customerName={config.contact.name}
            customerPhone={config.contact.phone}
            onActiveUntil={setAdminActiveUntil}
            onAction={(nextAction) => {
              if (nextAction === "deploy") void runAdminLifecycle(nextAction);
              else {
                setAdminConfirmationError("");
                setAdminConfirmation(nextAction);
              }
            }}
          />
          {adminNotice && <div className="orders-notice admin-designer-notice"><Check aria-hidden="true" />{adminNotice}</div>}
        </>
      )}

      <div className="designer-mobile-switch" aria-label="Choose editor or preview">
        <button type="button" className={mobileView === "edit" ? "is-active" : ""} onClick={() => setMobileView("edit")}>{readOnlyMode ? "Design setup" : "Edit invitation"}</button>
        <button type="button" className={mobileView === "preview" ? "is-active" : ""} onClick={showMobilePreview}>{readOnlyMode ? "Invitation preview" : "View preview"}</button>
      </div>

      {!adminMode && !readOnlyMode && showDesktopTip && <div className="designer-device-tip" role="status"><Monitor aria-hidden="true" /><span>For the easiest design experience, use a laptop or desktop computer.</span></div>}
      {!adminMode && !readOnlyMode && photoSizeNoticeKey > 0 && (
        <div key={photoSizeNoticeKey} className="designer-upload-size-tip" role="alert">
          <Info aria-hidden="true" />
          <span><strong>Image too large.</strong> Please choose a photo of 5 MB or smaller.</span>
        </div>
      )}
      {!adminMode && !readOnlyMode && photoCountNoticeKey > 0 && (
        <div key={photoCountNoticeKey} className="designer-upload-size-tip" role="alert">
          <Info aria-hidden="true" />
          <span><strong>Too many pictures.</strong> A maximum of 8 pictures is allowed.</span>
        </div>
      )}

      <div className="designer-workspace">
        <form inert={saveState === "saving" || Boolean(adminAction)} id="invitation-designer-form" className="designer-form" onSubmit={saveDesign} noValidate>
          <nav className="designer-steps" aria-label="Invitation design steps">
            <a href="#designer-colours" onClick={(event) => openDesignerStep(event, "designer-colours")}><span>1</span>Colours</a>
            <a href="#designer-opening" onClick={(event) => openDesignerStep(event, "designer-opening")}><span>2</span>Opening</a>
            <a href="#designer-hero" onClick={(event) => openDesignerStep(event, "designer-hero")}><span>3</span>Main Area</a>
            <a href="#designer-sections" onClick={(event) => openDesignerStep(event, "designer-sections")}><span>4</span>Parts</a>
          </nav>

          {readOnlyMode && (
            <div className="designer-readonly-banner" role="note">
              <LockKeyhole aria-hidden="true" />
              <span><strong>View-only example</strong><small>These are the exact choices used for this invitation. Open each step to use it as a guide for your own design.</small></span>
              <Link href="/design-invitation">Create yours <ArrowRight aria-hidden="true" /></Link>
            </div>
          )}

          <fieldset className="designer-mode-fields" disabled={readOnlyMode} aria-label={readOnlyMode ? "Read-only invitation settings" : undefined}>

          <MainStep id="designer-colours" number="1" icon={<Palette />} title="Choose your colours" description="The same artwork changes into your selected colour, so the design stays consistent." defaultOpen={!adminMode}>
            <div className="designer-palette-grid">
              {paletteOptions.map((option) => (
                <button type="button" key={option.id} className={`designer-palette-option ${config.palette === option.id ? "is-selected" : ""}`} onClick={() => choosePalette(option.id)} aria-pressed={config.palette === option.id}>
                  <span className="designer-palette-colours">{option.colors.map((color) => <i key={color} style={{ background: color }} />)}</span>
                  <span><strong>{option.name}</strong><small>{option.description}</small></span>
                  {config.palette === option.id && <Check aria-hidden="true" />}
                </button>
              ))}
            </div>
          </MainStep>

          <MainStep id="designer-opening" number="2" icon={<Sparkles />} title="Choose how it opens" description="You can replay the opening as many times as you like." onActivate={() => activatePreview("opening")} defaultOpen={!adminMode}>
            <div className="designer-choice-grid designer-opening-options">
              {openingOptions.map((option) => (
                <ChoiceButton key={option.id} selected={config.opening.type === option.id} title={option.name} description={option.description} price={option.price} onClick={() => chooseOpening(option.id)} />
              ))}
            </div>

            {config.opening.type !== "none" && (
              <div className="designer-conditional-panel">
                <div className="designer-subheading"><strong>Choose the {config.opening.type === "envelope" ? "envelope" : "curtain"} style</strong></div>
                <div className="designer-image-options designer-opening-images">
                  {(config.opening.type === "envelope" ? openingAssets.envelope : openingAssets.curtain).map((asset) => (
                    <button type="button" key={asset.id} aria-label={`Choose ${asset.name}`} className={config.opening.asset === asset.id ? "is-selected" : ""} onClick={() => {
                      updateConfig((current) => ({ ...current, opening: { ...current.opening, asset: asset.id } }));
                      setReplayKey((key) => key + 1);
                      activatePreview("opening");
                    }}>
                      <span className={`designer-opening-thumb ${config.opening.type === "envelope" ? "is-envelope" : ""}`}><img src={asset.urls[config.palette]} alt="" /></span>
                      {config.opening.asset === asset.id && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                {config.opening.type === "envelope" && <p className="designer-opening-note">Your initials will not be visible in the mobile preview, but they will appear on the wax seal when we process your invitation.</p>}
              </div>
            )}
          </MainStep>

          <MainStep id="designer-hero" number="3" icon={<ImageIcon />} title="Choose the main area" description="This is the first part your guests will see after the opening." onActivate={() => activatePreview("hero")} defaultOpen={!adminMode}>
            <div className="designer-choice-grid">
              <ChoiceButton selected={config.hero.type === "basic"} title="Basic" description="Your chosen photo appears in the background." price={0} onClick={() => chooseHero("basic")} />
              <ChoiceButton selected={config.hero.type === "interactive"} title="Interactive" description="Guests scratch only the framed photo to reveal it." price={200} onClick={() => chooseHero("interactive")} />
            </div>

            <div className="designer-bismillah-picker">
              <div className="designer-subheading">
                <strong>Add arabic calligraphy at the top?</strong>
                <span>Add or remove it with one tap.</span>
              </div>
              <div className="designer-choice-grid">
                <ChoiceButton selected={config.bismillah.enabled} title="Show Arabic Calligraphy" description="Place the calligraphy above the invitation names." price={0} onClick={() => chooseBismillah(true)} />
                <ChoiceButton selected={!config.bismillah.enabled} title="Without Arabic Calligraphy" description="Start directly with the main area." price={0} onClick={() => chooseBismillah(false)} />
              </div>
            </div>

            <div className="designer-photo-picker">
              <div className="designer-subheading"><strong>Choose a photo</strong><span>{config.hero.type === "basic" ? "Each photo keeps the exact same composition when you change colours." : "Choose an intimate couple detail, or upload your own portrait photo."}</span></div>
              <div className="designer-image-options designer-hero-images">
                {availableHeroPresets.map((asset, index) => asset.hidden ? null : (
                  <button type="button" key={asset.id} aria-label={`Choose ${asset.name}`} className={config.hero.photoSource === "preset" && config.hero.presetIndex === index ? "is-selected" : ""} onClick={() => chooseHeroPreset(index)}>
                    <span className="designer-hero-thumb"><img src={asset.url} alt="" style={{ objectPosition: asset.objectPosition, transform: `scale(${asset.zoom})` }} /></span>
                    {config.hero.photoSource === "preset" && config.hero.presetIndex === index && <Check aria-hidden="true" />}
                  </button>
                ))}
                {config.hero.type === "interactive" && (
                  <div className={`designer-upload-card ${config.hero.photoSource === "upload" ? "is-selected" : ""}`}>
                    <label className={`designer-upload-option ${config.hero.photoSource === "upload" ? "is-selected" : ""}`}>
                      {config.hero.photoSource === "upload" && config.hero.uploadedUrl ? <img src={config.hero.uploadedUrl} alt="Your uploaded hero preview" /> : <span><Upload aria-hidden="true" /><strong>Upload your photo</strong><small>JPG, PNG, WebP or HEIC · max 5 MB</small></span>}
                      {(photoProcessingTarget === "hero" || (photoProcessingTarget === "save" && Boolean(pendingFiles.hero?.length))) && <PhotoUploadProgress label={photoProgressLabel} card />}
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" onChange={(event) => { void selectHeroPhoto(event.target.files); event.currentTarget.value = ""; }} />
                    </label>
                    {config.hero.photoSource === "upload" && config.hero.uploadedUrl && <button type="button" className="designer-photo-remove" onClick={removeHeroPhoto} aria-label="Remove uploaded hero photo"><Trash2 aria-hidden="true" /></button>}
                  </div>
                )}
              </div>
            </div>

            <div className="designer-fields-grid designer-hero-copy-fields">
              <TextField label="Small text above the names" value={config.hero.eyebrow} onChange={(value) => updateHero("eyebrow", value)} full />
              <TextField label="First name" value={config.hero.firstName} onChange={(value) => updateHero("firstName", value)} />
              <TextField label="Second name" value={config.hero.secondName} onChange={(value) => updateHero("secondName", value)} />
              <TextArea label="Invitation message" value={config.hero.message} onChange={(value) => updateHero("message", value)} full rows={2} />
              <TextField label="Wedding date" type="date" value={config.hero.date} onChange={(value) => updateHero("date", value)} full />
            </div>
          </MainStep>

          <MainStep id="designer-sections" className="designer-sections-step" number="4" icon={<Heart />} title="Choose and write your invitation parts" description="The four important parts are included. Add any other part as many times as you need." defaultOpen={!adminMode}>
            <div className="designer-included-note"><LockKeyhole aria-hidden="true" /><span><strong>Already included:</strong> Countdown, Our Timeline, Event Details + Location and Important Notes.</span></div>

            <div className="designer-section-list">
              {config.sections.map((section, index) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  index={index}
                  total={config.sections.length}
                  onActivate={() => activatePreview(section.id)}
                  onField={(field, value) => updateSectionField(section.id, field, value)}
                  onItem={(itemIndex, field, value) => updateSectionItem(section.id, itemIndex, field, value)}
                  onAddItem={(item) => addSectionItem(section.id, item)}
                  onRemoveItem={(itemIndex) => removeSectionItem(section.id, itemIndex)}
                  onTitle={(value) => updateSection(section.id, (item) => ({ ...item, title: value }))}
                  onMove={(direction) => moveSection(section.id, direction)}
                  onDuplicate={() => duplicateSection(section)}
                  onRemove={() => removeSection(section.id)}
                  onPhotos={(files) => selectGlimpsePhotos(section.id, files)}
                  onRemovePhoto={(imageIndex) => removeGlimpsePhoto(section.id, imageIndex)}
                  photoProgressLabel={(photoProcessingTarget === `section:${section.id}:images` || (photoProcessingTarget === "save" && Boolean(pendingFiles[`section:${section.id}:images`]?.length))) ? photoProgressLabel : ""}
                  defaultOpen={!adminMode}
                  openWhenAdded={newlyAddedSectionId === section.id}
                  adminMode={adminMode}
                  readOnlyMode={readOnlyMode}
                />
              ))}
            </div>

            <div className="designer-add-section">
              <div><Plus aria-hidden="true" /><span><strong>Add another part</strong><small>You can add the same part more than once.</small></span></div>
              <SectionPicker value={addType} onChange={setAddType} adminMode={adminMode} />
              <button type="button" onClick={() => addSection()}><Plus aria-hidden="true" /> Add this part</button>
            </div>
          </MainStep>
          </fieldset>

          <section className="designer-price-summary" aria-labelledby="designer-price-title">
            <div><CircleDollarSign aria-hidden="true" /><span><small>{adminMode ? "Calculated price guide" : readOnlyMode ? "Calculated example price" : "Your current price"}</small><strong id="designer-price-title">Rs {price.total.toLocaleString("en-US")}</strong></span></div>
            <dl>
              <div><dt>Basic invitation</dt><dd>Rs {price.base.toLocaleString("en-US")}</dd></div>
              {price.opening > 0 && <div><dt>{config.opening.type === "envelope" ? "Envelope opening" : "Curtain opening"}</dt><dd>+ Rs {price.opening}</dd></div>}
              {price.hero > 0 && <div><dt>Interactive hero</dt><dd>+ Rs {price.hero}</dd></div>}
              {price.sections > 0 && <div><dt>Extra invitation parts</dt><dd>+ Rs {price.sections.toLocaleString("en-US")}</dd></div>}
            </dl>
          </section>

          {!adminMode && !readOnlyMode && <section className="designer-contact-card" aria-labelledby="designer-contact-title">
            <div className="designer-contact-heading">
              <span><UserRound aria-hidden="true" /></span>
              <div>
                <p>Final step</p>
                <h2 id="designer-contact-title">How can we contact you?</h2>
                <span>We will contact you to share payment details or assist you in the designing of your invitation.</span>
              </div>
            </div>
            <div className="designer-fields-grid">
              <TextField label="Your name" placeholder="For example: Aisha Rahman" value={config.contact.name} onChange={(value) => updateContact("name", value)} autoComplete="name" required icon={<UserRound />} />
              <TextField label="Mauritian phone or WhatsApp number" placeholder="For example: 58749327" hint="Enter exactly 8 digits, starting with 5 (for example: 58749327)." type="tel" value={config.contact.phone} onChange={(value) => updateContact("phone", value)} autoComplete="tel" inputMode="numeric" minLength={8} maxLength={8} pattern="5[0-9]{7}" title="Enter a Mauritian phone number with exactly 8 digits, starting with 5." required icon={<Phone />} />
            </div>
          </section>}

          {!readOnlyMode && validationErrors.length > 0 && (
            <div className="designer-validation-card" id="designer-validation-errors" role="alert">
              <span><Info aria-hidden="true" /></span>
              <div><strong>Please check your contact details</strong><ul>{validationErrors.map((error) => <li key={error}>{error}</li>)}</ul></div>
            </div>
          )}
          {!readOnlyMode && saveError && (
            <div className="designer-notice is-error" role="alert">
              <Info aria-hidden="true" />
              <span>{saveError}</span>
              {!adminMode && <a href={whatsappSupportUrl} target={whatsappSupportNumber ? "_blank" : undefined} rel={whatsappSupportNumber ? "noreferrer" : undefined}><WhatsAppIcon /> WhatsApp</a>}
            </div>
          )}
          {!readOnlyMode && <div className="designer-submit-panel">
            <button className={`designer-final-save ${saveState === "submitted" || saveState === "saved" ? "is-complete" : ""}`} type="submit" disabled={photoPreviewProcessing > 0 || saveState === "saving" || saveState === "submitted" || saveState === "saved"}>{saveState === "saving" ? <Loader2 className="is-spinning" aria-hidden="true" /> : saveState === "submitted" || saveState === "saved" ? <Check aria-hidden="true" /> : <Save aria-hidden="true" />}{saveButtonText}</button>
            <p>{adminMode
              ? currentAdminOrder?.status === "active"
                ? "Updating publishes these edits and the active-until date above to the live invitation, then returns you to the orders table."
                : "Saving keeps this order ready for review and returns you to the orders table."
              : hasCustomPart
                ? "We will contact you to discuss your custom part, then share payment details when your order is ready."
                : "Once your order is ready, we will contact you with the payment details."}</p>
          </div>}
        </form>

        <InvitationPhonePreview config={previewConfig} replayKey={replayKey} focusTarget={previewFocus.target} focusKey={previewFocus.key} priceTotal={adminMode ? adminPrice : price.total} onReplay={() => { setReplayKey((key) => key + 1); activatePreview("opening"); }} />
      </div>

      {showSuccess && <SubmissionSuccessModal />}
      {currentAdminOrder && adminConfirmation && <OrderConfirmationModal
        icon={adminConfirmation === "review" ? <RotateCcw aria-hidden="true" /> : <Rocket aria-hidden="true" style={{ transform: "rotate(180deg)" }} />}
        eyebrow={adminConfirmation === "review" ? "Return to review" : "Undeploy"}
        title={adminConfirmation === "review" ? "Move this invitation to review?" : "Undeploy this invitation?"}
        description={adminConfirmation === "review"
          ? "Its public link will stop working immediately. The saved order and its link remain available for review and later deployment."
          : "Guests will lose access immediately. The order and its link remain under Previous orders so you can redeploy it later."}
        confirmLabel={adminConfirmation === "review" ? "Move to review" : "Undeploy invitation"}
        tone={adminConfirmation === "review" ? "wine" : "danger"}
        busy={Boolean(adminAction)}
        error={adminConfirmationError}
        onCancel={() => setAdminConfirmation("")}
        onConfirm={() => void runAdminLifecycle(adminConfirmation)}
      />}
    </main>
  );
}

function normalizeInvitationLink(value: string) {
  return value.trim().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 90).replace(/-+$/g, "");
}

function AdminOrderOverview({ order, config, price, slug, publicOrigin, onName, onPhone, onEventDate, onPrice, onSlug }: {
  order: AdminInvitationOrder;
  config: InvitationConfig;
  price: number;
  slug: string;
  publicOrigin: string;
  onName: (value: string) => void;
  onPhone: (value: string) => void;
  onEventDate: (value: string) => void;
  onPrice: (value: number) => void;
  onSlug: (value: string) => void;
}) {
  const proposedSlug = normalizeInvitationLink(slug) || makeInvitationSlug(config);
  const linkSaved = order.slug === proposedSlug;
  return (
    <section className="admin-order-overview" aria-labelledby="admin-order-overview-title">
      <div className="admin-order-overview-heading">
        <div><span>Order overview</span><h2 id="admin-order-overview-title">The details that matter most</h2></div>
        <div className="admin-overview-actions">{order.status !== "active" && <a href={`/dashboard/preview/${order.id}`} target="_blank" rel="noreferrer" title="Open the last saved version in a new tab"><Eye aria-hidden="true" /> Preview saved invitation</a>}<span className={`admin-order-status is-${order.status}`}>{order.status === "pending" ? "Needs review" : order.status === "active" ? "Currently live" : "Previous order"}</span></div>
      </div>
      <div className="admin-order-overview-grid">
        <label><span>Customer name</span><input value={config.contact.name} onChange={(event) => onName(event.target.value)} /></label>
        <label className="is-phone"><span>Phone number</span><div><input inputMode="numeric" maxLength={8} value={config.contact.phone} onChange={(event) => onPhone(event.target.value)} />{/^5\d{7}$/.test(config.contact.phone) && <a href={customerWhatsAppUrl(config.contact.phone, config.contact.name)} target="_blank" rel="noreferrer" aria-label="Message customer on WhatsApp"><WhatsAppIcon /></a>}</div></label>
        <label className="is-link"><span>Invitation link</span><div><b>/</b><input value={slug} placeholder={makeInvitationSlug(config)} onChange={(event) => onSlug(event.target.value)} />{order.status === "active" && order.slug && <a href={`/${order.slug}`} target="_blank" rel="noreferrer" aria-label="Open live invitation"><ExternalLink aria-hidden="true" /></a>}</div></label>
        <label><span>Event date</span><input type="date" value={getPrimaryEventDate(config)} onChange={(event) => onEventDate(event.target.value)} /></label>
        <label><span>Order price (Rs)</span><input type="number" min="0" step="1" value={price} onChange={(event) => onPrice(Math.max(0, Math.round(Number(event.target.value) || 0)))} /></label>
        <div className="admin-link-preview"><span>{linkSaved ? "Saved invitation link:" : "Link preview:"}</span><strong>{publicOrigin}/{proposedSlug}</strong>{!linkSaved && <em>Suggested address; save edits or deploy to confirm availability.</em>}{order.status !== "active" && <em>Guests cannot open it until deployment.</em>}</div>
      </div>
    </section>
  );
}

function AdminDeployControls({ order, activeUntil, today, action, photosProcessing, publicOrigin, customerName, customerPhone, onActiveUntil, onAction }: {
  order: AdminInvitationOrder;
  activeUntil: string;
  today: string;
  action: "deploy" | "deactivate" | "review" | "";
  photosProcessing: boolean;
  publicOrigin: string;
  customerName: string;
  customerPhone: string;
  onActiveUntil: (value: string) => void;
  onAction: (action: "deploy" | "deactivate" | "review") => void;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const publicPath = order.slug ? `/${order.slug}` : "";
  const whatsappUrl = order.status === "active" && order.slug
    ? customerWhatsAppUrl(customerPhone, customerName, invitationPublicUrl(publicOrigin, order.slug))
    : "";
  async function copyLink() {
    if (!publicPath) return;
    try {
      await copyToClipboard(`${publicOrigin}${publicPath}`);
      setCopyError("");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopyError("Please select and copy the link manually.");
    }
  }
  return (
    <section className="order-deploy-bar admin-designer-deploy" id="admin-deploy-controls" aria-label="Invitation publishing controls">
      <div className="order-deploy-copy"><Rocket aria-hidden="true" /><div><strong>{order.status === "active" ? "This invitation is live" : order.status === "inactive" ? "Ready to publish again?" : "Ready after your review"}</strong><small>{order.status === "active" ? `Guests can open ${publicPath}` : "Choose the final active date, then publish in one tap."}</small></div></div>
      <label><span>Keep active until</span><input type="date" value={activeUntil} min={today} onChange={(event) => onActiveUntil(event.target.value)} /></label>
      {order.status !== "active" && <button className="order-primary-action" type="button" onClick={() => onAction("deploy")} disabled={Boolean(action) || photosProcessing || !activeUntil}>
        {action === "deploy" ? <Loader2 className="is-spinning" aria-hidden="true" /> : <Rocket aria-hidden="true" />}
        {order.status === "pending" ? "Deploy invitation" : "Redeploy invitation"}
      </button>}
      {order.status === "active" && <button className="order-review-action" type="button" onClick={() => onAction("review")} disabled={Boolean(action)}>{action === "review" ? <Loader2 className="is-spinning" aria-hidden="true" /> : <RotateCcw aria-hidden="true" />} Move to review</button>}
      {order.status === "active" && <button className="order-danger-action is-undeploy" type="button" onClick={() => onAction("deactivate")} disabled={Boolean(action)}>{action === "deactivate" ? <Loader2 className="is-spinning" aria-hidden="true" /> : <Rocket aria-hidden="true" />} Undeploy</button>}
      {order.status === "active" && <p className="order-deploy-tip">Use Update live invitation at the bottom to publish your edits and apply this active-until date together.</p>}
      {publicPath && <div className="order-public-link"><span>{order.status === "active" ? "Live invitation link" : "Saved link (currently offline)"}</span><strong>{publicPath}</strong><button type="button" onClick={() => void copyLink()} title="Copy invitation link">{copied ? <Check /> : <Copy />}<span className="sr-only">Copy invitation link</span></button>{order.status === "active" && <a href={publicPath} target="_blank" rel="noreferrer" title="Open live invitation"><ExternalLink /><span className="sr-only">Open live invitation</span></a>}{whatsappUrl && <a href={whatsappUrl} target="_blank" rel="noreferrer" title="Send invitation link on WhatsApp" aria-label={`Send ${customerName} the invitation link on WhatsApp`}><WhatsAppIcon /></a>}</div>}
      {copyError && <p className="order-deploy-tip" role="alert">{copyError}</p>}
    </section>
  );
}

function SubmissionSuccessModal() {
  return (
    <div className="designer-success-backdrop" role="presentation">
      <section className="designer-success-modal" role="dialog" aria-modal="true" aria-labelledby="designer-success-title" aria-describedby="designer-success-description">
        <span className="designer-success-check"><Check aria-hidden="true" /></span>
        <p>Design received</p>
        <h2 id="designer-success-title">Your invitation has been sent for processing</h2>
        <span id="designer-success-description">We have safely received your design. Our team will contact you when your invitation is ready to review.</span>
        <div className="designer-success-progress"><i /></div>
        <small>Redirecting you to the home page…</small>
      </section>
    </div>
  );
}

function MainStep({ id, className = "", number, icon, title, description, onActivate, defaultOpen = true, children }: {
  id: string;
  className?: string;
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
  onActivate?: () => void;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <details className={`designer-step-card designer-main-step ${className}`} id={id} open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)} onFocusCapture={onActivate}>
      <summary onClick={onActivate}>
        <StepHeading number={number} icon={icon} title={title} description={description} />
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="designer-main-step-body">{children}</div>
    </details>
  );
}

function StepHeading({ number, icon, title, description }: { number: string; icon: ReactNode; title: string; description: string }) {
  return <div className="designer-step-heading"><span className="designer-step-number">{number}</span><span className="designer-step-icon" aria-hidden="true">{icon}</span><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function ChoiceButton({ selected, title, description, price, onClick }: { selected: boolean; title: string; description: string; price: number; onClick: () => void }) {
  return (
    <button type="button" className={`designer-choice ${selected ? "is-selected" : ""}`} onClick={onClick} aria-pressed={selected}>
      <span className="designer-radio">{selected && <Check aria-hidden="true" />}</span>
      <span><strong>{title}</strong><small>{description}</small></span>
      <b>{price ? `+ Rs ${price}` : "Included"}</b>
    </button>
  );
}

function SectionPicker({ value, onChange, adminMode }: { value: SectionType; onChange: (value: SectionType) => void; adminMode: boolean }) {
  const pickerRef = useRef<HTMLDetailsElement>(null);
  const selected = sectionDefinitions[value];
  const options = Object.entries(sectionDefinitions) as Array<[SectionType, (typeof sectionDefinitions)[SectionType]]>;
  const selectedName = adminMode && value === "custom" ? "Custom Section" : selected.name;
  const selectedDescription = adminMode && value === "custom" ? "Paste isolated HTML and CSS for this invitation." : selected.description;

  return (
    <div className="designer-part-picker">
      <span>Choose an additional part</span>
      <details ref={pickerRef}>
        <summary>
          <span><strong>{selectedName}</strong><small>{selectedDescription}</small></span>
          <b>+ Rs {selected.price}</b>
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="designer-part-menu" role="listbox" aria-label="Additional invitation parts">
          {options.map(([type, definition]) => (
            <button
              type="button"
              role="option"
              aria-selected={value === type}
              className={value === type ? "is-selected" : ""}
              key={type}
              onClick={() => {
                onChange(type);
                if (pickerRef.current) pickerRef.current.open = false;
              }}
            >
              <span><strong>{adminMode && type === "custom" ? "Custom Section" : definition.name}</strong><small>{adminMode && type === "custom" ? "Paste isolated HTML and CSS for this invitation." : definition.description}</small></span>
              <b>+ Rs {definition.price}</b>
              {value === type && <Check aria-hidden="true" />}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

type SectionEditorProps = {
  section: InvitationSection;
  index: number;
  total: number;
  onActivate: () => void;
  onField: (field: string, value: string) => void;
  onItem: (itemIndex: number, field: string, value: string) => void;
  onAddItem: (item: InvitationSectionItem) => void;
  onRemoveItem: (itemIndex: number) => void;
  onTitle: (value: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onPhotos: (files: FileList | null) => void;
  onRemovePhoto: (imageIndex: number) => void;
  photoProgressLabel?: string;
  defaultOpen?: boolean;
  openWhenAdded?: boolean;
  adminMode: boolean;
  readOnlyMode?: boolean;
};

function SectionEditor({ section, index, total, onActivate, onField, onItem, onAddItem, onRemoveItem, onTitle, onMove, onDuplicate, onRemove, onPhotos, onRemovePhoto, photoProgressLabel = "", defaultOpen = true, openWhenAdded = false, adminMode, readOnlyMode = false }: SectionEditorProps) {
  const definition = sectionDefinitions[section.type];
  const [isOpen, setIsOpen] = useState(readOnlyMode || openWhenAdded || (defaultOpen && section.type === "countdown"));
  const mobileInitialOpen = useRef(index === 0 || openWhenAdded);
  const isAdminCustomSection = adminMode && section.type === "custom";

  useEffect(() => {
    // This editor owns the state after hydration; a separate client boundary must not mutate its server-rendered <details> DOM.
    if (!window.matchMedia("(max-width: 900px)").matches) return;
    setIsOpen(mobileInitialOpen.current);
  }, []);

  return (
    <details className="designer-section-editor" id={`editor-${section.id}`} open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)} onFocusCapture={onActivate}>
      <summary onClick={onActivate}>
        <span className="designer-section-order">{String(index + 1).padStart(2, "0")}</span>
        <span><strong>{isAdminCustomSection ? "Custom Section" : definition.name}</strong><small>{isAdminCustomSection ? section.title || "Untitled custom section" : definition.description}</small></span>
        <b className={section.included ? "is-included" : ""}>{section.included ? "Included" : `+ Rs ${definition.price}`}</b>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="designer-section-body">
        <SectionFields section={section} onTitle={onTitle} onField={onField} onItem={onItem} onAddItem={onAddItem} onRemoveItem={onRemoveItem} onPhotos={onPhotos} onRemovePhoto={onRemovePhoto} photoProgressLabel={photoProgressLabel} adminMode={adminMode} />
        <div className="designer-section-actions">
          <button type="button" onClick={() => onMove(-1)} disabled={index === 0}><MoveUp aria-hidden="true" /> Move up</button>
          <button type="button" onClick={() => onMove(1)} disabled={index === total - 1}><MoveDown aria-hidden="true" /> Move down</button>
          <button type="button" onClick={onDuplicate}><Copy aria-hidden="true" /> Add another like this</button>
          {!section.included && <button type="button" className="is-remove" onClick={onRemove}><Trash2 aria-hidden="true" /> Remove</button>}
        </div>
      </div>
    </details>
  );
}

function SectionFields({ section, onTitle, onField, onItem, onAddItem, onRemoveItem, onPhotos, onRemovePhoto, photoProgressLabel, adminMode }: {
  section: InvitationSection;
  onTitle: (value: string) => void;
  onField: (field: string, value: string) => void;
  onItem: (itemIndex: number, field: string, value: string) => void;
  onAddItem: (item: InvitationSectionItem) => void;
  onRemoveItem: (itemIndex: number) => void;
  onPhotos: (files: FileList | null) => void;
  onRemovePhoto: (imageIndex: number) => void;
  photoProgressLabel: string;
  adminMode: boolean;
}) {
  const items = getSectionItems(section);
  const headingField = <TextField label="Section heading" value={section.title} onChange={onTitle} full />;
  switch (section.type) {
    case "countdown":
      return <div className="designer-fields-grid"><TextField label="Small text above the countdown" value={section.fields.eyebrow ?? ""} onChange={(value) => onField("eyebrow", value)} full />{headingField}<TextArea label="Text below the countdown title" value={section.fields.message ?? ""} onChange={(value) => onField("message", value)} full rows={2} /><TextField label="Date to count down to" hint="Choose the celebration date (mm/dd/yyyy)." type="date" value={section.fields.date ?? ""} onChange={(value) => onField("date", value)} /><TextField label="Time to count down to" type="time" value={section.fields.time ?? ""} onChange={(value) => onField("time", value)} /></div>;
    case "journey":
      return (
        <div className="designer-repeatable-fields">
          <TextField label="Small introduction" value={section.fields.introduction ?? ""} onChange={(value) => onField("introduction", value)} full />
          {headingField}
          {items.map((item, itemIndex) => (
            <div className="designer-mini-event" key={itemIndex}>
              <div className="designer-mini-heading"><span>Moment {itemIndex + 1}</span>{items.length > 1 && <button type="button" onClick={() => onRemoveItem(itemIndex)}><Trash2 aria-hidden="true" /> Remove</button>}</div>
              <div className="designer-fields-grid">
                <TextField label="Moment title" value={item.title ?? ""} onChange={(value) => onItem(itemIndex, "title", value)} />
                <TextField label="Date or short label" value={item.date ?? ""} onChange={(value) => onItem(itemIndex, "date", value)} />
                <TextArea label="Short description" value={item.description ?? ""} onChange={(value) => onItem(itemIndex, "description", value)} full rows={2} />
              </div>
            </div>
          ))}
          <AddItemButton icon={<Plus />} label="Add a moment" onClick={() => onAddItem({ title: "Another special moment", date: "Add a date", description: "Tell your guests what made this moment special." })} />
        </div>
      );
    case "event-details":
      return (
        <div className="designer-repeatable-fields">
          {headingField}
          <TextArea label="Introduction above the event cards" value={section.fields.introduction ?? ""} onChange={(value) => onField("introduction", value)} full rows={2} />
          {items.map((item, itemIndex) => (
            <div className="designer-mini-event designer-event-entry" key={itemIndex}>
              <div className="designer-mini-heading"><span>Event {itemIndex + 1}</span>{items.length > 1 && <button type="button" onClick={() => onRemoveItem(itemIndex)}><Trash2 aria-hidden="true" /> Remove</button>}</div>
              <div className="designer-fields-grid">
                <TextField label="Event name" hint="For example: Nikah, Mehendi or Chawtari" value={item.name ?? ""} onChange={(value) => onItem(itemIndex, "name", value)} full />
                <TextField label="Event date" type="date" value={item.date ?? ""} onChange={(value) => onItem(itemIndex, "date", value)} />
                <TextField label="Start time" type="time" value={item.time ?? ""} onChange={(value) => onItem(itemIndex, "time", value)} icon={<Clock3 />} />
                <TextField label="Venue name" value={item.venue ?? ""} onChange={(value) => onItem(itemIndex, "venue", value)} />
                <TextField label="Town or full address" value={item.address ?? ""} onChange={(value) => onItem(itemIndex, "address", value)} />
                <TextField label="Venue map link (optional)" type="url" hint="If empty, the invitation uses the venue and address to offer Google Maps, Apple Maps and Waze directions." value={item.mapUrl ?? ""} onChange={(value) => onItem(itemIndex, "mapUrl", value)} full icon={<MapPin />} />
              </div>
            </div>
          ))}
          <AddItemButton icon={<CalendarPlus />} label="Add another event" onClick={() => onAddItem({ name: "Another celebration", date: "2027-05-23", time: "12:00", venue: "Venue name", address: "Town, Mauritius", mapUrl: "" })} />
        </div>
      );
    case "gift":
      return <div className="designer-fields-grid">{headingField}<TextArea label="Important note" value={section.fields.message ?? ""} onChange={(value) => onField("message", value)} full rows={4} /></div>;
    case "special-message":
      return (
        <div className="designer-fields-grid">
          <TextField label="Small text above the heading" value={section.fields.eyebrow ?? ""} onChange={(value) => onField("eyebrow", value)} full />
          {headingField}
          <TextArea label="Your main message" value={section.fields.message ?? ""} onChange={(value) => onField("message", value)} full rows={3} />
          <TextField label="Small dedication label" value={section.fields.dedicationLabel ?? ""} onChange={(value) => onField("dedicationLabel", value)} full />
          <TextField label="Who is this message for?" hint="For example: Our grandparents, our parents or our family" value={section.fields.recipient ?? ""} onChange={(value) => onField("recipient", value)} full />
          <TextField label="Small text below their name" value={section.fields.dedicationNote ?? ""} onChange={(value) => onField("dedicationNote", value)} full />
          <TextField label="Closing words" value={section.fields.signature ?? ""} onChange={(value) => onField("signature", value)} full />
        </div>
      );
    case "seating":
      return (
        <div className="designer-repeatable-fields">
          {headingField}
          <TextField label="Small introduction" value={section.fields.introduction ?? ""} onChange={(value) => onField("introduction", value)} full />
          <div className="designer-table-grid">
            {items.map((item, itemIndex) => (
              <div className="designer-mini-event designer-table-entry" key={itemIndex}>
                <div className="designer-mini-heading"><span><Users aria-hidden="true" /> Table {itemIndex + 1}</span>{items.length > 1 && <button type="button" onClick={() => onRemoveItem(itemIndex)} aria-label={`Delete table ${itemIndex + 1}`}><Trash2 aria-hidden="true" /> Delete</button>}</div>
                <div className="designer-table-fields">
                  <TextField label="Table name or number" value={item.table ?? ""} onChange={(value) => onItem(itemIndex, "table", value)} />
                  <TextArea label="People at this table" hint="Write one family or guest name per line." value={item.families ?? ""} onChange={(value) => onItem(itemIndex, "families", value)} rows={3} />
                </div>
              </div>
            ))}
            <button type="button" className="designer-add-table" onClick={() => onAddItem({ table: `Table ${items.length + 1}`, families: "Family name" })}>
              <span><Plus aria-hidden="true" /></span>
              <strong>Add another table</strong>
              <small>Create another table card</small>
            </button>
          </div>
        </div>
      );
    case "day-programme":
      return (
        <div className="designer-repeatable-fields">
          {headingField}
          <TextField label="Small introduction" value={section.fields.introduction ?? ""} onChange={(value) => onField("introduction", value)} full />
          {items.map((item, itemIndex) => (
            <div className="designer-mini-event designer-programme-entry" key={itemIndex}>
              <div className="designer-mini-heading"><span>Programme item {itemIndex + 1}</span>{items.length > 1 && <button type="button" onClick={() => onRemoveItem(itemIndex)}><Trash2 aria-hidden="true" /> Remove</button>}</div>
              <div className="designer-fields-grid">
                <TextField label="Choose the time" type="time" value={item.time ?? ""} onChange={(value) => onItem(itemIndex, "time", value)} icon={<Clock3 />} />
                <TextField label="Programme details" value={item.details ?? ""} onChange={(value) => onItem(itemIndex, "details", value)} />
                <TextField label="Small note below the programme" value={item.note ?? ""} onChange={(value) => onItem(itemIndex, "note", value)} full />
              </div>
            </div>
          ))}
          <AddItemButton icon={<Plus />} label="Add programme item" onClick={() => onAddItem({ time: "20:00", details: "Another programme item", note: "Add a helpful small note" })} />
        </div>
      );
    case "glimpse":
      return (
        <div className="designer-fields-grid">
          {headingField}
          <TextArea label="Gallery introduction" value={section.fields.message ?? ""} onChange={(value) => onField("message", value)} full rows={2} />
          <label className="designer-inline-upload">
            <Upload aria-hidden="true" /><span><strong>Add photos</strong><small>Choose up to 8 JPG, PNG, WebP or HEIC photos. Each photo can be up to 5 MB.</small></span>
            {photoProgressLabel && <PhotoUploadProgress label={photoProgressLabel} />}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" multiple onChange={(event) => { onPhotos(event.target.files); event.currentTarget.value = ""; }} />
          </label>
          {section.images.length > 0 && (
            <div className="designer-uploaded-strip">
              {section.images.map((image, index) => (
                <figure key={`${image}-${index}`}>
                  <img src={image} alt={`Glimpse preview ${index + 1}`} />
                  <button type="button" onClick={() => onRemovePhoto(index)} aria-label={`Remove glimpse photo ${index + 1}`}><Trash2 aria-hidden="true" /></button>
                </figure>
              ))}
            </div>
          )}
        </div>
      );
    case "custom":
      if (!adminMode) return <div className="designer-custom-consultation"><Video aria-hidden="true" /><div><strong>Your custom part will be designed with you.</strong><p>We will contact you. You do not have to edit anything here.</p></div></div>;
      return (
        <div className="designer-custom-editor">
          <div className="designer-custom-editor-heading">
            <Code2 aria-hidden="true" />
            <div><strong>Custom section source</strong><p>Paste HTML and CSS below. The phone preview updates as you type, and scripts are never executed.</p></div>
          </div>
          <div className="designer-fields-grid">
            <TextField label="Section Name" hint="Used to identify this section in the admin dashboard." value={section.title} onChange={onTitle} full maxLength={200} />
            <TextArea label="HTML" hint={`Safe HTML only · up to ${maxCustomSectionHtmlLength.toLocaleString("en-US")} characters`} value={section.fields[customSectionHtmlField] ?? ""} onChange={(value) => onField(customSectionHtmlField, value)} full rows={12} code maxLength={maxCustomSectionHtmlLength} />
            <details className="designer-custom-theme-reference">
              <summary>
                <Palette aria-hidden="true" />
                <span><strong>Invitation palette variables</strong><small>Automatically use this invitation&apos;s selected colour palette.</small></span>
                <ChevronDown aria-hidden="true" />
              </summary>
              <div className="designer-custom-theme-tokens">
                {invitationThemeVariableDefinitions.map((variable) => (
                  <div key={variable.name}><code>{`var(${variable.name})`}</code><span>{variable.description}</span></div>
                ))}
              </div>
              <p><strong>Example</strong><code>{`.custom-section { color: var(--invitation-text); background: var(--invitation-background); }`}</code></p>
            </details>
            <TextArea label="CSS" hint={`Scoped to this section · responsive @media rules are supported · up to ${maxCustomSectionCssLength.toLocaleString("en-US")} characters`} value={section.fields[customSectionCssField] ?? ""} onChange={(value) => onField(customSectionCssField, value)} full rows={12} code maxLength={maxCustomSectionCssLength} />
          </div>
          <div className="designer-custom-security"><LockKeyhole aria-hidden="true" /><span>HTML is sanitized before previewing and saving. JavaScript, event handlers, embedded frames and objects are blocked.</span></div>
        </div>
      );
  }
}

function AddItemButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" className="designer-add-item" onClick={onClick}>{icon}{label}</button>;
}

function PhotoUploadProgress({ label, card = false }: { label: string; card?: boolean }) {
  return <div className={`designer-photo-inline-progress ${card ? "is-card" : ""}`} role="status" aria-live="polite"><Loader2 aria-hidden="true" /><span>{label}</span></div>;
}

function TextField({ label, hint, placeholder, value, onChange, full = false, type = "text", minLength, maxLength, pattern, title, icon, autoComplete, inputMode, required = false }: { label: string; hint?: string; placeholder?: string; value: string; onChange: (value: string) => void; full?: boolean; type?: string; minLength?: number; maxLength?: number; pattern?: string; title?: string; icon?: ReactNode; autoComplete?: string; inputMode?: "text" | "tel" | "email" | "numeric"; required?: boolean }) {
  return <label className={`designer-field ${full ? "is-full" : ""}`}><span>{icon}{label}</span><input type={type} lang={type === "time" ? "en-GB" : undefined} value={value ?? ""} placeholder={placeholder} minLength={minLength} maxLength={maxLength} pattern={pattern} title={title} autoComplete={autoComplete} inputMode={inputMode} required={required} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
}

function TextArea({ label, hint, value, onChange, full = false, rows = 3, code = false, maxLength }: { label: string; hint?: string; value: string; onChange: (value: string) => void; full?: boolean; rows?: number; code?: boolean; maxLength?: number }) {
  return <label className={`designer-field ${full ? "is-full" : ""} ${code ? "is-code" : ""}`}><span>{label}</span><textarea value={value ?? ""} rows={rows} maxLength={maxLength} spellCheck={!code} autoCapitalize={code ? "off" : undefined} autoCorrect={code ? "off" : undefined} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
}

async function createInvitation(config: InvitationConfig, slots: string[], submissionKey: string): Promise<SubmissionIdentity> {
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": submissionKey },
    body: JSON.stringify({ config, ...(slots.length ? { slots } : {}) }),
  });
  const result = await response.json() as { id?: string; uploadToken?: string; error?: string };
  if (!response.ok || !result.id || (slots.length > 0 && !result.uploadToken)) throw new Error(result.error || "Your invitation could not be sent.");
  return { id: result.id, uploadToken: result.uploadToken };
}

async function finalizeInvitationMedia(config: InvitationConfig, submission: SubmissionIdentity, media: UploadedPhoto[]) {
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operation: "finalize-media", id: submission.id, uploadToken: submission.uploadToken, config, media }),
  });
  const result = await response.json() as { id?: string; error?: string };
  if (!response.ok || !result.id) throw new Error(result.error || "Your photo submission could not be completed.");
}

async function cleanupUploadedPhotos(endpoint: string, invitationId: string, media: UploadedPhoto[], uploadToken?: string) {
  try {
    const response = await fetch(endpoint, {
      method: uploadToken ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(uploadToken
        ? { operation: "cancel-media", id: invitationId, uploadToken, media }
        : { invitationId, media }),
    });
    const result = await response.json() as { committed?: boolean };
    return response.ok && result.committed === true;
  } catch (cause) {
    console.warn("Uploaded photo cleanup could not be completed", cause);
    return false;
  }
}

async function updateAdminOrder(id: string, revision: number, action: "save" | "deploy" | "deactivate" | "review", values: Record<string, unknown>) {
  const response = await fetch("/api/dashboard/orders", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, revision, action, ...values }),
  });
  const result = await response.json() as { order?: AdminInvitationOrder; error?: string };
  if (!response.ok || !result.order) throw new Error(result.error || "The order could not be updated.");
  return result.order;
}

function removeLocalPhotoUrls(config: InvitationConfig): InvitationConfig {
  return {
    ...config,
    hero: { ...config.hero, uploadedUrl: config.hero.uploadedUrl.startsWith("blob:") ? "" : config.hero.uploadedUrl },
    sections: config.sections.map((section) => ({ ...section, images: section.images.filter((url) => !url.startsWith("blob:")) })),
  };
}

function applyUploadedUrls(config: InvitationConfig, uploads: Record<string, string[]>): InvitationConfig {
  return {
    ...config,
    hero: uploads.hero?.[0] ? { ...config.hero, photoSource: "upload", uploadedUrl: uploads.hero[0] } : config.hero,
    sections: config.sections.map((section) => {
      const urls = uploads[`section:${section.id}:images`];
      return urls?.length ? { ...section, images: [...section.images, ...urls].slice(0, 8) } : section;
    }),
  };
}

function updateOrderEventDate(config: InvitationConfig, date: string): InvitationConfig {
  const next = structuredClone(config);
  next.hero.date = date;
  const countdown = next.sections.find((section) => section.type === "countdown");
  if (countdown) countdown.fields.date = date;
  const events = next.sections.find((section) => section.type === "event-details");
  if (events) {
    const items = getSectionItems(events).map((item) => ({ ...item }));
    if (items[0]) items[0].date = date;
    events.items = items;
  }
  return next;
}

function suggestActiveUntil(order: InvitationOrderRecord, config: InvitationConfig, today: string) {
  const eventDate = getPrimaryEventDate(config);
  const candidate = order.active_until || eventDate || today;
  return candidate && candidate >= today ? candidate : today;
}
