interface ImageLightboxProps {
  src: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, onClose }: ImageLightboxProps) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative z-10 max-w-[90vw] max-h-[90vh] animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/40 hover:text-white/80 text-lg transition-colors"
        >
          ✕ 关闭
        </button>
        <img
          src={src}
          alt="预览"
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-[12px] border border-white/[0.08] shadow-glass-lg"
        />
        <div className="absolute -bottom-9 left-0">
          <a
            href={src}
            download
            className="text-xs text-white/30 hover:text-accent-gold/60 transition-colors"
          >
            ⬇ 下载原图
          </a>
        </div>
      </div>
    </div>
  );
}
