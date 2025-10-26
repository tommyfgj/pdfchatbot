'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

interface PDFViewerWithAnnotationProps {
  file: File;
  onTextSelect: (text: string) => void;
}

export default function PDFViewerWithAnnotation({ file, onTextSelect }: PDFViewerWithAnnotationProps) {
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    // 创建 PDF 文件的 URL
    if (file) {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  useEffect(() => {
    // 监听文本选择
    const handleSelection = () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (text && text.length > 0) {
        onTextSelect(text);
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, [onTextSelect]);

  return (
    <>
      {/* 加载 PDF.js 和 annotation extension */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.min.mjs"
        type="module"
        onLoad={() => setIsScriptLoaded(true)}
      />
      
      <div className="h-full flex flex-col bg-gray-100">
        <div className="flex-1 overflow-hidden" ref={viewerContainerRef}>
          {pdfUrl && (
            <iframe
              ref={iframeRef}
              src={`/pdfjs-viewer.html?file=${encodeURIComponent(pdfUrl)}`}
              className="w-full h-full border-0"
              title="PDF Viewer"
            />
          )}
        </div>
      </div>
    </>
  );
}
