interface Props {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md';
}

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: Props) {
  const starSize = size === 'sm' ? 'text-base' : 'text-xl';

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${starSize} leading-none transition-colors ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${star <= value ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
