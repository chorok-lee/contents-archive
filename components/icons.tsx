import type { SVGProps } from "react";

function Icon({ children, size = 22, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

export const ChevronLeft = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}><path d="M15 18l-6-6 6-6" /></Icon>
);
export const ChevronDown = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}><path d="M6 9l6 6 6-6" /></Icon>
);
export const Check = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>
);
export const Plus = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>
);
export const Close = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>
);
export const Trash = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M4 7h16M9 7V4.5h6V7M6.5 7l1 13h9l1-13" />
  </Icon>
);
export const LinkIcon = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </Icon>
);
export const ArrowUpRight = (p: SVGProps<SVGSVGElement> & { size?: number }) => (
  <Icon {...p}><path d="M7 17L17 7M8 7h9v9" /></Icon>
);
