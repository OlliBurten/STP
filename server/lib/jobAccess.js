export function effectiveCompanyId(req) {
  return req.companyOwnerId ?? req.userId;
}

export function jobCompanyAccessFilter(req) {
  const cid = effectiveCompanyId(req);
  if (req.organizationId) {
    const filters = [{ organizationId: req.organizationId }];
    if (req.userId === cid) {
      filters.push({ userId: cid, organizationId: null });
    }
    return { OR: filters };
  }
  return { userId: cid };
}

export function hasJobCompanyAccess(req, job) {
  const cid = effectiveCompanyId(req);
  if (req.organizationId) {
    if (job.organizationId) return job.organizationId === req.organizationId;
    return req.userId === cid && job.userId === cid;
  }
  return job.userId === cid;
}
