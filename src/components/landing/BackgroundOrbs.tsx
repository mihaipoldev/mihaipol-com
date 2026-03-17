export default function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div
        className="absolute top-[10%] -left-[15%] w-[700px] h-[700px] rounded-full opacity-[0.2]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.5) 0%, transparent 60%)",
          filter: "blur(80px)",
          animation: "float-1 25s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[45%] -right-[15%] w-[800px] h-[800px] rounded-full opacity-[0.18]"
        style={{
          background: "radial-gradient(circle, hsl(var(--secondary) / 0.5) 0%, transparent 60%)",
          filter: "blur(80px)",
          animation: "float-2 30s ease-in-out infinite",
        }}
      />
      <div
        className="absolute bottom-[20%] -left-[10%] w-[600px] h-[600px] rounded-full opacity-[0.15]"
        style={{
          background: "radial-gradient(circle, hsl(var(--accent) / 0.5) 0%, transparent 60%)",
          filter: "blur(80px)",
          animation: "float-3 22s ease-in-out infinite",
        }}
      />
      <div
        className="absolute top-[60%] -right-[5%] w-[500px] h-[500px] rounded-full opacity-[0.12]"
        style={{
          background: "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 60%)",
          filter: "blur(80px)",
          animation: "float-2 28s ease-in-out infinite reverse",
        }}
      />
    </div>
  );
}
