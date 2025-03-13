import { BrowserWindow, app } from 'electron';
import axios from 'axios';
import { getLogger } from '../utils/logger';
import { encryptData } from '../utils/security';
import Store from 'electron-store';

const logger = getLogger('auth:microsoft');
const store = new Store({ name: 'auth' });

// Microsoft OAuth2 Configuration
// Note: In a real application, these should be kept secret and not hardcoded
const MICROSOFT_CLIENT_ID = 'YOUR_MS_CLIENT_ID'; // You need to register an app with Microsoft
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

/**
 * Start Microsoft OAuth2 authentication flow
 */
export async function startMicrosoftAuth(): Promise<{
    success: boolean;
    username?: string;
    uuid?: string;
    token?: string;
    error?: string;
}> {
    try {
        // First check if we have a valid cached token
        const cachedAuth = getCachedAuth();
        if (cachedAuth) {
            logger.info('Using cached Microsoft auth token');
            return {
                success: true,
                username: cachedAuth.username,
                uuid: cachedAuth.uuid,
                token: cachedAuth.token
            };
        }

        // Create the authorization URL with required scopes
        const authUrl = new URL(MICROSOFT_AUTH_URL);
        authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('scope', 'XboxLive.signin offline_access');

        // Open a new browser window for the user to log in
        const authWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            }
        });

        // Handle the redirect and extract the authorization code
        return new Promise((resolve) => {
            authWindow.webContents.on('will-redirect', async (event, url) => {
                const urlObj = new URL(url);
                const code = urlObj.searchParams.get('code');

                if (code) {
                    authWindow.close();

                    try {
                        // Exchange authorization code for tokens
                        const msTokens = await getMicrosoftToken(code);

                        // Authenticate with Xbox Live
                        const xblToken = await getXboxLiveToken(msTokens.access_token);

                        // Get XSTS token
                        const xstsToken = await getXSTSToken(xblToken);

                        // Authenticate with Minecraft
                        const minecraftToken = await getMinecraftToken(xstsToken);

                        // Get Minecraft profile
                        const profile = await getMinecraftProfile(minecraftToken);

                        // Cache the auth data
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
                        logger.error('Error in Microsoft auth flow:', error);
                        resolve({
                            success: false,
                            error: error instanceof Error ? error.message : 'Authentication failed'
                        });
                    }
                }
            });

            authWindow.on('closed', () => {
                resolve({
                    success: false,
                    error: 'Authentication window was closed'
                });
            });

            // Load the Microsoft authorization page
            authWindow.loadURL(authUrl.toString());
        });
    } catch (error) {
        logger.error('Microsoft auth error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error in Microsoft authentication'
        };
    }
}

/**
 * Exchange authorization code for Microsoft access and refresh tokens
 */
async function getMicrosoftToken(code: string): Promise<TokenResponse> {
    const response = await axios.post(MICROSOFT_TOKEN_URL, new URLSearchParams({
        client_id: MICROSOFT_CLIENT_ID,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI
    }), {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    return response.data;
}

/**
 * Get Xbox Live token using Microsoft access token
 */
async function getXboxLiveToken(accessToken: string): Promise<string> {
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
}

/**
 * Get XSTS token using Xbox Live token
 */
async function getXSTSToken(xblToken: string): Promise<{ token: string; userHash: string }> {
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
}

/**
 * Get Minecraft token using XSTS token
 */
async function getMinecraftToken(xstsData: { token: string; userHash: string }): Promise<string> {
    const response = await axios.post(MINECRAFT_AUTH_URL, {
        identityToken: `XBL3.0 x=${xstsData.userHash};${xstsData.token}`
    }, {
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
        }
    });

    return response.data.access_token;
}

/**
 * Get Minecraft profile using Minecraft token
 */
async function getMinecraftProfile(minecraftToken: string): Promise<{ id: string; name: string }> {
    const response = await axios.get(MINECRAFT_PROFILE_URL, {
        headers: {
            Authorization: `Bearer ${minecraftToken}`
        }
    });

    return {
        id: response.data.id,
        name: response.data.name
    };
}

/**
 * Cache authentication data locally
 */
function cacheAuth(authData: {
    username: string;
    uuid: string;
    token: string;
    refreshToken: string;
    expiresAt: number;
}): void {
    // Encrypt sensitive data before storing
    const encryptedData = encryptData(JSON.stringify({
        username: authData.username,
        uuid: authData.uuid,
        token: authData.token,
        refreshToken: authData.refreshToken,
        expiresAt: authData.expiresAt
    }));

    store.set('microsoft_auth', encryptedData);
}

/**
 * Get cached authentication data if available and not expired
 */
function getCachedAuth(): { username: string; uuid: string; token: string } | null {
    try {
        const encryptedData = store.get('microsoft_auth') as string | undefined;
        if (!encryptedData) return null;

        // TODO: Add decryption logic here
        const authData = JSON.parse(encryptedData);

        // Check if token is expired
        if (authData.expiresAt < Date.now()) {
            // TODO: Implement refresh token logic
            return null;
        }

        return {
            username: authData.username,
            uuid: authData.uuid,
            token: authData.token
        };
    } catch (error) {
        logger.error('Error retrieving cached auth:', error);
        return null;
    }
}``