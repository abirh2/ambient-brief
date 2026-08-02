import { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { getSafeImageUrl } from '../utils/urls';

interface NewsImageProps {
  src?: string;
  className: string;
}

export function NewsImage({ src, className }: NewsImageProps) {
  const safeSrc = getSafeImageUrl(src);
  const [failed, setFailed] = useState(!safeSrc);

  useEffect(() => {
    setFailed(!safeSrc);
  }, [safeSrc]);

  if (failed || !safeSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-slate-800 text-slate-500`} aria-hidden="true">
        <ImageOff className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={safeSrc}
      alt=""
      className={className}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
