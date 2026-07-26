import { InputHTMLAttributes } from "react";

type FloatingInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export default function FloatingInput({ label, id, ...rest }: FloatingInputProps) {
  return (
    <div className="relative">
      <input
        id={id}
        placeholder=" "
        className="peer w-full rounded-xl border border-white/[0.06] bg-black/50 px-4 pt-5 pb-2.5 text-[15px] text-white outline-none transition-colors focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        {...rest}
      />
      <label
        htmlFor={id}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-zinc-400 transition-all
          peer-focus:top-3 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:font-semibold peer-focus:uppercase peer-focus:tracking-wide peer-focus:text-sky-400
          peer-[:not(:placeholder-shown)]:top-3 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-[11px] peer-[:not(:placeholder-shown)]:font-semibold peer-[:not(:placeholder-shown)]:uppercase peer-[:not(:placeholder-shown)]:tracking-wide peer-[:not(:placeholder-shown)]:text-sky-400"
      >
        {label}
      </label>
    </div>
  );
}
