"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  CircleDollarSign,
  Copy,
  Heart,
  Image as ImageIcon,
  Info,
  LockKeyhole,
  MapPin,
  MoveDown,
  MoveUp,
  Palette,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { InvitationPhonePreview } from "@/components/invitation-phone-preview";
import {
  calculateInvitationPrice,
  createInitialInvitation,
  createSection,
  getPalette,
  heroPresets,
  openingAssets,
  openingOptions,
  paletteOptions,
  sectionDefinitions,
  type HeroType,
  type InvitationConfig,
  type InvitationSection,
  type OpeningType,
  type PaletteId,
  type SectionType,
} from "@/lib/invitation-designer";

type DraftIdentity = { id: string; editToken: string };
type SaveState = "idle" | "saving" | "saved" | "error";

const draftStorageKey = "paperless-invites-active-draft";
const maxImageBytes = 5 * 1024 * 1024;
const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export function InvitationDesigner() {
  const [config, setConfig] = useState<InvitationConfig>(() => createInitialInvitation());
  const [addType, setAddType] = useState<SectionType>("special-message");
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
  const [draft, setDraft] = useState<DraftIdentity | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [notice, setNotice] = useState("");
  const [lastSaved, setLastSaved] = useState("");
  const [replayKey, setReplayKey] = useState(0);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const objectUrls = useRef<string[]>([]);
  const price = useMemo(() => calculateInvitationPrice(config), [config]);
  const palette = getPalette(config.palette);

  useEffect(() => {
    const saved = window.localStorage.getItem(draftStorageKey);
    if (!saved) return;
    try {
      const identity = JSON.parse(saved) as DraftIdentity;
      if (!identity.id || !identity.editToken) return;
      setDraft(identity);
      fetch(`/api/invitations?id=${encodeURIComponent(identity.id)}&token=${encodeURIComponent(identity.editToken)}`)
        .then(async (response) => {
          if (!response.ok) throw new Error("Draft unavailable");
          return response.json() as Promise<{ invitation: { config: InvitationConfig; updated_at?: string } }>;
        })
        .then(({ invitation }) => {
          if (invitation.config?.version === 1) setConfig(invitation.config);
          if (invitation.updated_at) setLastSaved(formatSavedTime(invitation.updated_at));
          setNotice("Your last saved draft has been restored.");
        })
        .catch(() => {
          setNotice("Your saved draft could not be restored, so a fresh design is ready for you.");
        });
    } catch {
      window.localStorage.removeItem(draftStorageKey);
    }
  }, []);

  useEffect(() => () => objectUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function updateConfig(updater: (current: InvitationConfig) => InvitationConfig) {
    setConfig((current) => updater(current));
    if (saveState === "saved") setSaveState("idle");
  }

  function choosePalette(id: PaletteId) {
    updateConfig((current) => ({ ...current, palette: id }));
  }

  function chooseOpening(type: OpeningType) {
    const defaultAsset = type === "curtain" ? openingAssets.curtain[0].id : openingAssets.envelope[0].id;
    updateConfig((current) => ({ ...current, opening: { ...current.opening, type, asset: defaultAsset } }));
    setReplayKey((key) => key + 1);
  }

  function chooseHero(type: HeroType) {
    updateConfig((current) => ({ ...current, hero: { ...current.hero, type } }));
  }

  function chooseHeroPreset(index: 0 | 1) {
    setPendingFiles((current) => {
      const next = { ...current };
      delete next.hero;
      return next;
    });
    updateConfig((current) => ({ ...current, hero: { ...current.hero, photoSource: "preset", presetIndex: index } }));
  }

  function updateHero(field: keyof InvitationConfig["hero"], value: string | number) {
    updateConfig((current) => ({ ...current, hero: { ...current.hero, [field]: value } } as InvitationConfig));
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

  function addSection(type = addType) {
    const section = createSection(type, false);
    updateConfig((current) => ({ ...current, sections: [...current.sections, section] }));
    setNotice(`${sectionDefinitions[type].name} added. Its example text is ready to edit.`);
    window.setTimeout(() => document.getElementById(`editor-${section.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  }

  function duplicateSection(section: InvitationSection) {
    const copy = { ...section, id: createSection(section.type).id, included: false, fields: { ...section.fields }, images: section.images.filter((url) => !url.startsWith("blob:")) };
    updateConfig((current) => {
      const index = current.sections.findIndex((item) => item.id === section.id);
      const sections = [...current.sections];
      sections.splice(index + 1, 0, copy);
      return { ...current, sections };
    });
    setNotice(`Another ${sectionDefinitions[section.type].shortName} part was added.`);
  }

  function removeSection(id: string) {
    const section = config.sections.find((item) => item.id === id);
    if (!section || section.included) return;
    updateConfig((current) => ({ ...current, sections: current.sections.filter((item) => item.id !== id) }));
    setPendingFiles((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.includes(id))));
    setNotice(`${sectionDefinitions[section.type].shortName} removed.`);
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
  }

  function validateFiles(files: File[]) {
    const invalidType = files.find((file) => !acceptedImageTypes.has(file.type));
    if (invalidType) return "Please choose JPG, PNG or WebP photos.";
    const tooLarge = files.find((file) => file.size > maxImageBytes);
    if (tooLarge) return "Each photo must be 5 MB or smaller.";
    return "";
  }

  function selectHeroPhoto(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    const error = validateFiles([file]);
    if (error) return setNotice(error);
    const url = URL.createObjectURL(file);
    objectUrls.current.push(url);
    setPendingFiles((current) => ({ ...current, hero: [file] }));
    updateConfig((current) => ({ ...current, hero: { ...current.hero, photoSource: "upload", uploadedUrl: url } }));
    setNotice("Your photo is now shown in the preview. Save the design when you are ready.");
  }

  function selectGlimpsePhotos(sectionId: string, list: FileList | null) {
    const currentCount = config.sections.find((section) => section.id === sectionId)?.images.length ?? 0;
    const files = Array.from(list ?? []).slice(0, Math.max(0, 8 - currentCount));
    if (!files.length) return;
    const error = validateFiles(files);
    if (error) return setNotice(error);
    const urls = files.map((file) => URL.createObjectURL(file));
    objectUrls.current.push(...urls);
    const slot = `section:${sectionId}:images`;
    setPendingFiles((current) => ({ ...current, [slot]: [...(current[slot] ?? []), ...files] }));
    updateSection(sectionId, (section) => ({ ...section, images: [...section.images, ...urls].slice(0, 8) }));
    setNotice(`${files.length} photo${files.length === 1 ? "" : "s"} added to the live preview.`);
  }

  async function saveDesign(event: React.FormEvent) {
    event.preventDefault();
    if (saveState === "saving") return;
    setSaveState("saving");
    setNotice("Saving your design and photos…");

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
      const savedAt = formatSavedTime(new Date().toISOString());
      setLastSaved(savedAt);
      setNotice("Your invitation design is safely saved as a draft.");
    } catch (error) {
      setSaveState("error");
      setNotice(error instanceof Error ? error.message : "Your design could not be saved. Please try again.");
    }
  }

  return (
    <main className={`designer-page designer-mobile-${mobileView}`} style={{ "--builder-accent": palette.theme.primary, "--builder-soft": palette.theme.background } as React.CSSProperties}>
      <header className="designer-header">
        <a href="/" className="designer-back"><ArrowLeft aria-hidden="true" /> Back to Paperless Invites</a>
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
        <button type="button" className={mobileView === "preview" ? "is-active" : ""} onClick={() => setMobileView("preview")}>View preview</button>
      </div>

      <div className="designer-workspace">
        <form className="designer-form" onSubmit={saveDesign}>
          <div className="designer-welcome">
            <Sparkles aria-hidden="true" />
            <div><strong>Start with the choices below.</strong><p>There is no wrong choice. The phone preview changes immediately, and example words are already filled in for you.</p></div>
          </div>

          <section className="designer-step-card" id="designer-colours">
            <StepHeading number="1" icon={<Palette />} title="Choose your colours" description="Pick the colour style you would like for the full invitation." />
            <div className="designer-palette-grid">
              {paletteOptions.map((option) => (
                <button type="button" key={option.id} className={`designer-palette-option ${config.palette === option.id ? "is-selected" : ""}`} onClick={() => choosePalette(option.id)} aria-pressed={config.palette === option.id}>
                  <span className="designer-palette-colours">{option.colors.map((color) => <i key={color} style={{ background: color }} />)}</span>
                  <span><strong>{option.name}</strong><small>{option.description}</small></span>
                  {config.palette === option.id && <Check aria-hidden="true" />}
                </button>
              ))}
            </div>
          </section>

          <section className="designer-step-card" id="designer-opening">
            <StepHeading number="2" icon={<Sparkles />} title="Choose how it opens" description="You can replay the opening as many times as you like." />
            <div className="designer-choice-grid designer-opening-options">
              {openingOptions.map((option) => (
                <ChoiceButton key={option.id} selected={config.opening.type === option.id} title={option.name} description={option.description} price={option.price} onClick={() => chooseOpening(option.id)} />
              ))}
            </div>

            {config.opening.type !== "none" && (
              <div className="designer-conditional-panel">
                <div className="designer-subheading"><strong>Choose the {config.opening.type === "envelope" ? "envelope" : "curtain"} style</strong><span>The selected colours are applied to every style.</span></div>
                <div className="designer-image-options designer-opening-images">
                  {(config.opening.type === "envelope" ? openingAssets.envelope : openingAssets.curtain).map((asset) => (
                    <button type="button" key={asset.id} className={config.opening.asset === asset.id ? "is-selected" : ""} onClick={() => { updateConfig((current) => ({ ...current, opening: { ...current.opening, asset: asset.id } })); setReplayKey((key) => key + 1); }}>
                      <span className="designer-opening-thumb" style={{ "--thumb-tint": palette.theme.primary } as React.CSSProperties}><img src={asset.url} alt="" /></span>
                      <strong>{asset.name}</strong>
                      {config.opening.asset === asset.id && <Check aria-hidden="true" />}
                    </button>
                  ))}
                </div>
                {config.opening.type === "envelope" && <TextField label="Initials on the wax seal" hint="For example: S ♥ S" value={config.opening.initials} maxLength={12} onChange={(value) => updateConfig((current) => ({ ...current, opening: { ...current.opening, initials: value } }))} />}
                <button className="designer-replay-button" type="button" onClick={() => { setReplayKey((key) => key + 1); setMobileView("preview"); }}><RotateCcw aria-hidden="true" /> Preview this opening again</button>
              </div>
            )}
          </section>

          <section className="designer-step-card" id="designer-hero">
            <StepHeading number="3" icon={<ImageIcon />} title="Choose the main photo area" description="This is the first part your guests will see after the opening." />
            <div className="designer-choice-grid">
              <ChoiceButton selected={config.hero.type === "basic"} title="Basic hero" description="Your chosen photo appears in the background." price={0} onClick={() => chooseHero("basic")} />
              <ChoiceButton selected={config.hero.type === "interactive"} title="Interactive hero" description="Guests scratch the photo to reveal it." price={100} onClick={() => chooseHero("interactive")} featured />
            </div>

            <div className="designer-fields-grid">
              <TextField label="First name" value={config.hero.firstName} onChange={(value) => updateHero("firstName", value)} />
              <TextField label="Second name" value={config.hero.secondName} onChange={(value) => updateHero("secondName", value)} />
              <TextField label="Small text above the names" value={config.hero.eyebrow} onChange={(value) => updateHero("eyebrow", value)} full />
              <TextArea label="Invitation message" value={config.hero.message} onChange={(value) => updateHero("message", value)} full rows={2} />
            </div>

            <div className="designer-photo-picker">
              <div className="designer-subheading"><strong>Choose a photo</strong><span>Use one of our {palette.name} photos or upload your own.</span></div>
              <div className="designer-image-options designer-hero-images">
                {heroPresets[config.palette].map((asset, index) => (
                  <button type="button" key={asset.url} className={config.hero.photoSource === "preset" && config.hero.presetIndex === index ? "is-selected" : ""} onClick={() => chooseHeroPreset(index as 0 | 1)}>
                    <img src={asset.url} alt={`${asset.name} preset`} />
                    <strong>{asset.name}</strong>
                    {config.hero.photoSource === "preset" && config.hero.presetIndex === index && <Check aria-hidden="true" />}
                  </button>
                ))}
                <label className={`designer-upload-option ${config.hero.photoSource === "upload" ? "is-selected" : ""}`}>
                  {config.hero.photoSource === "upload" && config.hero.uploadedUrl ? <img src={config.hero.uploadedUrl} alt="Your uploaded hero preview" /> : <span><Upload aria-hidden="true" /><strong>Upload your photo</strong><small>JPG, PNG or WebP · max 5 MB</small></span>}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectHeroPhoto(event.target.files)} />
                  {config.hero.photoSource === "upload" && <Check aria-hidden="true" />}
                </label>
              </div>
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
                  onField={(field, value) => updateSectionField(section.id, field, value)}
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
              <label>
                <span>Choose a part</span>
                <select value={addType} onChange={(event) => setAddType(event.target.value as SectionType)}>
                  {(Object.entries(sectionDefinitions) as Array<[SectionType, (typeof sectionDefinitions)[SectionType]]>).map(([type, definition]) => <option value={type} key={type}>{definition.name} (+ Rs {definition.price})</option>)}
                </select>
                <ChevronDown aria-hidden="true" />
              </label>
              <button type="button" onClick={() => addSection()}><Plus aria-hidden="true" /> Add this part · Rs {sectionDefinitions[addType].price}</button>
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
            <p>The price is saved with your choices. You will still review the finished invitation before payment.</p>
          </section>

          <div className={`designer-save-bar is-${saveState}`}>
            <div>
              <LockKeyhole aria-hidden="true" />
              <span><strong>{saveState === "saved" ? "Draft saved" : "Ready when you are"}</strong><small>{lastSaved ? `Last saved ${lastSaved}` : "Your design and uploaded photos will be saved privately."}</small></span>
            </div>
            <button type="submit" disabled={saveState === "saving"}><Save aria-hidden="true" />{saveState === "saving" ? "Saving…" : draft ? "Save changes" : "Save my design"}</button>
          </div>
          {notice && <div className={`designer-notice ${saveState === "error" ? "is-error" : ""}`} role="status"><Info aria-hidden="true" />{notice}</div>}
        </form>

        <InvitationPhonePreview config={config} replayKey={replayKey} onReplay={() => setReplayKey((key) => key + 1)} />
      </div>
    </main>
  );
}

function StepHeading({ number, icon, title, description }: { number: string; icon: React.ReactNode; title: string; description: string }) {
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

type SectionEditorProps = {
  section: InvitationSection;
  index: number;
  total: number;
  onField: (field: string, value: string) => void;
  onTitle: (value: string) => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  onPhotos: (files: FileList | null) => void;
};

function SectionEditor({ section, index, total, onField, onTitle, onMove, onDuplicate, onRemove, onPhotos }: SectionEditorProps) {
  const definition = sectionDefinitions[section.type];
  const [isOpen, setIsOpen] = useState(section.type === "event-details" || (!section.included && index === total - 1));
  return (
    <details className="designer-section-editor" id={`editor-${section.id}`} open={isOpen} onToggle={(event) => setIsOpen(event.currentTarget.open)}>
      <summary>
        <span className="designer-section-order">{String(index + 1).padStart(2, "0")}</span>
        <span><strong>{definition.name}</strong><small>{definition.description}</small></span>
        <b className={section.included ? "is-included" : ""}>{section.included ? "Included" : `+ Rs ${definition.price}`}</b>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div className="designer-section-body">
        <TextField label="Section heading" value={section.title} onChange={onTitle} full />
        <SectionFields section={section} onField={onField} onPhotos={onPhotos} />
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

function SectionFields({ section, onField, onPhotos }: { section: InvitationSection; onField: (field: string, value: string) => void; onPhotos: (files: FileList | null) => void }) {
  switch (section.type) {
    case "countdown":
      return <TextArea label="Text below the countdown" value={section.fields.message} onChange={(value) => onField("message", value)} full rows={3} />;
    case "journey":
      return <div className="designer-fields-grid designer-journey-fields">{[1, 2].map((number) => <div className="designer-mini-event" key={number}><span>Moment {number}</span><TextField label="Title" value={section.fields[`event${number}Title`]} onChange={(value) => onField(`event${number}Title`, value)} /><TextField label="Date or short label" value={section.fields[`event${number}Date`]} onChange={(value) => onField(`event${number}Date`, value)} /><TextArea label="Short description" value={section.fields[`event${number}Text`]} onChange={(value) => onField(`event${number}Text`, value)} rows={2} /></div>)}</div>;
    case "event-details":
      return (
        <div className="designer-fields-grid">
          <TextField label="Event date" type="date" value={section.fields.date} onChange={(value) => onField("date", value)} />
          <TextField label="Start time" type="time" value={section.fields.time} onChange={(value) => onField("time", value)} />
          <TextField label="Venue name" value={section.fields.venue} onChange={(value) => onField("venue", value)} />
          <TextField label="Town or full address" value={section.fields.address} onChange={(value) => onField("address", value)} />
          <TextField label="Google Maps link (optional)" type="url" hint="If left empty, we create a map search from the venue and address." value={section.fields.mapUrl} onChange={(value) => onField("mapUrl", value)} full icon={<MapPin />} />
        </div>
      );
    case "gift":
    case "custom":
      return <TextArea label={section.type === "gift" ? "Gift message" : "Describe the custom part"} value={section.fields.message} onChange={(value) => onField("message", value)} full rows={4} />;
    case "special-message":
      return <div className="designer-fields-grid"><TextField label="Who is this message for?" hint="For example: Our grandparents, our parents or our family" value={section.fields.recipient} onChange={(value) => onField("recipient", value)} full /><TextArea label="Your message" value={section.fields.message} onChange={(value) => onField("message", value)} full rows={4} /></div>;
    case "seating":
      return <TextArea label="Tables and families" hint="Write one table on each line. Example: Table 1 — Family A" value={section.fields.tables} onChange={(value) => onField("tables", value)} full rows={6} />;
    case "day-programme":
      return <TextArea label="Programme items" hint="Write one item per line in this format: 18:00 | Guest arrival" value={section.fields.items} onChange={(value) => onField("items", value)} full rows={6} />;
    case "glimpse":
      return (
        <div className="designer-fields-grid">
          <TextArea label="Gallery introduction" value={section.fields.message} onChange={(value) => onField("message", value)} full rows={2} />
          <label className="designer-inline-upload">
            <Upload aria-hidden="true" /><span><strong>Add photos</strong><small>Choose up to 8 JPG, PNG or WebP photos. Each photo can be up to 5 MB.</small></span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => onPhotos(event.target.files)} />
          </label>
          {section.images.length > 0 && <div className="designer-uploaded-strip">{section.images.map((image, index) => <img src={image} alt={`Glimpse preview ${index + 1}`} key={`${image}-${index}`} />)}</div>}
        </div>
      );
  }
}

function TextField({ label, hint, value, onChange, full = false, type = "text", maxLength, icon }: { label: string; hint?: string; value: string; onChange: (value: string) => void; full?: boolean; type?: string; maxLength?: number; icon?: React.ReactNode }) {
  return <label className={`designer-field ${full ? "is-full" : ""}`}><span>{icon}{label}</span><input type={type} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
}

function TextArea({ label, hint, value, onChange, full = false, rows = 3 }: { label: string; hint?: string; value: string; onChange: (value: string) => void; full?: boolean; rows?: number }) {
  return <label className={`designer-field ${full ? "is-full" : ""}`}><span>{label}</span><textarea value={value} rows={rows} onChange={(event) => onChange(event.target.value)} />{hint && <small>{hint}</small>}</label>;
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

function formatSavedTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
}
