const DEFAULT_SLUG = 'projects-team';

// Pure: resolve a slug to a department id, falling back when missing/unknown.
function resolveDepartmentId(slug, deptsBySlug, fallbackSlug = DEFAULT_SLUG) {
  if (slug && Object.prototype.hasOwnProperty.call(deptsBySlug, slug)) {
    return deptsBySlug[slug];
  }
  return deptsBySlug[fallbackSlug];
}

// Express middleware factory. Caches the slug->id map in memory; refreshes on a miss.
function departmentMiddleware(db) {
  let cache = null; // { [slug]: id }

  async function load() {
    const r = await db.query('SELECT id, slug FROM departments');
    cache = {};
    for (const row of r.rows) cache[row.slug] = row.id;
    return cache;
  }

  return async function (req, res, next) {
    try {
      const slug = (req.get('X-Department') || DEFAULT_SLUG).trim();
      if (!cache) await load();
      // Refresh once if an otherwise-plausible slug isn't cached yet.
      if (!Object.prototype.hasOwnProperty.call(cache, slug) && slug !== DEFAULT_SLUG) {
        await load();
      }
      req.departmentId = resolveDepartmentId(slug, cache, DEFAULT_SLUG);
      req.departmentSlug = Object.keys(cache).find(s => cache[s] === req.departmentId) || DEFAULT_SLUG;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { resolveDepartmentId, departmentMiddleware, DEFAULT_SLUG };
