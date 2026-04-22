const {
  jsonResponse,
  readWishlistByUsername,
  requireAuthenticatedUsername,
  writeWishlistByUsername,
} = require('../common');

module.exports = async function (context, req) {
  const authResult = requireAuthenticatedUsername(req);
  if (authResult.errorResponse) {
    context.res = authResult.errorResponse;
    return;
  }

  const targetBookId = decodeURIComponent(req.params?.bookId || '');
  if (!targetBookId) {
    context.res = jsonResponse(400, { error: 'bookId inválido' });
    return;
  }

  try {
    const wishlist = await readWishlistByUsername(authResult.username);
    const filteredWishlist = wishlist.filter(item => item.bookId !== targetBookId);
    await writeWishlistByUsername(authResult.username, filteredWishlist);
    context.res = jsonResponse(200, { items: filteredWishlist });
  } catch (error) {
    context.log.error('Error al eliminar wishlist:', error);
    context.res = jsonResponse(500, { error: 'No se pudo eliminar el libro de la lista de deseos' });
  }
};
