import { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => base(<path d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" />, p);
export const BoxIcon = (p: IconProps) => base(<path d="M12 3 3 7.5 12 12l9-4.5L12 3ZM3 7.5v9L12 21l9-4.5v-9M12 12v9" />, p);
export const WarehouseIcon = (p: IconProps) => base(<path d="M3 21V9l9-5 9 5v12H3Zm5-6h8v6H8v-6Z" />, p);
export const FactoryIcon = (p: IconProps) => base(<path d="M3 21V11l6 4v-4l6 4v-4l6 4v6H3Zm3-14V5h2v2m5 0V5h2v2" />, p);
export const ChartIcon = (p: IconProps) => base(<path d="M4 19V5m4 14v-8m4 8V9m4 10V4m4 15v-6" />, p);
export const BoltIcon = (p: IconProps) => base(<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" />, p);
export const SearchIcon = (p: IconProps) => base(<path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm10 2-4.35-4.35" />, p);
export const BellIcon = (p: IconProps) => base(<path d="M15 17H4l1.4-1.4A2 2 0 0 0 6 14.2V11a6 6 0 0 1 12 0v3.2c0 .53.21 1.04.6 1.4L20 17H9m6 0v1a3 3 0 1 1-6 0v-1" />, p);
export const ChevronDownIcon = (p: IconProps) => base(<path d="m6 9 6 6 6-6" />, p);
export const ArrowDownIcon = (p: IconProps) => base(<path d="M12 5v14m0 0-6-6m6 6 6-6" />, p);
export const ArrowUpIcon = (p: IconProps) => base(<path d="M12 19V5m0 0-6 6m6-6 6 6" />, p);
export const AlertTriangleIcon = (p: IconProps) => base(<path d="m12 3 9 16H3L12 3Zm0 6v4m0 3h.01" />, p);
export const PlusIcon = (p: IconProps) => base(<path d="M12 5v14m-7-7h14" />, p);
export const TruckIcon = (p: IconProps) => base(<path d="M3 16V6h11v10M3 16h11m0 0h3l3-4h-6v4Zm-9 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Zm10 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0Z" />, p);
