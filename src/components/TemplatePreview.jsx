import React, { useMemo } from 'react';

const TemplatePreview = ({ template }) => {
  const { lines, viewBox, doors, windows } = useMemo(() => {
    const floors = template.floors || [{ walls: template.walls || [] }];
    const wallData = floors[0]?.walls || [];
    const sw = template.siteWidth;
    const sd = template.siteDepth;
    const pad = 30;

    const wallLines = wallData.map((w) => ({
      x1: w.start.x, y1: w.start.y,
      x2: w.end.x, y2: w.end.y,
    }));

    const doorList = [];
    const windowList = [];
    wallData.forEach((w) => {
      const dx = w.end.x - w.start.x;
      const dy = w.end.y - w.start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 1) return;
      (w.openings || []).forEach((op) => {
        const ratio = Math.max(0, Math.min(1, op.dist / len));
        const cx = w.start.x + dx * ratio;
        const cy = w.start.y + dy * ratio;
        if (op.type === 'door') doorList.push({ cx, cy });
        else windowList.push({ cx, cy });
      });
    });

    return {
      lines: wallLines,
      doors: doorList,
      windows: windowList,
      viewBox: `${-pad} ${-pad} ${sw + pad * 2} ${sd + pad * 2}`,
    };
  }, [template]);

  return (
    <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      {/* Site boundary */}
      <rect x="0" y="0" width={template.siteWidth} height={template.siteDepth}
        fill="none" stroke="var(--hp-dim, #2c2c31)" strokeWidth="1.5" strokeDasharray="8 4" />

      {/* Walls */}
      {lines.map((l, i) => (
        <line key={`w-${i}`}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="var(--hp-muted, #54545b)" strokeWidth="4" strokeLinecap="round" />
      ))}

      {/* Doors */}
      {doors.map((d, i) => (
        <circle key={`d-${i}`} cx={d.cx} cy={d.cy} r="6"
          fill="none" stroke="var(--hp-accent, #818cf8)" strokeWidth="1.2" opacity="0.5" />
      ))}

      {/* Windows */}
      {windows.map((w, i) => (
        <rect key={`win-${i}`} x={w.cx - 5} y={w.cy - 5} width="10" height="10"
          fill="none" stroke="var(--hp-muted, #54545b)" strokeWidth="0.8" rx="1" />
      ))}
    </svg>
  );
};

export default TemplatePreview;
