interface BodyCompChartProps {
  weight: number[];
  muscle: number[];
  fat: number[];
  labels: string[];
}

export default function BodyCompChart({ weight, muscle, fat, labels }: BodyCompChartProps) {
  const height = 160;
  const width = 100;

  const norm = (data: number[]) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    return data.map((v) => height - ((v - min) / (max - min + 0.01)) * (height - 30) - 15);
  };

  const wY = norm(weight);
  const mY = norm(muscle);
  const fY = norm(fat);
  const xStep = width / (weight.length - 1);

  const toPath = (yArr: number[]) =>
    yArr.map((y, i) => `${i * xStep},${y}`).join(" ");

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        style={{ width: "100%", height: 160 }}
      >
        <polyline
          points={toPath(wY)}
          fill="none"
          stroke="#4ecdc4"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <polyline
          points={toPath(mY)}
          fill="none"
          stroke="#a29bfe"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2,2"
        />
        <polyline
          points={toPath(fY)}
          fill="none"
          stroke="#ffe66d"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="3,2"
        />
        {wY.map((y, i) => (
          <circle key={`w${i}`} cx={i * xStep} cy={y} r="1.4" fill="#4ecdc4" />
        ))}
        {mY.map((y, i) => (
          <circle key={`m${i}`} cx={i * xStep} cy={y} r="1.4" fill="#a29bfe" />
        ))}
      </svg>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 6,
          padding: "0 4px",
        }}
      >
        {labels.map((l, i) => (
          <span key={i} style={{ fontSize: 10, color: "#4a5568" }}>
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
