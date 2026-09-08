"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  fullscreen?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  fullscreen = false,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className={`relative glass-dark rounded-2xl shadow-2xl w-full animate-in fade-in zoom-in-95 duration-200 ${
          fullscreen ? "max-w-none h-[calc(100dvh-2rem)]" : "max-w-lg"
        }`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
            <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/8 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-white/8 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}
        <div className={fullscreen ? "h-full overflow-auto" : ""}>{children}</div>
      </div>
    </div>
  );
}
