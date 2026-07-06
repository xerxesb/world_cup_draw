import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info } from "lucide-react";

interface InfoTooltipProps {
  label: string;
  text: string;
  width?: number;
}

const DEFAULT_BUBBLE_WIDTH = 240;
const VIEWPORT_MARGIN = 10;
const LINE_HEIGHT_PX = 17;
const BUBBLE_PADDING_PX = 20;
const CHARS_PER_LINE_PER_PX_WIDTH = 0.16;

export function InfoTooltip({ label, text, width = DEFAULT_BUBBLE_WIDTH }: InfoTooltipProps) {
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function show() {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }

    const left = Math.min(
      Math.max(rect.left, VIEWPORT_MARGIN),
      window.innerWidth - width - VIEWPORT_MARGIN,
    );
    const estimatedHeight = estimateBubbleHeight(text, width);
    const fitsBelow = rect.bottom + estimatedHeight + VIEWPORT_MARGIN <= window.innerHeight;
    const top = fitsBelow ? rect.bottom + 6 : Math.max(VIEWPORT_MARGIN, rect.top - estimatedHeight - 6);

    setPosition({ top, left });
  }

  function hide() {
    setPosition(null);
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="infoTrigger"
        aria-label={label}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <Info aria-hidden="true" size={13} />
      </button>
      {position &&
        createPortal(
          <div
            className="infoBubble"
            role="tooltip"
            style={{ top: position.top, left: position.left, width }}
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  );
}

function estimateBubbleHeight(text: string, width: number): number {
  const charsPerLine = Math.max(1, Math.floor(width * CHARS_PER_LINE_PER_PX_WIDTH));
  const lineCount = text
    .split("\n")
    .reduce((total, paragraph) => total + Math.max(1, Math.ceil(paragraph.length / charsPerLine)), 0);

  return lineCount * LINE_HEIGHT_PX + BUBBLE_PADDING_PX;
}
