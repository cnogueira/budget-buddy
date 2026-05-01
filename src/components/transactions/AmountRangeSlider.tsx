"use client";

interface AmountRangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
}

export function AmountRangeSlider({ min, max, value, onChange }: AmountRangeSliderProps) {
  const [low, high] = value;
  const span = max - min || 1;

  const leftPct = ((low - min) / span) * 100;
  const rightPct = ((high - min) / span) * 100;

  function handleLow(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Math.min(Number(e.target.value), high);
    onChange([v, high]);
  }

  function handleHigh(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Math.max(Number(e.target.value), low);
    onChange([low, v]);
  }

  return (
    <div className="flex flex-col gap-1 min-w-48">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Amount</span>
      <div className="relative h-5 flex items-center">
        {/* Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
        {/* Active track */}
        <div
          className="absolute h-1.5 rounded-full bg-blue-500"
          style={{ left: `${leftPct}%`, right: `${100 - rightPct}%` }}
        />
        {/* Low thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={(max - min) / 100 || 1}
          value={low}
          onChange={handleLow}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow"
        />
        {/* High thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={(max - min) / 100 || 1}
          value={high}
          onChange={handleHigh}
          className="absolute inset-0 w-full appearance-none bg-transparent cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow"
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-400">
        <span>{low.toFixed(0)}</span>
        <span>{high.toFixed(0)}</span>
      </div>
    </div>
  );
}
