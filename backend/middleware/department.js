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
      const requested = (req.get('X-Department') || DEFAULT_SLUG).trim();
      if (!cache) await load();
      // Refresh once if the requested slug isn't cached yet (may have been added since boot).
      if (!Object.prototype.hasOwnProperty.call(cache, requested)) {
        await load();
      }
      const id = resolveDepartmentId(requested, cache, DEFAULT_SLUG);
      if (id == null) {
        return next(new Error(`Default department '${DEFAULT_SLUG}' not found`));
      }
      req.departmentId = id;
      req.departmentSlug = Object.prototype.hasOwnProperty.call(cache, requested) ? requested : DEFAULT_SLUG;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { resolveDepartmentId, departmentMiddleware, DEFAULT_SLUG };
