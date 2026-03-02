import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Expand } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";

interface PromoBannerProps {
    title: string;
    description: string;
    launchLink?: string;
    demoLink?: string;
    imageUrl?: string;
    videoUrl?: string;
    className?: string;
}

export function PromoBanner({
    title,
    description,
    launchLink,
    demoLink,
    imageUrl,
    videoUrl,
    className,
}: PromoBannerProps) {
    const [isVideoLoading, setIsVideoLoading] = useState(true);

    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
                className
            )}
        >
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 md:p-18">
                <div className="flex flex-col justify-center space-y-4">
                    <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                        {title}
                    </h2>
                    <p className="max-w-lg text-sm text-muted-foreground md:text-base">
                        {description}
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                        {launchLink && (
                            <Button asChild className="gap-2">
                                <Link to={launchLink} target="_blank">
                                    Launch
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                        {demoLink && (
                            <Button asChild variant="outline" className="gap-2">
                                <Link to={demoLink} target="_blank">
                                    Book a demo
                                    <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <div className="relative aspect-video overflow-hidden rounded-xl">
                    {videoUrl ? (
                        <>
                            {isVideoLoading && (
                                <Skeleton className="absolute inset-0 h-full w-full" />
                            )}
                            <iframe
                                title="Promo Video"
                                src={videoUrl}
                                className="h-full w-full rounded-xl"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                onLoad={() => setIsVideoLoading(false)}
                            />
                        </>
                    ) : imageUrl ? (
                        <img
                            src={imageUrl}
                            alt={title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="h-full w-full bg-gradient-to-br from-purple-400 via-pink-500 to-orange-400" />
                    )}
                </div>
            </div>
        </div>
    );
}

// LyzrGPT specific banner matching the design with video support
export function LyzrGPTBanner() {
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
    const [isVideoLoaded, setIsVideoLoaded] = useState(false);
    const [hasVideoError, setHasVideoError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const videoUrl = "/videos/lyzrgpt.mp4";

    useEffect(() => {
        if (videoRef.current) {
            if (isVideoModalOpen) {
                videoRef.current.pause();
            } else if (isVideoLoaded) {
                videoRef.current.play();
            }
        }
    }, [isVideoModalOpen, isVideoLoaded]);
    
    return (
        <>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30">
                <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[50%_50%] lg:gap-0 lg:px-12 lg:py-0">
                    {/* Content */}
                    <div className="flex flex-col justify-center space-y-4 lg:p-8">
                        <h2 className="text-2xl font-bold text-foreground md:text-3xl">
                            LyzrGPT – Private ChatGPT Alternative
                        </h2>
                        <p className="max-w-lg text-sm text-muted-foreground md:text-base leading-relaxed">
                            Enterprise-grade, model-agnostic AI chat platform powered by Google Gemini 3.0 with
                            seamless switching between Claude, Llama, Nemotron, Amazon Nova, and other leading
                            models—all deployed in your private cloud.
                        </p>
                        <div className="flex flex-wrap items-center gap-3 pt-2">
                            <Button asChild size="lg" className="inline-flex items-center gap-2 text-base font-semibold">
                                <Link to="https://chat.lyzr.app" target="_blank" className="inline-flex items-center gap-2">
                                    Launch
                                    <ArrowUpRight className="h-5 w-5" />
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="lg" className="inline-flex items-center gap-2 text-base font-semibold">
                                <Link to="https://www.avanade.com/en-gb/contact" target="_blank" className="inline-flex items-center gap-2">
                                    Book a demo
                                    <ArrowUpRight className="h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Video/Image Section */}
                    <div className="relative h-64 overflow-hidden lg:h-auto cursor-pointer group rounded-xl lg:rounded-3xl" onClick={() => setIsVideoModalOpen(true)}>
                        {/* Loading skeleton - shows while video is loading */}
                        {!isVideoLoaded && !hasVideoError && (
                            <div className="absolute inset-0 z-30">
                                <Skeleton className="h-full w-full" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                                        <span className="text-xs text-muted-foreground">Loading video...</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Gradient fallback - shows only if video fails */}
                        <div className={cn(
                            "absolute inset-0 bg-gray-700 transition-opacity duration-300",
                            isVideoLoaded && !hasVideoError ? "opacity-0" : "opacity-100"
                        )}>
                            {/* Abstract wave pattern overlay */}
                            {/* <svg
                                className="absolute inset-0 h-full w-full opacity-30"
                                viewBox="0 0 400 400"
                                preserveAspectRatio="none"
                            >
                                <defs>
                                    <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#8b5cf6" />
                                        <stop offset="50%" stopColor="#ec4899" />
                                        <stop offset="100%" stopColor="#f97316" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d="M0 100 Q 100 50 200 100 T 400 100 L 400 400 L 0 400 Z"
                                    fill="url(#wave-gradient)"
                                    opacity="0.5"
                                />
                                <path
                                    d="M0 150 Q 100 100 200 150 T 400 150 L 400 400 L 0 400 Z"
                                    fill="url(#wave-gradient)"
                                    opacity="0.3"
                                />
                                <path
                                    d="M0 200 Q 100 150 200 200 T 400 200 L 400 400 L 0 400 Z"
                                    fill="url(#wave-gradient)"
                                    opacity="0.2"
                                />
                            </svg> */}
                        </div>
                        {/* Video playing in loop - on top of gradient */}
                        <video
                            ref={videoRef}
                            src={videoUrl}
                            className={cn(
                                "absolute inset-0 z-10 h-full w-full object-cover transition-opacity duration-300",
                                isVideoLoaded ? "opacity-100" : "opacity-0"
                            )}
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            onCanPlayThrough={() => setIsVideoLoaded(true)}
                            onLoadedData={() => setIsVideoLoaded(true)}
                            onError={() => {
                                setHasVideoError(true);
                                setIsVideoLoaded(false);
                            }}
                        />
                        {/* Expand button overlay */}
                        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
                            <div className="rounded-full bg-white/90 p-3 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                <Expand className="h-6 w-6 text-gray-800" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Video Modal */}
            <Dialog open={isVideoModalOpen} onOpenChange={setIsVideoModalOpen}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-1 rounded-lg">
                    <div className="aspect-video w-full">
                        <video
                            src={videoUrl}
                            className="h-full w-full"
                            autoPlay
                            controls
                            playsInline
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
