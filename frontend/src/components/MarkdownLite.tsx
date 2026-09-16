import type { ReactNode } from "react";

/**
 * Renders the markdown the chat assistant tends to produce (paragraphs,
 * "#" through "###" headers, **bold**, *italic*, [text](url) links, and
 * "- " bullet lists) as real elements instead of showing raw asterisks and
 * hashes to the user. Not a general-purpose markdown parser — just enough
 * to cover what a short chat answer actually uses, since the model doesn't
 * reliably stick to plain prose no matter how the prompt asks it to.
 *
 * Processes line by line (rather than assuming a heading always sits alone
 * in its own blank-line-delimited block) since the model often runs a
 * heading straight into the paragraph or list beneath it with no blank
 * line in between.
 */
function renderInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) {
      nodes.push(<strong key={key++}>{match[1]}</strong>);
    } else if (match[2] !== undefined) {
      nodes.push(<em key={key++}>{match[2]}</em>);
    } else {
      nodes.push(
        <a
          key={key++}
          href={match[4]}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
        >
          {match[3]}
        </a>
      );
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

type Segment =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; lines: string[] };

function toSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const lines = text.trim().split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const headingMatch = line.match(/^#{1,6}\s+(.*)/);
    if (headingMatch) {
      segments.push({ type: "heading", text: headingMatch[1] });
      continue;
    }

    const listMatch = line.match(/^[-*]\s+(.*)/);
    if (listMatch) {
      const last = segments[segments.length - 1];
      if (last?.type === "list") last.items.push(listMatch[1]);
      else segments.push({ type: "list", items: [listMatch[1]] });
      continue;
    }

    const last = segments[segments.length - 1];
    if (last?.type === "paragraph") last.lines.push(line);
    else segments.push({ type: "paragraph", lines: [line] });
  }

  return segments;
}

export function MarkdownLite({ text }: { text: string }) {
  const segments = toSegments(text);

  return (
    <div className="space-y-2.5">
      {segments.map((seg, i) => {
        if (seg.type === "heading") {
          return (
            <p key={i} className="font-heading font-bold text-gray-900 dark:text-gray-50">
              {renderInline(seg.text)}
            </p>
          );
        }
        if (seg.type === "list") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {seg.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{renderInline(seg.lines.join(" "))}</p>;
      })}
    </div>
  );
}
