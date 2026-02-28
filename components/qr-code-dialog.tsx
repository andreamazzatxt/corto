"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import QRCodeStyling from "qr-code-styling";
import type { Options } from "qr-code-styling";
import { QrCode, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const QR_DISPLAY_SIZE = 220;

type QRStyle = "classic" | "smooth" | "circle";

const QR_STYLES: { value: QRStyle; label: string }[] = [
  { value: "classic", label: "Classic" },
  { value: "smooth",  label: "Smooth"  },
  { value: "circle",  label: "Circle"  },
];


const STYLE_MAP: Record<QRStyle, Pick<Options, "dotsOptions" | "cornersSquareOptions" | "cornersDotOptions">> = {
  classic: {
    dotsOptions:         { type: "square"        },
    cornersSquareOptions:{ type: "square"        },
    cornersDotOptions:   { type: "square"        },
  },
  smooth: {
    dotsOptions:         { type: "extra-rounded" },
    cornersSquareOptions:{ type: "extra-rounded" },
    cornersDotOptions:   { type: "dot"           },
  },
  circle: {
    dotsOptions:         { type: "dots"          },
    cornersSquareOptions:{ type: "dot"           },
    cornersDotOptions:   { type: "dot"           },
  },
};

function QRCodeContent({ url, slug }: { url: string; slug: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrRef = useRef<QRCodeStyling | null>(null);
  const defaultLogoRef = useRef<string | null>(null);

  const [showLogo, setShowLogo] = useState(true);
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [logoReady, setLogoReady] = useState(false);
  const [qrStyle, setQrStyle] = useState<QRStyle>("classic");
  const [pngSize, setPngSize] = useState(1200);

  // Load logo: apple-touch-icon PNG → canvas → PNG data URL (adds white background)
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const size = 400;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      const png = canvas.toDataURL("image/png");
      defaultLogoRef.current = png;
      setLogoSrc(png);
      setLogoReady(true);
    };
    img.onerror = () => setLogoReady(true);
    img.src = "/apple-touch-icon.png";
  }, []);

  const activeLogo = showLogo && logoSrc ? logoSrc : null;

  const buildOptions = useCallback((size: number): Options => {
    const styleMap = STYLE_MAP[qrStyle];
    return {
      width: size,
      height: size,
      type: "svg",
      data: url,
      image: activeLogo ?? undefined,
      dotsOptions:          { ...styleMap.dotsOptions,          color: "#0f0f0f" },
      backgroundOptions:    { color: "#ffffff" },
      cornersSquareOptions: { ...styleMap.cornersSquareOptions, color: "#0f0f0f" },
      cornersDotOptions:    { ...styleMap.cornersDotOptions,    color: "#0f0f0f" },
      imageOptions: {
        margin: 0,
        imageSize: activeLogo ? 0.24 : 0,
        crossOrigin: "anonymous",
      },
      qrOptions: { errorCorrectionLevel: activeLogo ? "H" : "M" },
    };
  }, [url, activeLogo, qrStyle]);

  // Init QR on mount (dialog is open at this point, so containerRef is valid)
  useEffect(() => {
    if (!containerRef.current) return;
    qrRef.current = new QRCodeStyling(buildOptions(QR_DISPLAY_SIZE));
    qrRef.current.append(containerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update QR when options change
  useEffect(() => {
    qrRef.current?.update(buildOptions(QR_DISPLAY_SIZE));
  }, [buildOptions]);

  function downloadPNG() {
    new QRCodeStyling(buildOptions(pngSize)).download({ name: `qr-${slug}`, extension: "png" });
  }

  function downloadSVG() {
    new QRCodeStyling(buildOptions(pngSize)).download({ name: `qr-${slug}`, extension: "svg" });
  }

  return (
    <div className="flex flex-col items-center gap-4 py-1">
      <p className="text-xs text-muted-foreground text-center break-all">{url}</p>

      {/* QR preview */}
      <div
        className={`rounded-xl overflow-hidden border transition-[filter] duration-500 ${logoReady ? "" : "blur-sm"}`}
        style={{ background: "#ffffff" }}
        ref={containerRef}
      />

      {/* Customization */}
      <div className="w-full flex flex-col gap-3">

        {/* Style tab */}
        <div className="flex flex-col gap-1">
          <Label className="text-xs">Stile</Label>
          <div className="flex rounded-md border border-input overflow-hidden">
            {QR_STYLES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setQrStyle(s.value)}
                className={[
                  "flex-1 h-9 text-sm transition-colors",
                  qrStyle === s.value
                    ? "bg-foreground text-background font-medium"
                    : "bg-background text-foreground hover:bg-muted",
                ].join(" ")}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logo toggle */}
        <div className="flex items-center justify-between">
          <Label className="text-xs">Logo centrale</Label>
          <Switch
            checked={showLogo}
            onCheckedChange={setShowLogo}
            disabled={!logoSrc}
          />
        </div>
      </div>

      {/* Downloads */}
      <div className="flex gap-2 w-full">
        <select value={pngSize} onChange={(e) => setPngSize(Number(e.target.value))}
          className="h-9 rounded-md border border-input bg-background px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring">
          <option value={600}>600px</option>
          <option value={1200}>1200px</option>
          <option value={2400}>2400px</option>
          <option value={4000}>4000px</option>
        </select>
        <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={downloadPNG}>
          <Download size={14} /> PNG
        </Button>
        <Button variant="outline" size="sm" className="gap-2 flex-1" onClick={downloadSVG}>
          <Download size={14} /> SVG
        </Button>
      </div>
    </div>
  );
}

export function QRCodeDialog({ url, slug }: { url: string; slug: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
          <QrCode size={16} />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code</DialogTitle>
        </DialogHeader>
        <QRCodeContent url={url} slug={slug} />
      </DialogContent>
    </Dialog>
  );
}
