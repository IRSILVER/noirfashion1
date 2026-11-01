import { Fragment } from "react";

/**
 * Renders the simple text format used by the editable pages:
 *   ## Heading   ### Question (FAQ)   - list item   **bold**   blank line = new paragraph
 * Placeholders like [IN TE VULLEN: ...] are highlighted so they are never mistaken for real info.
 */
export function RichText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n{2,}/);
  return (
    <div className="space-y-6 text-[0.98rem] leading-[1.85] text-brown">
      {blocks.map((block, i) => {
        const lines = block.split("\n");
        const out: React.ReactNode[] = [];
        let list: string[] = [];
        const flush = () => {
          if (list.length) {
            out.push(<ul key={`l${out.length}`} className="list-none space-y-2 pl-0">{list.map((li, j) => (
              <li key={j} className="relative pl-6 before:absolute before:left-0 before:top-[0.85em] before:h-px before:w-3 before:bg-champagne">{inline(li)}</li>
            ))}</ul>);
            list = [];
          }
        };
        lines.forEach((line, j) => {
          const t = line.trim();
          if (t.startsWith("- ")) { list.push(t.slice(2)); return; }
          flush();
          if (t.startsWith("### ")) {
            out.push(<h3 key={j} className="pt-2 font-serif text-xl text-espresso">{inline(t.slice(4))}</h3>);
          } else if (t.startsWith("## ")) {
            out.push(<h2 key={j} className="heading-display pt-6 text-3xl text-espresso">{inline(t.slice(3))}</h2>);
          } else if (t) {
            out.push(<p key={j}>{inline(t)}</p>);
          }
        });
        flush();
        return <Fragment key={i}>{out}</Fragment>;
      })}
    </div>
  );
}

export function inline(s: string): React.ReactNode[] {
  return s.split(/(\[IN TE VULLEN[^\]]*\]|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith("[IN TE VULLEN")) return <mark key={i} className="placeholder-tag">{part}</mark>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i} className="font-medium text-espresso">{part.slice(2, -2)}</strong>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}
