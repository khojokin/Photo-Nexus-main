import { useState } from "react";
import { Link } from "wouter";
import { Heart, Download } from "lucide-react";
import type { Photo } from "@workspace/api-client-react";
import { useLikePhoto, useDownloadPhoto, getGetPhotoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PhotoCardProps {
  photo: Photo;
  className?: string;
  priority?: boolean;
  onOpen?: (photo: Photo) => void;
}

export function PhotoCard({ photo, className, priority = false, onOpen }: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();
  const likeMutation = useLikePhoto();
  const downloadMutation = useDownloadPhoto();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate(
      { id: photo.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) });
          queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
        },
      }
    );
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadMutation.mutate(
      { id: photo.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) });
          queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
          window.open(photo.imageUrl, "_blank");
        },
      }
    );
  };

  return (
    <div
      className={cn("group relative block overflow-hidden bg-muted", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/photos/${photo.id}`}
        data-testid={`link-photo-${photo.id}`}
        onClick={(e) => {
          if (onOpen) {
            e.preventDefault();
            onOpen(photo);
          }
        }}
      >
        <img
          src={photo.imageUrl}
          alt={photo.title}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "w-full h-auto object-cover transition-transform duration-700 ease-out",
            isHovered ? "scale-105" : "scale-100"
          )}
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        />

        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-500 flex flex-col justify-end p-6",
            isHovered && "opacity-100"
          )}
        >
          <div className="flex items-end justify-between">
            <div>
              <h3 className="text-white font-medium text-lg line-clamp-1">{photo.title}</h3>
              <p className="text-white/80 text-sm">{photo.photographerName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full h-10 w-10 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                onClick={handleLike}
                disabled={likeMutation.isPending}
                data-testid={`button-like-${photo.id}`}
              >
                <Heart className={cn("h-5 w-5", photo.likes > 0 && "fill-white")} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full h-10 w-10 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
                data-testid={`button-download-${photo.id}`}
              >
                <Download className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
