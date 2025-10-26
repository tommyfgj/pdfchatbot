'use client';

import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// 配置 PDF.js worker - 使用本地 worker 文件
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

interface PDFViewerProps {
  file: File;
  onTextSelect: (text: string) => void;
}

export default function PDFViewer({ file, onTextSelect }: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const pdfDocRef = useRef<any>(null);

  useEffect(() => {
    loadPDF();
  }, [file]);

  useEffect(() => {
    if (pdfDocRef.current) {
      renderPage(currentPage);
    }
  }, [currentPage, scale]);

  const loadPDF = async () => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      pdfDocRef.current = pdf;
      setNumPages(pdf.numPages);
      setCurrentPage(1);
      renderPage(1);
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  };

  const renderPage = async (pageNum: number) => {
    if (!pdfDocRef.current || !containerRef.current) return;

    try {
      const page = await pdfDocRef.current.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      // 清空容器
      containerRef.current.innerHTML = '';

      // 创建 canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      containerRef.current.appendChild(canvas);

      // 渲染 PDF 页面
      const renderContext = {
        canvasContext: context!,
        viewport: viewport,
      };
      await page.render(renderContext).promise;

      // 创建文本层
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'textLayer';
      textLayerDiv.style.position = 'absolute';
      textLayerDiv.style.left = '0';
      textLayerDiv.style.top = '0';
      textLayerDiv.style.right = '0';
      textLayerDiv.style.bottom = '0';
      textLayerDiv.style.overflow = 'hidden';
      textLayerDiv.style.lineHeight = '1';
      
      containerRef.current.appendChild(textLayerDiv);

      const textContent = await page.getTextContent();
      
      // 简化的文本层渲染
      textContent.items.forEach((item: any) => {
        const tx = pdfjsLib.Util.transform(
          viewport.transform,
          item.transform
        );
        const span = document.createElement('span');
        span.textContent = item.str;
        span.style.position = 'absolute';
        span.style.left = tx[4] + 'px';
        span.style.top = tx[5] + 'px';
        span.style.fontSize = Math.abs(tx[0]) + 'px';
        span.style.fontFamily = item.fontName;
        textLayerDiv.appendChild(span);
      });

    } catch (error) {
      console.error('Error rendering page:', error);
    }
  };

  // 处理文本选择
  useEffect(() => {
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
    <div className="h-full flex flex-col bg-gray-100">
      {/* 工具栏 */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded transition-colors"
          >
            上一页
          </button>
          <span className="text-sm text-gray-600">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded transition-colors"
          >
            下一页
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(Math.max(0.5, scale - 0.25))}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            -
          </button>
          <span className="text-sm text-gray-600 w-16 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(Math.min(3, scale + 0.25))}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded transition-colors"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF 内容 */}
      <div className="flex-1 overflow-auto p-4">
        <div className="flex justify-center">
          <div
            ref={containerRef}
            className="relative bg-white shadow-lg"
            style={{ minHeight: '400px' }}
          />
        </div>
      </div>
    </div>
  );
}
