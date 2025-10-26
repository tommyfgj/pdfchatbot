'use client';

export default function Home() {
  return (
    <div className="h-screen w-screen">
      <iframe
        src="/web/viewer.html"
        className="w-full h-full border-0"
        title="PDF Viewer with Annotations and AI Chat"
      />
    </div>
  );
}
