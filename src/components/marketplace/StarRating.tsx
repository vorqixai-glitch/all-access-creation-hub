import { Star } from "lucide-react";

export function StarRating({
  value,
  onChange,
  size = 16,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
  readOnly?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        return (
          <button
            key={n}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(n)}
            className={readOnly ? "cursor-default" : "cursor-pointer hover:scale-110 transition-transform"}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
          >
            <Star
              width={size}
              height={size}
              className={filled ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}
            />
          </button>
        );
      })}
    </div>
  );
}
