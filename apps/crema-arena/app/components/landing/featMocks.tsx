import Image from "next/image";
import { Camera, Monitor, Smartphone } from "lucide-react";
import { cn } from "@crivelo/ui/lib/utils";

// Illustrative in-card mocks for the Feat deep-dive zig cards. All decorative —
// each is wrapped aria-hidden by the consumer. Static (no live data); RMP-204 may
// animate them.

// Mini bracket: two seats feed a champion (used in Chave → Chaveamento).
export function BracketMock() {
  return (
    <div className="mt-4 grid grid-cols-[1fr_30px_40px] items-center gap-0 overflow-hidden rounded-sm border border-crema-50/10 bg-espresso-900 p-3.5">
      <div className="grid gap-[9px]">
        <Seat name="Ana" win />
        <Seat name="Bruno" />
        <Seat name="Caio" />
        <Seat name="Duda" win />
      </div>
      <div className="relative self-stretch">
        <svg
          viewBox="0 0 30 100"
          preserveAspectRatio="none"
          fill="none"
          className="absolute inset-0 size-full stroke-espresso-500 [stroke-width:1.5]"
        >
          <path d="M0 13 H15 V37 H0" />
          <path d="M15 25 H21" />
          <path d="M0 63 H15 V87 H0" />
          <path d="M15 75 H21" />
          <path d="M21 25 V75" />
          <path d="M21 50 H30" className="stroke-cinnamon-500" />
        </svg>
      </div>
      <div className="flex size-9 items-center justify-center justify-self-center rounded-full bg-marigold-500 text-espresso-900">
        <Image src="/assets/trophy.svg" alt="" width={20} height={20} className="size-5" />
      </div>
    </div>
  );
}

function Seat({ name, win = false }: { name: string; win?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-espresso-800 px-[9px] py-1.5 font-display text-xs font-semibold",
        win ? "border-cinnamon-500 text-crema-50" : "border-crema-50/10 text-crema-200",
      )}
    >
      <span className={cn("size-[15px] shrink-0 rounded-full", win ? "bg-cinnamon-500" : "bg-espresso-700")} />
      {name}
    </span>
  );
}

// Organizer capture: vote / walkover (used in Console → Captura).
export function CaptureMock() {
  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-crema-50/10 bg-espresso-900 px-4 py-3.5">
      <div className="mb-3 flex items-center justify-between gap-2.5">
        <b className="whitespace-nowrap font-display text-sm font-bold text-crema-50">Encerrar duelo</b>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-crema-400">Console</span>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        <CaptureSide who="Lucas" win />
        <CaptureSide who="Marina" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <span className="inline-flex items-center gap-[6px] rounded-full border border-crema-50/[0.18] px-[11px] py-[5px] font-mono text-[10px] uppercase tracking-[0.1em] text-crema-200">
          Walkover
        </span>
        <span className="font-mono text-[11px] text-crema-400">registra cada voto</span>
      </div>
    </div>
  );
}

function CaptureSide({ who, win = false }: { who: string; win?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-[10px] border-[1.5px] px-2.5 py-3 text-center",
        win ? "border-cinnamon-500 bg-cinnamon-500/[18%]" : "border-crema-50/[0.16]",
      )}
    >
      <span className={cn("font-display text-[15px] font-bold", win ? "text-cinnamon-300" : "text-crema-100")}>
        {who}
      </span>
      <span className={cn("mt-1 block font-mono text-[10px] tracking-[0.04em]", win ? "text-cinnamon-300" : "text-crema-400")}>
        + voto do júri
      </span>
    </div>
  );
}

