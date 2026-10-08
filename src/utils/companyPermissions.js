// Vad den inloggade får göra i åkeriet — samma regler som servern (lib/invites.js companyPermissions).
// Ägaren får allt; kollegor enligt ägarens val under Team. Utan organisation (äldre konton)
// avgör servern, så här returneras true.
const FIELD = { manageJobs: "membersCanManageJobs", editProfile: "membersCanEditProfile", invite: "membersCanInvite" };
const DEFAULT = { manageJobs: true, editProfile: false, invite: false };

export function companyCan(activeOrg, permission) {
  if (!activeOrg) return true;
  if (activeOrg.role === "OWNER") return true;
  const v = activeOrg[FIELD[permission]];
  return v === undefined ? DEFAULT[permission] : Boolean(v);
}
