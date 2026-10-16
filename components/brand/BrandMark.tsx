import Image from "next/image";

type BrandMarkProps = {
  className?: string;
  decorative?: boolean;
};

export default function BrandMark({ className = "mark", decorative = false }: BrandMarkProps) {
  return (
    <Image
      className={className}
      src="/assets/jdd-logo.webp"
      alt={decorative ? "" : "Jardin du Desert"}
      width={96}
      height={96}
      priority
    />
  );
}
