const excludedTags = new Set(["script", "style", "svg", "path", "img", "iframe", "video", "audio", "input", "textarea", "select", "option", "hr", "br", "canvas"]);
const textTags = new Set(["div", "p", "h1", "h2", "h3", "h4", "h5", "h6", "a", "button", "span", "em", "strong", "small", "label", "li", "dt", "dd", "td", "th", "blockquote", "figcaption", "caption", "legend", "summary", "code", "pre", "b", "i", "u"]);

// Leaf text is editable regardless of its HTML tag. Never flatten a container
// containing other components (icons, images, links, or separate text blocks).
export function canEditVisualText(tag: string, childTags: string[], hasText: boolean) {
  tag = tag.toLowerCase();
  return !excludedTags.has(tag) && childTags.every((child) => child.toLowerCase() === "br") && (hasText || textTags.has(tag));
}

export function isTypingTarget(target: { isContentEditable?: boolean; tagName?: string } | null) {
  return Boolean(target && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName?.toUpperCase() || "")));
}