// Table-of-cups photo (used in Console → Fotos).
export function PhotoMock() {
  return (
    <div className="mt-4 flex items-center justify-center gap-[18px] overflow-hidden rounded-sm border border-crema-50/10 bg-espresso-900 p-4">
      <div className="relative flex h-[92px] w-[156px] items-center justify-center gap-[18px] rounded-[10px] border border-crema-50/12 bg-espresso-800">
        <span className="absolute left-[9px] top-2 inline-flex items-center gap-[5px] font-mono text-[8.5px] uppercase tracking-[0.1em] text-crema-400">
          <Camera className="size-3" />
          mesa
        </span>
        <Cup />
        <Cup />
      </div>
      <div className="flex flex-col items-center gap-[5px] text-center font-mono text-[9.5px] uppercase leading-[1.4] tracking-[0.1em] text-crema-400">
        <span className="flex gap-[7px] text-cinnamon-300">
          <Monitor className="size-[19px]" />
          <Smartphone className="size-[19px]" />
        </span>
        na telona
        <br />+ companion
      </div>
    </div>
  );
}

function Cup() {
  return (
    <span className="relative size-[38px] rounded-full border-2 border-crema-200 bg-espresso-700 after:absolute after:inset-[7px] after:rounded-full after:border-[1.5px] after:border-cinnamon-300 after:content-['']" />
  );
}

// Mini telona (live, no number) — used in Telona → Ao vivo.
export function MiniTelonaMock() {
  return (
    <div className="mt-4 overflow-hidden rounded-sm border border-crema-50/10 bg-espresso-900 px-4 pt-3.5 pb-4">
      <div className="mb-3.5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-live">
          <span className="size-[7px] rounded-full bg-live" />
          Ao vivo
        </span>
        <span className="font-mono text-[13px] tabular-nums text-crema-200">00:27</span>
      </div>
      <div className="flex items-center justify-center gap-4">
        <TelonaAvatar initial="L" name="Lucas" />
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex gap-[5px]">
            <span className="size-[13px] rounded-full border-[1.5px] border-cinnamon-300 bg-cinnamon-300" />
            <span className="size-[13px] rounded-full border-[1.5px] border-cinnamon-300 bg-cinnamon-300" />
            <span className="size-[13px] rounded-full border-[1.5px] border-espresso-500" />
          </div>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-crema-400">votando</span>
        </div>
        <TelonaAvatar initial="M" name="Marina" />
      </div>
    </div>
  );
}

function TelonaAvatar({ initial, name }: { initial: string; name: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <span className="flex size-12 items-center justify-center rounded-full border-2 border-crema-200 bg-espresso-700 font-display text-[18px] font-bold text-crema-100">
        {initial}
      </span>
      <span className="font-display text-xs font-semibold text-crema-100">{name}</span>
    </div>
  );
}

// Phone companion mock (used in Companion → No celular).
export function PhoneMock() {
  return (
    <div className="mt-4 flex justify-center px-0 pt-1.5 pb-0.5">
      <div className="relative w-[132px] rounded-[18px] border-2 border-espresso-500 bg-espresso-900 px-[11px] pt-3 pb-3.5 before:absolute before:left-1/2 before:top-[7px] before:h-1 before:w-[34px] before:-translate-x-1/2 before:rounded-[3px] before:bg-espresso-700 before:content-['']">
        <div className="my-2.5 mb-2 text-center font-mono text-[8.5px] uppercase tracking-[0.12em] text-cinnamon-300">
          Chave · ao vivo
        </div>
        <PhoneRow name="Lucas" status="passou" win />
        <PhoneRow name="Marina" status="fora" />
        <PhoneRow name="Ana" status="passou" />
        <PhoneRow name="Duda" status="próx." />
      </div>
    </div>
  );
}

function PhoneRow({ name, status, win = false }: { name: string; status: string; win?: boolean }) {
  return (
    <div
      className={cn(
        "mb-[5px] flex items-center gap-[7px] rounded-[7px] px-[7px] py-1.5",
        win ? "bg-cinnamon-500/[18%]" : "bg-espresso-800",
      )}
    >
      <span className={cn("size-[13px] shrink-0 rounded-full", win ? "bg-cinnamon-500" : "bg-espresso-600")} />
      <b className="font-display text-[11px] font-semibold text-crema-100">{name}</b>
      <span className="ml-auto font-mono text-[8px] uppercase tracking-[0.1em] text-crema-400">{status}</span>
    </div>
  );
}
