import { initialOf } from '../../lib/colors';

interface Props {
  name: string;
  color: string;
  size?: number;
}

export default function Avatar({ name, color, size = 36 }: Props) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ backgroundColor: color, width: size, height: size, fontSize: size * 0.42 }}
      title={name}
    >
      {initialOf(name)}
    </span>
  );
}
