import sanitizeHtml from "sanitize-html";
import type { InvitationConfig, InvitationSection } from "@/lib/invitation-designer";

export const customSectionHtmlField = "html";
export const customSectionCssField = "css";
export const maxCustomSectionHtmlLength = 100_000;
export const maxCustomSectionCssLength = 100_000;

const safeCustomSectionTags = [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "b",
  "blockquote",
  "br",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "del",
  "details",
  "div",
  "dl",
  "dt",
  "em",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "i",
  "img",
  "ins",
  "kbd",
  "li",
  "main",
  "mark",
  "nav",
  "ol",
  "p",
  "picture",
  "pre",
  "q",
  "s",
  "samp",
  "section",
  "small",
  "source",
  "span",
  "strong",
  "sub",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "u",
  "ul",
  "var",
];

export type CustomSectionSource = {
  html: string;
  css: string;
};

export function getCustomSectionSource(section: InvitationSection): CustomSectionSource {
  return {
    html: section.type === "custom" ? section.fields[customSectionHtmlField] ?? "" : "",
    css: section.type === "custom" ? section.fields[customSectionCssField] ?? "" : "",
  };
}

export function hasCustomSectionSource(config: InvitationConfig) {
  return config.sections.some((section) => {
    const source = getCustomSectionSource(section);
    return Boolean(source.html.trim() || source.css.trim());
  });
}

/**
 * Custom HTML is treated as public, untrusted content even though only an admin
 * can edit it. Keep this allowlist deliberately smaller than full HTML.
 */
export function sanitizeCustomSectionHtml(value = "") {
  return sanitizeHtml(value, {
    allowedTags: safeCustomSectionTags,
    allowedAttributes: {
      "*": ["class", "id", "title", "role", "aria-*", "data-*"],
      a: ["href", "name", "rel", "target"],
      col: ["span"],
      img: ["src", "srcset", "sizes", "alt", "width", "height", "loading", "decoding"],
      source: ["src", "srcset", "sizes", "media", "type"],
      td: ["colspan", "rowspan", "headers"],
      th: ["colspan", "rowspan", "headers", "scope"],
      time: ["datetime"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: {
      img: ["http", "https", "data"],
      source: ["http", "https", "data"],
    },
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: false,
    nestingLimit: 40,
    nonTextTags: ["script", "style", "textarea", "option", "noscript"],
    parseStyleAttributes: false,
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: "a",
        attribs: {
          ...attributes,
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
    },
  });
}

/** Prevent CSS from ending the renderer's style element. The iframe CSP blocks
 * imports and script execution; keeping the CSS otherwise intact preserves
 * responsive rules such as @media queries. */
export function sanitizeCustomSectionCss(value = "") {
  return value
    .replace(/<\s*\/?\s*(?:style|script|iframe|object|embed)\b[^>]*>/giu, "")
    .replace(/expression\s*\(/giu, "")
    .replace(/javascript\s*:/giu, "");
}

export function sanitizeInvitationCustomSections(config: InvitationConfig): InvitationConfig {
  return {
    ...config,
    sections: config.sections.map((section) => {
      if (section.type !== "custom") return section;
      const source = getCustomSectionSource(section);
      return {
        ...section,
        fields: {
          ...section.fields,
          [customSectionHtmlField]: sanitizeCustomSectionHtml(source.html),
          [customSectionCssField]: sanitizeCustomSectionCss(source.css),
        },
      };
    }),
  };
}
