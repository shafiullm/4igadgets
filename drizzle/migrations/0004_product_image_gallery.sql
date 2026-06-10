-- Product image gallery: JSON array of image URLs. `image_url` stays as the
-- cover image (kept in sync with the first array entry) so old rows keep working.
ALTER TABLE `products` ADD `image_urls` text;
