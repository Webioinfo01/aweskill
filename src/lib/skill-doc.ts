import { parse } from "yaml";

export interface ParsedSkillDoc {
  frontmatter: Record<string, unknown>;
  body: string;
}

export function parseSkillDoc(content: string): ParsedSkillDoc {
  // Normalize CRLF (Windows) to LF so frontmatter delimiters match regardless of the
  // line endings the SKILL.md was saved with. No-op on LF-native platforms (macOS/Linux).
  const normalized = content.replace(/\r\n/g, "\n");
  if (!normalized.startsWith("---\n")) {
    return { frontmatter: {}, body: normalized };
  }

  const endIndex = normalized.indexOf("\n---", 4);
  if (endIndex === -1) {
    return { frontmatter: {}, body: normalized };
  }

  const frontmatterText = normalized.slice(4, endIndex);
  const bodyStart = normalized.indexOf("\n", endIndex + 4);
  const body = bodyStart === -1 ? "" : normalized.slice(bodyStart + 1);
  let parsed: unknown;
  try {
    parsed = parse(frontmatterText);
  } catch {
    return { frontmatter: {}, body };
  }
  const frontmatter =
    parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};

  return { frontmatter, body };
}

export function getSkillDescription(content: string): string | undefined {
  const { frontmatter, body } = parseSkillDoc(content);
  const description = frontmatter.description;
  if (typeof description === "string" && description.trim()) {
    return description.trim();
  }

  return body
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
}
