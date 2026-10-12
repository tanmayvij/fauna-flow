import Image from "next/image";

/**
 * Decorative; pair it with visible text that says what is loading. Coloured
 * to match the disabled button it's shown in, in both light and dark mode.
 */
export function Spinner() {
  return (
    <Image
      src="/icons/spinner.svg"
      alt=""
      width={16}
      height={16}
      className="animate-spin"
    />
  );
}
