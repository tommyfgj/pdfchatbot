'use client';

import { useEffect, useRef, useState } from 'react';

interface PDFViewerIframeProps {
  file: File;
  onTextSelect: (text: string) => void;
}

export default function PDFViewerIframe({ file, onTextSelect }: PDFViewerIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [pdfUrl, setPdfUrl] = useState<string>('');

  useEffect(() => {
    if (file) {
      // 创建 Blob URL
      const url = URL.createObjectURL(file);
      setPdfUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  useEffect(() => {
    // 监听来自 PDF viewer 的消息
    const handleMessage = (event: MessageEvent) => {
      // 接收来自 iframe 的消息
      if (event.data && event.data.type === 'insertToChat') {
        // 用户点击了"发送到 AI"按钮
        onTextSelect(event.data.text);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onTextSelect]);



  return (
    <div className="h-full w-full">
      {pdfUrl && (
        <iframe
          ref={iframeRef}
          src={`/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`}
          className="w-full h-full border-0"
          title="PDF Viewer with Annotations"
        />
      )}
    </div>
  );
}
