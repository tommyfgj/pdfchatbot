'use client';

import { useEffect, useState } from 'react';

export default function Home() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 从 oauth2-proxy 获取用户信息并跳转
    async function fetchUserInfoAndRedirect() {
      try {
        // 检查 URL 中是否已有参数（包括 ae_username）
        const hash = window.location.hash.substring(1); // 去掉 #
        const urlParams = new URLSearchParams(hash);
        const existingUsername = urlParams.get('ae_username');

        if (existingUsername) {
          // 如果 URL 中已经有 ae_username，直接跳转到 viewer
          const targetUrl = `/web/viewer.html#${hash}`;
          console.log('[Home] Using username from URL, redirecting to:', { username: existingUsername, targetUrl });
          window.location.href = targetUrl;
          return;
        }

        // 如果 URL 中没有 ae_username，从 OAuth2 获取
        const response = await fetch('/api/userinfo');
        if (!response.ok) {
          console.error('[Home] Failed to fetch user info, status:', response.status);
          setError('获取用户信息失败，请稍后刷新重试');
          return;
        }

        const userinfo = await response.json();
        
        // 检查认证状态和用户信息
        if (
          userinfo.authenticated === false ||
          (!userinfo.username && !userinfo.email)
        ) {
          console.warn('[Home] User not authenticated or no user info:', userinfo);
          setError('获取用户信息失败，请稍后刷新重试');
          return;
        }

        const username = userinfo.username || userinfo.email;
        
        // 合并 URL 中的其他参数和 OAuth2 获取的用户名
        urlParams.set('ae_username', username);
        
        // 如果 URL 中没有设置 ae_default_editor_active，默认设为 true
        if (!urlParams.has('ae_default_editor_active')) {
          urlParams.set('ae_default_editor_active', 'true');
        }
        
        const targetUrl = `/web/viewer.html#${urlParams.toString()}`;
        console.log('[Home] User info loaded from OAuth2, redirecting to:', { username, targetUrl });
        window.location.href = targetUrl;
      } catch (error) {
        console.error('[Home] Error fetching user info:', error);
        setError('获取用户信息失败，请稍后刷新重试');
      }
    }

    fetchUserInfoAndRedirect();
  }, []);

  // 显示错误状态
  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md px-6">
          <div className="mb-6">
            <svg 
              className="mx-auto h-16 w-16 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-3">
            {error}
          </h2>
          <p className="text-gray-600 mb-6">
            无法获取您的登录信息，请确保已正确登录系统
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            刷新重试
          </button>
        </div>
      </div>
    );
  }

  // 显示加载状态，等待跳转
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}
