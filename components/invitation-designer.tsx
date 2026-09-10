"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Copy,
  Heart,
  Image as ImageIcon,
  Info,
  LockKeyhole,
  MapPin,
  Monitor,
  MoveDown,
  MoveUp,
  Palette,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { InvitationPhonePreview } from "@/components/invitation-phone-preview";
import {
  bismillahAssets,
  calculateInvitationPrice,
  createInitialInvitation,
  createSection,
  getPalette,
  getHeroPresets,
  getSectionItems,
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

type DraftIdentity = { id: string; editToken: string };
type SaveState = "idle" | "saving" | "saved" | "error";
type PreviewFocus = { target: string; key: number };

const draftStorageKey = "paperless-invites-active-draft";
const maxImageBytes = 5 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function InvitationDesigner() {
  const [config, setConfig] = useState<InvitationConfig>(() => createInitialInvitation());
  const [addType, setAddType] = useState<SectionType>("special-message");
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
  const [draft, setDraft] = useState<DraftIdentity | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [showDesktopTip, setShowDesktopTip] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [previewFocus, setPreviewFocus] = useState<PreviewFocus>({ target: "hero", key: 0 });
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const objectUrls = useRef<string[]>([]);
  const price = useMemo(() => calculateInvitationPrice(config), [config]);
  const palette = getPalette(config.palette);
  const availableHeroPresets = getHeroPresets(config);
  const saveButtonText = saveState === "saving" ? "Saving…" : draft ? "Save changes" : "Save my design";

  useEffect(() => {
    const saved = window.localStorage.getItem(draftStorageKey);
    if (!saved) return;
    try {
      const identity = JSON.parse(saved) as DraftIdentity;
      if (!identity.id || !identity.editToken) return;
      window.setTimeout(() => setDraft(identity), 0);
      fetch(`/api/invitations?id=${encodeURIComponent(identity.id)}&token=${encodeURIComponent(identity.editToken)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Draft unavailable");
          return response.json() as Promise<{ invitation: { config: InvitationConfig; updated_at?: string } }>;
        })
        .then(({ invitation }) => {
          if (invitation.config?.version === 1) setConfig(normalizeInvitationConfig(invitation.config));
        })
        .catch(() => {
          window.localStorage.removeItem(draftStorageKey);
          setDraft(null);
        });
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, []);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowDesktopTip(false), 7000);
    return () => window.clearTimeout(timer);
  }, []);

  function updateConfig(updater: (current: InvitationConfig) => InvitationConfig) {
    setConfig((current) => updater(current));
    if (saveState === "saved") setSaveState("idle");
    if (saveError) setSaveError("");
  }

  function activatePreview(target: string) {
    setPreviewFocus((current) => ({ target, key: current.key + 1 }));
  }

  function choosePalette(id: PaletteId) {
    updateConfig((current) => ({ ...current, palette: id }));
  }

  function chooseBismillah(enabled: boolean) {
    updateConfig((current) => ({ ...current, bismillah: { enabled } }));
    activatePreview(enabled ? "bismillah" : "hero");
  }

  function chooseOpening(type: OpeningType) {
    const defaultAsset = type === "curtain" ? openingAssets.curtain[0].id : openingAssets.envelope[0].id;
    updateConfig((current) => ({ ...current, opening: { ...current.opening, type, asset: defaultAsset } }));
    setReplayKey((key) => key + 1);
    activatePreview(type === "none" ? "hero" : "opening");
  }

  function chooseHero(type: HeroType) {
    setPendingFiles((current) => {
      const next = { ...current };
      delete next.hero;
      return next;
    });
    updateConfig((current) => ({
      ...current,
      hero: { ...current.hero, type, photoSource: "preset", presetIndex: 0, uploadedUrl: "" },
    }));
    activatePreview("hero");
  }

  function chooseHeroPreset(index: number) {
    setPendingFiles((current) => {
      const next = { ...current };
      delete next.hero;
      return next;
    });
    updateConfig((current) => ({ ...current, hero: { ...current.hero, photoSource: "preset", presetIndex: index } }));
    activatePreview("hero");
  }

  function updateHero(field: keyof InvitationConfig["hero"], value: string | number) {
    updateConfig((current) => ({
      ...current,
      hero: { ...current.hero, [field]: value } as InvitationConfig["hero"],
    }));
  }

  function updateContact(field: keyof InvitationConfig["contact"], value: string) {
    const normalized = field === "phone" ? value.replace(/\D/g, "").slice(0, 8) : value;
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
    updateConfig((current) => ({ ...current, sections: [...current.sections, section] }));
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
    updateConfig((current) => {
      const index = current.sections.findIndex((item) => item.id === section.id);
      const sections = [...current.sections];
      sections.splice(index + 1, 0, copy);
      return { ...current, sections };
    });
  }

  function removeSection(id: string) {
    const section = config.sections.find((item) => item.id === id);
    if (!section || section.included) return;
    updateConfig((current) => ({ ...current, sections: current.sections.filter((item) => item.id !== id) }));
    setPendingFiles((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.includes(id))));
  }

  function moveSection(id: string, direction: -1 | 1) {
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
    if (files.find((file) => !acceptedImageTypes.has(file.type))) return "Please choose JPG, PNG or WebP photos.";
    if (files.find((file) => file.size > maxImageBytes)) return "Each photo must be 5 MB or smaller.";
    return "";
  }

  function selectHeroPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const error = validateFiles([file]);
    if (error) return;
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setPendingFiles((current) => ({ ...current, hero: [file] }));
    updateConfig((current) => ({ ...current, hero: { ...current.hero, photoSource: "upload", uploadedUrl: url } }));
    activatePreview("hero");
  }

  function selectGlimpsePhotos(sectionId: string, list: FileList | null) {
    const currentCount = config.sections.find((section) => section.id === sectionId)?.images.length ?? 0;
    const files = Array.from(list ?? []).slice(0, Math.max(0, 8 - currentCount));
    if (!files.length) return;
    const error = validateFiles(files);
    if (error) return;
    const urls = files.map((file) => URL.createObjectURL(file));
    objectUrls.current.push(...urls);
    const slot = `section:${sectionId}:images`;
    setPendingFiles((current) => ({ ...current, [slot]: [...(current[slot] ?? []), ...files] }));
    updateSection(sectionId, (section) => ({ ...section, images: [...section.images, ...urls].slice(0, 8) }));
    activatePreview(sectionId);
  }

  async function saveDesign(event: FormEvent) {
    event.preventDefault();
    if (saveState === "saving") return;
    setSaveState("saving");
    setSaveError("");

    try {
      let workingConfig = removeLocalPhotoUrls(config);
      let identity = draft;
      const firstSave = await saveInvitation(workingConfig, identity);
      identity = { id: firstSave.id, editToken: firstSave.editToken };
      setDraft(identity);
      window.localStorage.setItem(draftStorageKey, JSON.stringify(identity));

      const uploadedBySlot: Record<string, string[]> = {};
      for (const [slot, files] of Object.entries(pendingFiles)) {
        uploadedBySlot[slot] = [];
        for (let index = 0; index < files.length; index += 1) {
          const form = new FormData();
          form.set("file", files[index]);
          form.set("invitationId", identity.id);
          form.set("editToken", identity.editToken);
          form.set("slot", `${slot}:${index}`);
          const response = await fetch("/api/invitations/media", { method: "POST", body: form });
          const result = await response.json() as { url?: string; error?: string };
          if (!response.ok || !result.url) throw new Error(result.error || "A photo could not be uploaded.");
          uploadedBySlot[slot].push(result.url);
        }
      }

      if (Object.keys(uploadedBySlot).length) {
        workingConfig = applyUploadedUrls(workingConfig, uploadedBySlot);
        await saveInvitation(workingConfig, identity);
      }

      setConfig(workingConfig);
      setPendingFiles({});
      setSaveState("saved");
    } catch (error) {
      console.error("Unable to save invitation design", error);
      setSaveState("error");
      setSaveError("An error happened while saving your design. If it persists, please contact us on WhatsApp or social media.");
    }
  }

  function showMobilePreview() {
    setMobileView("preview");
    setPreviewFocus((current) => ({ ...current, key: current.key + 1 }));
  }

  return (
    <main className={`designer-page designer-mobile-${mobileView}`} style={{ "--builder-accent": palette.theme.primary, "--builder-soft": palette.theme.background } as CSSProperties}>
      <header className="designer-header">
        <Link href="/" className="designer-back"><ArrowLeft aria-hidden="true" /> Back to Paperless Invites</Link>
        <div className="designer-title">
          <span className="designer-brand-mark">PI</span>
          <div><p>Invitation designer</p><h1>Create your invitation</h1></div>
        </div>
        <div className="designer-header-price"><span>Your price</span><strong>Rs {price.total.toLocaleString("en-US")}</strong></div>
      </header>

      <nav className="designer-steps" aria-label="Invitation design steps">
        <a href="#designer-colours"><span>1</span>Colours</a>
        <a href="#designer-opening"><span>2</span>Opening</a>
        <a href="#designer-hero"><span>3</span>Main photo</a>
        <a href="#designer-sections"><span>4</span>Parts</a>
      </nav>

      <div className="designer-mobile-switch" aria-label="Choose editor or preview">
        <button type="button" className={mobileView === "edit" ? "is-active" : ""} onClick={() => setMobileView("edit")}>Edit invitation</button>
        <button type="button" className={mobileView === "preview" ? "is-active" : ""} onClick={showMobilePreview}>View preview</button>
      </div>

      <div className="designer-fixed-price" role="status" aria-live="polite">
        <div><small>Total price</small><strong>Rs {price.total.toLocaleString("en-US")}</strong></div>
      </div>

      {showDesktopTip && <div className="designer-device-tip" role="status"><Monitor aria-hidden="true" /><span>For the easiest design experience, use a laptop or desktop computer.</span></div>}

      <div className="designer-workspace">
        <form id="invitation-designer-form" className="designer-form" onSubmit={saveDesign}>
          <div className="designer-welcome">
            <Sparkles aria-hidden="true" />
            <div><strong>Start with the choices below.</strong><p>Your phone preview changes immediately. When you click into a field, it moves to that same part for you.</p></div>
          </div>

          <section className="designer-step-card" id="designer-colours">
            <StepHeading number="1" icon={<Palette />} title="Choose your colours" description="The same artwork changes into your selected colour, so the design stays consistent." />
            <div className="designer-palette-grid">
              {paletteOptions.map((option) => (
                <button type="button" key={option.id} className={`designer-palette-option ${config.palette === option.id ? "is-selected" : ""}`} onClick={() => choosePalette(option.id)} aria-pressed={config.palette === option.id}>
                  <span className="designer-palette-colours">{option.colors.map((color) => <i key={color} style={{ background: color }} />)}</span>
                  <span><strong>{option.name}</strong><small>{option.description}</small></span>
                  {config.palette === option.id && <Check aria-hidden="true" />}
                </button>
              ))}
            </div>

            <div className="designer-bismillah-picker">
              <div className="designer-subheading">
                <strong>Add Bismillah at the top?</strong>
                <span>The calligraphy is always displayed in white for a clear, elegant finish.</span>
              </div>
              <div className="designer-choice-grid">
                <ChoiceButton selected={config.bismillah.enabled} title="Show Bismillah" description="Place the calligraphy above the invitation names." price={0} onClick={() => chooseBismillah(true)} />
                <ChoiceButton selected={!config.bismillah.enabled} title="Without Bismillah" description="Start directly with the main photo area." price={0} onClick={() => chooseBismillah(false)} />
              </div>
              {config.bismillah.enabled && (
                <div className="designer-bismillah-sample" aria-label="White Bismillah artwork selected">
                  <img src={bismillahAssets[config.palette]} alt="Bismillah ir-Rahman ir-Rahim" />
                  <span><strong>White calligraphy</strong><small>The same clear artwork is used with every colour palette.</small></span>
                </div>
              )}
            </div>
          </section>

          <section className="designer-step-card" id="designer-opening" onFocusCapture={() => activatePreview("opening")}>
            <StepHeading number="2" icon={<Sparkles />} title="Choose how it opens" description="You can replay the opening as many times as you like while designing." />
            <div className="designer-choice-grid designer-opening-options">
              {openingOptions.map((option) => (
                <ChoiceButton key={option.id} selected={config.opening.type === option.id} title={option.name} description={option.description} price={option.price} onClick={() => chooseOpening(option.id)} />
              ))}
            </div>

            {config.opening.type !== "none" && (
              <div className="designer-conditional-panel">
                <div className="designer-subheading"><strong>Choose the {config.opening.type === "envelope" ? "envelope" : "curtain"} style</strong><span>It will open full-screen in your guest&apos;s invitation.</span></div>
                <div className="designer-image-options designer-opening-images">
                  {(config.opening.type === "envelope" ? openingAssets.envelope : openingAssets.curtain).map((asset) => (
                    <button type="button" key={asset.id} className={config.opening.asset === asset.id ? "is-selected" : ""} onClick={() => {
                      updateConfig((current) => ({ ...current, opening: { ...current.opening, asset: asset.id } }));
                      setReplayKey((key) => key + 1);
                      activatePreview("opening");
                    }}>
                      <span className={`designer-opening-thumb ${config.opening.type === "envelope" ? "is-envelope" : ""}`}><img src={asset.urls[config.palette]} alt="" /></span>
                      <strong>{asset.name}</strong>
                      {config.opening.asset === asset.id && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                <div className={`designer-opening-actions ${config.opening.type === "curtain" ? "is-curtain" : ""}`}>
                  {config.opening.type === "envelope" && (
                    <TextField
                      label="Initials for the wax seal"
                      value={config.opening.initials}
                      maxLength={7}
                      onChange={(value) => updateConfig((current) => ({ ...current, opening: { ...current.opening, initials: value } }))}
                    />
                  )}
                  <button className="designer-replay-button" type="button" onClick={() => { setReplayKey((key) => key + 1); activatePreview("opening"); showMobilePreview(); }}><RotateCcw aria-hidden="true" /> Preview this opening again</button>
                  {config.opening.type === "envelope" && <p className="designer-opening-note">Your initials do not appear in the mobile preview. They will be added only to the finished envelope when your invitation is deployed.</p>}
                </div>
              </div>
            )}
          </section>

          <section className="designer-step-card" id="designer-hero" onFocusCapture={() => activatePreview("hero")}>
            <StepHeading number="3" icon={<ImageIcon />} title="Choose the main photo area" description="This is the first part your guests will see after the opening." />
            <div className="designer-choice-grid">
              <ChoiceButton selected={config.hero.type === "basic"} title="Basic hero" description="Your chosen photo appears in the background." price={0} onClick={() => chooseHero("basic")} />
              <ChoiceButton selected={config.hero.type === "interactive"} title="Interactive hero" description="Guests scratch only the framed photo to reveal it." price={200} onClick={() => chooseHero("interactive")} featured />
            </div>

            <div className="designer-photo-picker">
              <div className="designer-subheading"><strong>Choose a photo</strong><span>{config.hero.type === "basic" ? "Each venue keeps the exact same composition when you change colours." : "Choose an intimate couple detail, or upload your own portrait photo."}</span></div>
              <div className="designer-image-options designer-hero-images">
                {availableHeroPresets.map((asset, index) => (
                  <button type="button" key={asset.id} className={config.hero.photoSource === "preset" && config.hero.presetIndex === index ? "is-selected" : ""} onClick={() => chooseHeroPreset(index)}>
                    <span className="designer-hero-thumb"><img src={asset.url} alt={`${asset.name} preset`} style={{ objectPosition: asset.objectPosition, transform: `scale(${asset.zoom})` }} /></span>
                    <strong>{asset.name}</strong>
                    {config.hero.photoSource === "preset" && config.hero.presetIndex === index && <Check aria-hidden="true" />}
                  </button>
                ))}
                {config.hero.type === "interactive" && (
                  <label className={`designer-upload-option ${config.hero.photoSource === "upload" ? "is-selected" : ""}`}>
                    {config.hero.photoSource === "upload" && config.hero.uploadedUrl ? <img src={config.hero.uploadedUrl} alt="Your uploaded hero preview" /> : <span><Upload aria-hidden="true" /><strong>Upload your photo</strong><small>JPG, PNG or WebP · max 5 MB</small></span>}
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectHeroPhoto(event.target.files)} />
                    {config.hero.photoSource === "upload" && <Check aria-hidden="true" />}
                  </label>
                )}
              </div>
            </div>

            <div className="designer-fields-grid designer-hero-copy-fields">
              <TextField label="Small text above the names" value={config.hero.eyebrow} onChange={(value) => updateHero("eyebrow", value)} full />
              <TextField label="First name" value={config.hero.firstName} onChange={(value) => updateHero("firstName", value)} />
              <TextField label="Second name" value={config.hero.secondName} onChange={(value) => updateHero("secondName", value)} />
              <TextArea label="Invitation message" value={config.hero.message} onChange={(value) => updateHero("message", value)} full rows={2} />
            </div>
          </section>

          <section className="designer-step-card designer-sections-step" id="designer-sections">
            <StepHeading number="4" icon={<Heart />} title="Choose and write your invitation parts" description="The four important parts are included. Add any other part as many times as you need." />
            <div className="designer-included-note"><LockKeyhole aria-hidden="true" /><span><strong>Already included:</strong> Countdown, Our Journey, Event Details + Location and Gift Preferences.</span></div>

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
                />
              ))}
            </div>

            <div className="designer-add-section">
              <div><Plus aria-hidden="true" /><span><strong>Add another part</strong><small>You can add the same part more than once.</small></span></div>
              <SectionPicker value={addType} onChange={setAddType} />
              <button type="button" onClick={() => addSection()}><Plus aria-hidden="true" /> Add this part</button>
            </div>
          </section>

          <section className="designer-price-summary" aria-labelledby="designer-price-title">
            <div><CircleDollarSign aria-hidden="true" /><span><small>Your current price</small><strong id="designer-price-title">Rs {price.total.toLocaleString("en-US")}</strong></span></div>
            <dl>
              <div><dt>Basic invitation</dt><dd>Rs {price.base.toLocaleString("en-US")}</dd></div>
              {price.opening > 0 && <div><dt>{config.opening.type === "envelope" ? "Envelope opening" : "Curtain opening"}</dt><dd>+ Rs {price.opening}</dd></div>}
              {price.hero > 0 && <div><dt>Interactive hero</dt><dd>+ Rs {price.hero}</dd></div>}
              {price.sections > 0 && <div><dt>Extra invitation parts</dt><dd>+ Rs {price.sections.toLocaleString("en-US")}</dd></div>}
            </dl>
            <p>The price updates instantly. You will still review the finished invitation before payment.</p>
          </section>

          <section className="designer-contact-card" aria-labelledby="designer-contact-title">
            <div className="designer-contact-heading">
              <span><UserRound aria-hidden="true" /></span>
              <div>
                <p>Final step</p>
                <h2 id="designer-contact-title">How can we contact you?</h2>
                <span>We will contact you to share payment details or arrange a video consultation.</span>
              </div>
            </div>
            <div className="designer-fields-grid">
              <TextField label="Your name" value={config.contact.name} onChange={(value) => updateContact("name", value)} autoComplete="name" required icon={<UserRound />} />
              <TextField label="Mauritian phone or WhatsApp number" hint="Enter exactly 8 digits, starting with 5 (for example: 58749327)." type="tel" value={config.contact.phone} onChange={(value) => updateContact("phone", value)} autoComplete="tel" inputMode="numeric" minLength={8} maxLength={8} pattern="5[0-9]{7}" title="Enter a Mauritian phone number with exactly 8 digits, starting with 5." required icon={<Phone />} />
            </div>
          </section>

          {saveError && <div className="designer-notice is-error" role="alert"><Info aria-hidden="true" />{saveError}</div>}
          <button className="designer-final-save" type="submit" disabled={saveState === "saving"}><Save aria-hidden="true" />{saveButtonText}</button>
        </form>

        <InvitationPhonePreview config={config} replayKey={replayKey} focusTarget={previewFocus.target} focusKey={previewFocus.key} onReplay={() => { setReplayKey((key) => key + 1); activatePreview("opening"); }} />
      </div>

    </main>
  );
}

function StepHeading({ number, icon, title, description }: { number: string; icon: ReactNode; title: string; description: string }) {
  return <div className="designer-step-heading"><span className="designer-step-number">{number}</span><span className="designer-step-icon" aria-hidden="true">{icon}</span><div><h2>{title}</h2><p>{description}</p></div></div>;
}

function ChoiceButton({ selected, title, description, price, onClick, featured = false }: { selected: boolean; title: string; description: string; price: number; onClick: () => void; featured?: boolean }) {
  return (
    <button type="button" className={`designer-choice ${selected ? "is-selected" : ""} ${featured ? "is-featured" : ""}`} onClick={onClick} aria-pressed={selected}>
      <span className="designer-radio">{selected && <Check aria-hidden="true" />}</span>
      <span><strong>{title}</strong><small>{description}</small></span>
      <b>{price ? `+ Rs ${price}` : "Included"}</b>
    </button>
  );
}

function SectionPicker({ value, onChange }: { value: SectionType; onChange: (value: SectionType) => void }) {
  const pickerRef = useRef<HTMLDetailsElement>(null);
  const selected = sectionDefinitions[value];
  const options = Object.entries(sectionDefinitions) as Array<[SectionType, (typeof sectionDefinitions)[SectionType]]>;

  return (
    <div className="designer-part-picker">
      <span>Choose an additional part</span>
      <details ref={pickerRef}>
        <summary>
          <span><strong>{selected.name}</strong><small>{selected.description}</small></span>
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
              <span><strong>{definition.name}</strong><small>{definition.description}</small></span>
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
};

function SectionEditor({ section, index, total, onActivate, onField, onItem, onAddItem, onRemoveItem, onTitle, onMove, onDuplicate, onRemove, onPhotos }: SectionEditorProps) {
  const definition = sectionDefinitions[section.type];
  const [isOpen, setIsOpen] = useState(section.type === "event-details" || (!section.included && index === total - 1));
  return (
    <details className="designer-section-editor" id={`editor-${section.id}`} open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)} onFocusCapture={onActivate}>
      <summary onClick={onActivate}>
        <span className="designer-section-order">{String(index + 1).padStart(2, "0")}</span>
        <span><strong>{definition.name}</strong><small>{definition.description}</small></span>
        <b className={section.included ? "is-included" : ""}>{section.included ? "Included" : `+ Rs ${definition.price}`}</b>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="designer-section-body">
        {section.type !== "custom" && <TextField label="Section heading" value={section.title} onChange={onTitle} full />}
        <SectionFields section={section} onField={onField} onItem={onItem} onAddItem={onAddItem} onRemoveItem={onRemoveItem} onPhotos={onPhotos} />
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

function SectionFields({ section, onField, onItem, onAddItem, onRemoveItem, onPhotos }: {
  section: InvitationSection;
  onField: (field: string, value: string) => void;
  onItem: (itemIndex: number, field: string, value: string) => void;
  onAddItem: (item: InvitationSectionItem) => void;
  onRemoveItem: (itemIndex: number) => void;
  onPhotos: (files: FileList | null) => void;
}) {
  const items = getSectionItems(section);
  switch (section.type) {
    case "countdown":
      return <div className="designer-fields-grid"><TextField label="Date to count down to" hint="The live countdown uses this date, independently from your event cards." type="date" value={section.fields.date ?? ""} onChange={(value) => onField("date", value)} full /><TextField label="Small text above the countdown" value={section.fields.eyebrow ?? ""} onChange={(value) => onField("eyebrow", value)} full /><TextArea label="Text below the countdown title" value={section.fields.message ?? ""} onChange={(value) => onField("message", value)} full rows={2} /></div>;
    case "journey":
      return (
        <div className="designer-repeatable-fields">
          <TextField label="Small introduction" value={section.fields.introduction ?? ""} onChange={(value) => onField("introduction", value)} full />
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
                <TextField label="Google Maps link (optional)" type="url" hint="If empty, the map searches for the venue and address." value={item.mapUrl ?? ""} onChange={(value) => onItem(itemIndex, "mapUrl", value)} full icon={<MapPin />} />
              </div>
            </div>
          ))}
          <AddItemButton icon={<CalendarPlus />} label="Add another event" onClick={() => onAddItem({ name: "Another celebration", date: "2027-05-23", time: "12:00", venue: "Venue name", address: "Town, Mauritius", mapUrl: "" })} />
        </div>
      );
    case "gift":
      return <TextArea label="Gift message" value={section.fields.message ?? ""} onChange={(value) => onField("message", value)} full rows={4} />;
    case "special-message":
      return <div className="designer-fields-grid"><TextField label="Who is this message for?" hint="For example: Our grandparents, our parents or our family" value={section.fields.recipient ?? ""} onChange={(value) => onField("recipient", value)} full /><TextArea label="Your message" value={section.fields.message ?? ""} onChange={(value) => onField("message", value)} full rows={4} /></div>;
    case "seating":
      return (
        <div className="designer-repeatable-fields">
          <TextField label="Small introduction" value={section.fields.introduction ?? ""} onChange={(value) => onField("introduction", value)} full />
          {items.map((item, itemIndex) => (
            <div className="designer-mini-event designer-table-entry" key={itemIndex}>
              <div className="designer-mini-heading"><span><Users aria-hidden="true" /> Table {itemIndex + 1}</span>{items.length > 1 && <button type="button" onClick={() => onRemoveItem(itemIndex)}><Trash2 aria-hidden="true" /> Remove</button>}</div>
              <div className="designer-fields-grid">
                <TextField label="Table name" value={item.table ?? ""} onChange={(value) => onItem(itemIndex, "table", value)} />
                <TextArea label="Families at this table" hint="Write one family name per line." value={item.families ?? ""} onChange={(value) => onItem(itemIndex, "families", value)} rows={2} />
              </div>
            </div>
          ))}
          <AddItemButton icon={<Plus />} label="Add another table" onClick={() => onAddItem({ table: `Table ${items.length + 1}`, families: "Family name" })} />
        </div>
      );
    case "day-programme":
      return (
        <div className="designer-repeatable-fields">
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
          <TextArea label="Gallery introduction" value={section.fields.message ?? ""} onChange={(value) => onField("message", value)} full rows={2} />
          <label className="designer-inline-upload">
            <Upload aria-hidden="true" /><span><strong>Add photos</strong><small>Choose up to 8 JPG, PNG or WebP photos. Each photo can be up to 5 MB.</small></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => onPhotos(event.target.files)} />
          </label>
          {section.images.length > 0 && <div className="designer-uploaded-strip">{section.images.map((image, index) => <img src={image} alt={`Glimpse preview ${index + 1}`} key={`${image}-${index}`} />)}</div>}
        </div>
      );
    case "custom":
      return <div className="designer-custom-consultation"><Video aria-hidden="true" /><div><strong>Your custom part will be designed with you.</strong><p>We will discuss the idea, wording, visuals and interaction during a video consultation. There is nothing to edit here yet.</p><span>Custom design consultation · + Rs 500</span></div></div>;
  }
}

function AddItemButton({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return <button type="button" className="designer-add-item" onClick={onClick}>{icon}{label}</button>;
}

function TextField({ label, hint, value, onChange, full = false, type = "text", minLength, maxLength, pattern, title, icon, autoComplete, inputMode, required = false }: { label: string; hint?: string; value: string; onChange: (value: string) => void; full?: boolean; type?: string; minLength?: number; maxLength?: number; pattern?: string; title?: string; icon?: ReactNode; autoComplete?: string; inputMode?: "text" | "tel" | "email" | "numeric"; required?: boolean }) {
  return <label className={`designer-field ${full ? "is-full" : ""}`}><span>{icon}{label}</span><input type={type} value={value ?? ""} minLength={minLength} maxLength={maxLength} pattern={pattern} title={title} autoComplete={autoComplete} inputMode={inputMode} required={required} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
}

function TextArea({ label, hint, value, onChange, full = false, rows = 3 }: { label: string; hint?: string; value: string; onChange: (value: string) => void; full?: boolean; rows?: number }) {
  return <label className={`designer-field ${full ? "is-full" : ""}`}><span>{label}</span><textarea value={value ?? ""} rows={rows} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
}

async function saveInvitation(config: InvitationConfig, draft: DraftIdentity | null) {
  const response = await fetch("/api/invitations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ config, id: draft?.id, editToken: draft?.editToken }),
  });
  const result = await response.json() as { id?: string; editToken?: string; error?: string };
  if (!response.ok || !result.id || !result.editToken) throw new Error(result.error || "Your design could not be saved.");
  return { id: result.id, editToken: result.editToken };
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
