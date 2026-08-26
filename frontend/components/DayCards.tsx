"use client";

import ReactMarkdown from "react-markdown";

type DaySection = {
  title: string;
  body: string;
};

function parseDaySections(text: string): DaySection[] | null {
  const dayLineRe = /^(?:#{1,3}\s+|(?:\*\*))?(Day\s+\d+[^\n]*?)(?:\*\*)?$/im;

  const parts = text.split(
    /^((?:#{1,3}\s+)?(?:\*\*)?Day\s+\d+[^\n]*?(?:\*\*)?)$/gim
  );

  const sections: DaySection[] = [];
  let i = 0;

  while (i < parts.length && !dayLineRe.test(parts[i])) i++;

  while (i < parts.length - 1) {
    const rawTitle = parts[i].trim();
    const rawBody = (parts[i + 1] ?? "").trim();

    if (dayLineRe.test(rawTitle)) {
      const cleanTitle = rawTitle
        .replace(/^#{1,3}\s+/, "")
        .replace(/^\*\*|\*\*$/g, "");
      sections.push({ title: cleanTitle, body: rawBody });
      i += 2;
    } else {
      i++;
    }
  }

  return sections.length > 0 ? sections : null;
}

const mdComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
  h1: ({ children }) => (
    <p className="font-semibold text-[var(--foreground)] mb-1">{children}</p>
  ),
  h2: ({ children }) => (
    <p className="font-semibold text-[var(--foreground)] mb-1">{children}</p>
  ),
  h3: ({ children }) => (
    <p className="font-semibold text-[var(--foreground)] mb-1">{children}</p>
  ),
  p: ({ children }) => (
    <p className="text-sm text-[var(--foreground)] leading-relaxed mb-1 last:mb-0">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="text-sm text-[var(--foreground)] space-y-1 mb-1 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="text-sm text-[var(--foreground)] space-y-1 mb-1 last:mb-0 list-decimal list-inside">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="flex items-start gap-2 leading-relaxed">
      <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-[#2196F3]" />
      <span>{children}</span>
    </li>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-[var(--foreground)]">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-gray-500">{children}</em>
  ),
  hr: () => <hr className="border-gray-200 my-2" />,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-[#2196F3] pl-3 italic text-gray-500 text-sm my-1">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="bg-white/70 rounded px-1 py-0.5 text-xs font-mono text-[#1565C0]">
      {children}
    </code>
  ),
};

export default function DayCards({ text }: { text: string }) {
  const sections = parseDaySections(text);

  if (sections) {
    return (
      <>
        {sections.map((section, idx) => (
          <div
            key={idx}
            className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm flex flex-col gap-2"
          >
            <p className="font-bold text-[#2196F3] text-sm">{section.title}</p>
            {section.body && (
              <ReactMarkdown components={mdComponents}>
                {section.body}
              </ReactMarkdown>
            )}
          </div>
        ))}
      </>
    );
  }

  return (
    <div className="rounded-2xl bg-[#f0f4f8] px-5 py-4 shadow-sm">
      <ReactMarkdown components={mdComponents}>{text}</ReactMarkdown>
    </div>
  );
}
