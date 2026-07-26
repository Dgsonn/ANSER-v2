type Orb = {
  className: string;
  style?: React.CSSProperties;
};

const orbs: Orb[] = [
  {
    className: "anser-orb absolute rounded-full blur-[100px] opacity-35 bg-violet-600",
    style: { width: 500, height: 500, top: -150, left: -100 },
  },
  {
    className: "anser-orb absolute rounded-full blur-[100px] opacity-35 bg-sky-500",
    style: { width: 450, height: 450, top: "40%", right: -150, animationDelay: "-4s" },
  },
  {
    className: "anser-orb absolute rounded-full blur-[100px] opacity-35 bg-emerald-500",
    style: { width: 400, height: 400, bottom: -100, left: "20%", animationDelay: "-8s" },
  },
];

export default function AmbientOrbs() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, i) => (
        <div key={i} className={orb.className} style={orb.style} />
      ))}
    </div>
  );
}
