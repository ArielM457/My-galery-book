const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs/promises');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const USERS = [
  { username: 'admin', password: '1234' },
  { username: 'usuario', password: 'pass' },
];

const activeTokens = new Map();
const storageProvider = process.env.WISHLIST_STORAGE_PROVIDER || 'local';
const azureConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
const azureContainerName = process.env.AZURE_BLOB_CONTAINER || 'julibrary-data';
const localStoragePath = path.join(__dirname, 'data');

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

function resolveAuthenticatedUsername(req) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  return activeTokens.get(token) ?? null;
}

function requireAuth(req, res, next) {
  const username = resolveAuthenticatedUsername(req);
  if (!username) {
    res.status(401).json({ error: 'No autorizado' });
    return;
  }
  req.authenticatedUsername = username;
  next();
}

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  activeTokens.set(token, user.username);
  res.json({ token, username: user.username });
});

app.post('/api/logout', (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    activeTokens.delete(token);
  }
  res.json({ ok: true });
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ authenticated: true, username: req.authenticatedUsername });
});

app.get('/api/wishlist', requireAuth, async (req, res) => {
  try {
    const wishlist = await readWishlistByUsername(req.authenticatedUsername);
    res.json({ items: wishlist });
  } catch (error) {
    console.error('Error al obtener wishlist:', error);
    res.status(500).json({ error: 'No se pudo obtener la lista de deseos' });
  }
});

app.post('/api/wishlist', requireAuth, async (req, res) => {
  const { bookId, bookTitle, authorName, coverImageId } = req.body ?? {};
  if (typeof bookId !== 'string' || !bookId.trim() || typeof bookTitle !== 'string' || !bookTitle.trim()) {
    return res.status(400).json({ error: 'bookId y bookTitle son obligatorios' });
  }

  try {
    const wishlist = await readWishlistByUsername(req.authenticatedUsername);
    const exists = wishlist.some(item => item.bookId === bookId);
    if (exists) {
      return res.json({ items: wishlist });
    }

    wishlist.unshift({
      bookId,
      bookTitle: bookTitle.trim(),
      authorName: typeof authorName === 'string' ? authorName : 'Autor desconocido',
      coverImageId: typeof coverImageId === 'number' ? coverImageId : null,
      addedAt: new Date().toISOString(),
    });

    await writeWishlistByUsername(req.authenticatedUsername, wishlist);
    res.status(201).json({ items: wishlist });
  } catch (error) {
    console.error('Error al agregar wishlist:', error);
    res.status(500).json({ error: 'No se pudo agregar el libro a la lista de deseos' });
  }
});

app.delete('/api/wishlist/:bookId', requireAuth, async (req, res) => {
  const targetBookId = decodeURIComponent(req.params.bookId || '');
  if (!targetBookId) {
    return res.status(400).json({ error: 'bookId inválido' });
  }

  try {
    const wishlist = await readWishlistByUsername(req.authenticatedUsername);
    const filteredWishlist = wishlist.filter(item => item.bookId !== targetBookId);
    await writeWishlistByUsername(req.authenticatedUsername, filteredWishlist);
    res.json({ items: filteredWishlist });
  } catch (error) {
    console.error('Error al eliminar wishlist:', error);
    res.status(500).json({ error: 'No se pudo eliminar el libro de la lista de deseos' });
  }
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`Backend corriendo en http://localhost:${PORT}`));
