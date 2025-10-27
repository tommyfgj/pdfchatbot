import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * 从 oauth2-proxy 获取用户信息
 * oauth2-proxy 会在 /oauth2/userinfo 端点提供用户信息
 */
export async function GET(req: Request) {
  try {
    // 支持通过环境变量配置 userinfo URL
    let userinfoUrl = process.env.OAUTH2_USERINFO_URL;
    
    if (!userinfoUrl) {
      // 如果没有配置环境变量，则从请求中构建
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
      userinfoUrl = `${protocol}://${host}/oauth2/userinfo`;
    }
    
    console.log('[API GET] /api/userinfo - Fetching from:', userinfoUrl);
    
    // 转发所有相关的认证 headers
    const headers: HeadersInit = {};
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }
    
    // 转发其他可能需要的认证 headers
    const authHeaders = ['authorization', 'x-auth-request-user', 'x-auth-request-email'];
    authHeaders.forEach(headerName => {
      const value = req.headers.get(headerName);
      if (value) {
        headers[headerName] = value;
      }
    });
    
    // 从 oauth2-proxy 获取用户信息
    const response = await fetch(userinfoUrl, {
      headers,
      credentials: 'include',
    });
    
    if (!response.ok) {
      console.error('[API GET] /api/userinfo - Failed to fetch userinfo:', response.status, response.statusText);
      
      // 如果是 401/403，可能是未认证，返回默认用户
      if (response.status === 401 || response.status === 403) {
        console.warn('[API GET] /api/userinfo - User not authenticated, using default');
        return NextResponse.json({
          email: '',
          user: '',
          groups: [],
          username: 'anonymous',
          authenticated: false,
        });
      }
      
      return NextResponse.json(
        { error: 'failed_to_fetch_userinfo', status: response.status },
        { status: response.status }
      );
    }
    
    const userinfo = await response.json();
    console.log('[API GET] /api/userinfo - Success:', { 
      email: userinfo.email, 
      user: userinfo.user,
      hasGroups: !!userinfo.groups 
    });
    
    // 返回用户信息
    return NextResponse.json({
      email: userinfo.email || '',
      user: userinfo.user || '',
      groups: userinfo.groups || [],
      // 使用 email 作为默认用户名，如果没有则使用 user 字段
      username: userinfo.email || userinfo.user || 'anonymous',
      authenticated: true,
    });
  } catch (err: any) {
    console.error('[GET /api/userinfo] error', err);
    
    // 如果是网络错误，可能是 oauth2-proxy 未配置，返回默认用户
    if (err.code === 'ECONNREFUSED' || err.message.includes('fetch failed')) {
      console.warn('[API GET] /api/userinfo - OAuth2 Proxy not available, using default user');
      return NextResponse.json({
        email: '',
        user: '',
        groups: [],
        username: 'anonymous',
        authenticated: false,
      });
    }
    
    return NextResponse.json(
      { error: 'internal_error', message: err.message },
      { status: 500 }
    );
  }
}
