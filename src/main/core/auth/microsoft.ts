import { BrowserWindow, dialog } from 'electron';
import axios from 'axios';
import { getLogger } from '../utils/logger';
import { encryptData } from '../utils/security';
import { getMicrosoftClientId } from '../utils/config';
import Store from 'electron-store';

const logger = getLogger('auth:microsoft');
const store = new Store({ name: 'auth' });

const REDIRECT_URI = 'https://login.microsoftonline.com/common/oauth2/nativeclient';
const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/consumers/oauth2/v2.0/token';
const XBOX_AUTH_URL = 'https://user.auth.xboxlive.com/user/authenticate';
const XSTS_AUTH_URL = 'https://xsts.auth.xboxlive.com/xsts/authorize';
const MINECRAFT_AUTH_URL = 'https://api.minecraftservices.com/authentication/login_with_xbox';
const MINECRAFT_PROFILE_URL = 'https://api.minecraftservices.com/minecraft/profile';

interface TokenResponse {
    access_token: string;
    refresh_token: string;
    expires_in: number;
}

interface AuthData {
    username: string;
    uuid: string;
    token: string;
    refreshToken: string;
    expiresAt: number;
}

export async function startMicrosoftAuth(): Promise<{
    success: boolean;
    username?: string;
    uuid?: string;
    token?: string;
    error?: string;
}> {
    try {
        const cachedAuth = getCachedAuth();
        if (cachedAuth) {
            return {
                success: true,
                username: cachedAuth.username,
                uuid: cachedAuth.uuid,
                token: cachedAuth.token
            };
        }

        // 获取Microsoft客户端ID
        const clientId = getMicrosoftClientId();
        if (!clientId) {
            logger.error('Microsoft客户端ID未配置');
            return {
                success: false,
                error: '未配置Microsoft客户端ID，请在config.json文件中设置'
            };
        }

        const authUrl = new URL(MICROSOFT_AUTH_URL);
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('scope', 'XboxLive.signin offline_access');

        const authWindow = new BrowserWindow({
            width: 800, height: 600, show: true,
            webPreferences: { nodeIntegration: false, contextIsolation: true }
        });

        return new Promise((resolve) => {
            authWindow.webContents.on('will-redirect', async (event, url) => {
                const urlObj = new URL(url);
                const code = urlObj.searchParams.get('code');

                if (code) {
                    authWindow.close();
                    try {
                        const msTokens = await getMicrosoftToken(code, clientId);
                        const xblToken = await getXboxLiveToken(msTokens.access_token);
                        const xstsToken = await getXSTSToken(xblToken);
                        const minecraftToken = await getMinecraftToken(xstsToken);
                        const profile = await getMinecraftProfile(minecraftToken);

                        cacheAuth({
                            username: profile.name,
                            uuid: profile.id,
                            token: minecraftToken,
                            refreshToken: msTokens.refresh_token,
                            expiresAt: Date.now() + (msTokens.expires_in * 1000)
                        });

                        resolve({
                            success: true,
                            username: profile.name,
                            uuid: profile.id,
                            token: minecraftToken
                        });
                    } catch (error) {
                        logger.error('Microsoft认证过程失败:', error);
                        resolve({
                            success: false,
                            error: error instanceof Error ? error.message : '认证失败'
                        });
                    }
                }
            });

            authWindow.on('closed', () => {
                resolve({ success: false, error: '认证窗口已关闭' });
            });

            authWindow.loadURL(authUrl.toString()).catch(error => {
                logger.error('加载认证URL失败:', error);
                resolve({
                    success: false,
                    error: '无法加载Microsoft登录页面，请检查网络连接'
                });
            });
        });
    } catch (error) {
        logger.error('Microsoft认证启动失败:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : '微软认证失败'
        };
    }
}

async function getMicrosoftToken(code: string, clientId: string): Promise<TokenResponse> {
    try {
        const response = await axios.post(MICROSOFT_TOKEN_URL, new URLSearchParams({
            client_id: clientId,
            code,
            grant_type: 'authorization_code',
            redirect_uri: REDIRECT_URI
        }), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return response.data;
    } catch (error) {
        logger.error('获取Microsoft令牌失败:', error);
        if (axios.isAxiosError(error) && error.response) {
            logger.error('微软API响应:', error.response.data);
        }
        throw new Error('获取Microsoft令牌失败');
    }
}

async function getXboxLiveToken(accessToken: string): Promise<string> {
    try {
        const response = await axios.post(XBOX_AUTH_URL, {
            Properties: {
                AuthMethod: 'RPS',
                SiteName: 'user.auth.xboxlive.com',
                RpsTicket: `d=${accessToken}`
            },
            RelyingParty: 'http://auth.xboxlive.com',
            TokenType: 'JWT'
        }, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });
        return response.data.Token;
    } catch (error) {
        logger.error('获取Xbox Live令牌失败:', error);
        throw new Error('获取Xbox Live令牌失败');
    }
}

async function getXSTSToken(xblToken: string): Promise<{ token: string; userHash: string }> {
    try {
        const response = await axios.post(XSTS_AUTH_URL, {
            Properties: {
                SandboxId: 'RETAIL',
                UserTokens: [xblToken]
            },
            RelyingParty: 'rp://api.minecraftservices.com/',
            TokenType: 'JWT'
        }, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });
        return {
            token: response.data.Token,
            userHash: response.data.DisplayClaims.xui[0].uhs
        };
    } catch (error) {
        logger.error('获取XSTS令牌失败:', error);
        throw new Error('获取XSTS令牌失败');
    }
}

async function getMinecraftToken(xstsData: { token: string; userHash: string }): Promise<string> {
    try {
        const response = await axios.post(MINECRAFT_AUTH_URL, {
            identityToken: `XBL3.0 x=${xstsData.userHash};${xstsData.token}`
        }, {
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        });
        return response.data.access_token;
    } catch (error) {
        logger.error('获取Minecraft令牌失败:', error);
        throw new Error('获取Minecraft令牌失败');
    }
}

async function getMinecraftProfile(minecraftToken: string): Promise<{ id: string; name: string }> {
    try {
        const response = await axios.get(MINECRAFT_PROFILE_URL, {
            headers: { Authorization: `Bearer ${minecraftToken}` }
        });
        return {
            id: response.data.id,
            name: response.data.name
        };
    } catch (error) {
        logger.error('获取Minecraft个人资料失败:', error);
        throw new Error('获取Minecraft个人资料失败');
    }
}

function cacheAuth(authData: AuthData): void {
    const encryptedData = encryptData(JSON.stringify(authData));
    store.set('microsoft_auth', encryptedData);
}

function getCachedAuth(): { username: string; uuid: string; token: string } | null {
    try {
        const encryptedData = store.get('microsoft_auth') as string | undefined;
        if (!encryptedData) return null;

        const authData = JSON.parse(encryptedData) as AuthData;
        if (authData.expiresAt < Date.now()) return null;

        return {
            username: authData.username,
            uuid: authData.uuid,
            token: authData.token
        };
    } catch (error) {
        logger.error('读取缓存的认证数据失败:', error);
        return null;
    }
}