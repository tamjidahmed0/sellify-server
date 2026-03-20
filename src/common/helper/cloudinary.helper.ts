// ── Helper — extract Cloudinary public_id from secure URL ──────────────────
// Input:  "https://res.cloudinary.com/demo/image/upload/v123/e-commerce/products/abc.jpg"
// Output: "e-commerce/products/abc"

export const extractPublicId = (url: string): string => {
    const parts = url.split('/upload/');
    if (parts.length < 2) return '';

    const withoutVersion = parts[1].replace(/^v\d+\//, '');
    return withoutVersion.replace(/\.[^/.]+$/, '');
}