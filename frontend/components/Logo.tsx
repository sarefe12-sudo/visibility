interface LogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}

export default function Logo({ size = "md", showTagline = false }: LogoProps) {
  const fontSize = size === "sm" ? "text-lg" : size === "lg" ? "text-5xl" : "text-3xl";
  const trackingClass = size === "sm" ? "-tracking-[0.5px]" : "-tracking-[1.5px]";
  const taglineSize = "text-[10px] tracking-[3px] mt-1";

  return (
    <div className="flex flex-col items-start">
      <span className={`font-extrabold ${fontSize} ${trackingClass} leading-none`}>
        <span style={{ color: "#0f172a" }}>Visibility</span>
        <span style={{ color: "#6366f1" }}>Radar</span>
      </span>
      {showTagline && (
        <span className={`${taglineSize} font-semibold text-slate-400 uppercase`}>
          AI Brand Intelligence
        </span>
      )}
    </div>
  );
}
