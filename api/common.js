const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const USERS = [
  { username: 'admin', password: '1234' },
  { username: 'usuario', password: 'pass' },
];

const storageProvider = process.env.WISHLIST_STORAGE_PROVIDER || 'local';
const azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const azureContainerName = process.env.AZURE_BLOB_CONTAINER || 'julibrary-data';
const localStoragePath = path.join(__dirname, 'data');
const tokenSecret = process.env.AUTH_TOKEN_SECRET || 'dev-only-secret-change-this-in-production';
const tokenTtlMs = Number.parseInt(process.env.AUTH_TOKEN_TTL_MS || '', 10) || 1000 * 60 * 60 * 24 * 7;

let azureContainerClient = null;

async function getAzureContainerClient() {
  if (storageProvider !== 'azure_blob') {
    return null;
  }
  if (azureContainerClient) {
    return azureContainerClient;
  }
  if (!azureConnectionString) {
    throw new Error('Falta AZURE_STORAGE_CONNECTION_STRING para usar Azure Blob Storage.');
  }

  const { BlobServiceClient } = require('@azure/storage-blob');
  const serviceClient = BlobServiceClient.fromConnectionString(azureConnectionString);
  azureContainerClient = serviceClient.getContainerClient(azureContainerName);
  await azureContainerClient.createIfNotExists();
  return azureContainerClient;
}

function buildWishlistFilePath(username) {
  return path.join(localStoragePath, `wishlist-${username}.json`);
}

function buildWishlistBlobName(username) {
  return `wishlists/${encodeURIComponent(username)}.json`;
}

async function streamToString(readableStream) {
  if (!readableStream) {
    return '';
  }
  const chunks = [];
  for await (const chunk of readableStream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readWishlistByUsername(username) {
  if (storageProvider === 'azure_blob') {
    const containerClient = await getAzureContainerClient();
    const blobClient = containerClient.getBlockBlobClient(buildWishlistBlobName(username));
    const exists = await blobClient.exists();
    if (!exists) {
      return [];
    }
    const response = await blobClient.download();
    const body = await streamToString(response.readableStreamBody);
    const parsed = JSON.parse(body);
    return Array.isArray(parsed) ? parsed : [];
  }

  await fs.mkdir(localStoragePath, { recursive: true });
  const filePath = buildWishlistFilePath(username);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeWishlistByUsername(username, wishlist) {
  if (storageProvider === 'azure_blob') {
    const containerClient = await getAzureContainerClient();
    const blobClient = containerClient.getBlockBlobClient(buildWishlistBlobName(username));
    const content = JSON.stringify(wishlist);
    await blobClient.upload(content, Buffer.byteLength(content), {
      blobHTTPHeaders: { blobContentType: 'application/json' },
    });
    return;
  }

  await fs.mkdir(localStoragePath, { recursive: true });
  const filePath = buildWishlistFilePath(username);
  await fs.writeFile(filePath, JSON.stringify(wishlist, null, 2), 'utf8');
}

function getHeaderValue(req, headerName) {
  const headers = req?.headers;
  if (!headers) {
    return '';
  }

  if (typeof headers.get === 'function') {
    return headers.get(headerName) || '';
  }

  return headers[headerName] || headers[headerName.toLowerCase()] || headers[headerName.toUpperCase()] || '';
}

function getAuthorizationHeader(req) {
  return getHeaderValue(req, 'authorization') || getHeaderValue(req, 'Authorization');
}

function getTokenFromCustomHeader(req) {
  return getHeaderValue(req, 'x-auth-token') || getHeaderValue(req, 'X-Auth-Token');
}

function extractBearerToken(req) {
  const authHeader = getAuthorizationHeader(req);
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const customHeaderToken = getTokenFromCustomHeader(req);
  if (typeof customHeaderToken === 'string' && customHeaderToken.trim()) {
    return customHeaderToken.trim();
  }

  const queryToken = req?.query?.token;
  if (typeof queryToken === 'string' && queryToken.trim()) {
    return queryToken.trim();
  }

  const bodyToken = req?.body?.token;
  if (typeof bodyToken === 'string' && bodyToken.trim()) {
    return bodyToken.trim();
  }

  return null;
}

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decodeBase64Url(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function signPayload(encodedPayload) {
  return crypto.createHmac('sha256', tokenSecret).update(encodedPayload).digest('base64url');
}

function isValidSignature(encodedPayload, providedSignature) {
  const expectedSignature = signPayload(encodedPayload);
  if (expectedSignature.length !== providedSignature.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(providedSignature));
}

function getUsernameFromSignedToken(token) {
  if (typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) {
    return null;
  }

  if (!isValidSignature(encodedPayload, signature)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(encodedPayload));
    if (!payload || typeof payload.username !== 'string') {
      return null;
    }
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) {
      return null;
    }
    return payload.username;
  } catch {
    return null;
  }
}

function createTokenForUsername(username) {
  const payload = {
    username,
    exp: Date.now() + tokenTtlMs,
  };
  const encodedPayload = encodeBase64Url(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  const token = `${encodedPayload}.${signature}`;
  return token;
}

function revokeToken(token) {
  // Stateless tokens do not require server-side session cleanup.
  // Logout is handled by removing the token on the client side.
  void token;
}

function requireAuthenticatedUsername(req) {
  const token = extractBearerToken(req);
  if (!token) {
    return { errorResponse: jsonResponse(401, { error: 'No autorizado' }) };
  }
  const username = getUsernameFromSignedToken(token);
  if (!username) {
    return { errorResponse: jsonResponse(401, { error: 'No autorizado' }) };
  }
  return { username, token };
}

function jsonResponse(status, payload) {
  return {
    status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

module.exports = {
  USERS,
  createTokenForUsername,
  extractBearerToken,
  jsonResponse,
  readWishlistByUsername,
  requireAuthenticatedUsername,
  revokeToken,
  writeWishlistByUsername,
};
