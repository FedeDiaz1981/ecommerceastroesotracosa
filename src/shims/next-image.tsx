import type { ImgHTMLAttributes } from "react";

type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  fill?: boolean;
  priority?: boolean;
  fetchPriority?: "high" | "low" | "auto";
};

export default function Image({ fill, priority: _priority, style, width, height, ...props }: ImageProps) {
  const fillStyle = fill
    ? {
        position: "absolute" as const,
        inset: 0,
        width: "100%",
        height: "100%",
        ...style,
      }
    : style;

  return <img width={fill ? undefined : width} height={fill ? undefined : height} style={fillStyle} {...props} />;
}
