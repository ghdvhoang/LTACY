(function definePolicy(root) {
  'use strict';

  const legacyAliases = root.YC.permissions.legacyAliases;
  const roleCapabilities = Object.freeze(Object.fromEntries(
    Object.entries(root.YC.permissions.roleDefaults.reduce((result, grant) => {
      if (!result[grant.role]) result[grant.role] = [];
      result[grant.role].push(grant.permissionId);
      return result;
    }, {})).map(([role, permissions]) => [role, Object.freeze(permissions)])
  ));

  function currentTimestamp(state) {
    const value = state.currentAt || state.seededAt || new Date().toISOString();
    return new Date(value).getTime();
  }

  function isEffective(record, state) {
    const moment = currentTimestamp(state);
    if (record.effectiveFrom && new Date(record.effectiveFrom).getTime() > moment) return false;
    if (record.effectiveTo && new Date(record.effectiveTo).getTime() < moment) return false;
    return record.status !== 'INACTIVE' && record.status !== 'REVOKED';
  }

  function classIdFor(resource, state) {
    if (resource.classId) return resource.classId;
    if (resource.sessionId) return state.sessions.find((item) => item.id === resource.sessionId)?.classId || null;
    if (resource.learnerId) return state.learners.find((item) => item.id === resource.learnerId)?.classId || null;
    return null;
  }

  function branchIdFor(resource, state) {
    if (resource.branchId) return resource.branchId;
    const classId = classIdFor(resource, state);
    return classId ? state.classes.find((item) => item.id === classId)?.branchId || null : null;
  }

  function assignmentAllows(actor, resource, state) {
    const profile = state.teacherProfiles.find((item) => item.userId === actor.id && item.status === 'ACTIVE');
    const classId = classIdFor(resource, state);
    if (!profile || !classId) return false;
    const moment = currentTimestamp(state);
    return state.teacherAssignments.some((item) => item.teacherProfileId === profile.id
      && item.classId === classId
      && ['ACCEPTED', 'ACTIVE'].includes(item.status)
      && new Date(item.startsAt).getTime() <= moment
      && new Date(item.endsAt).getTime() >= moment);
  }

  function listed(scopeIds, id) {
    return Array.isArray(scopeIds) && scopeIds.length > 0 && Boolean(id) && scopeIds.includes(id);
  }

  function scopeAllows(actor, grant, resource, state) {
    const scope = grant.scopeType || 'ORGANIZATION';
    const scopeIds = grant.scopeIds || [];
    if (scope === 'ORGANIZATION') {
      return !resource.organizationId || state.organizations.some((item) => item.id === resource.organizationId);
    }
    if (scope === 'BRANCH') {
      const branchId = branchIdFor(resource, state);
      if (!branchId || !(actor.branchIds || []).includes(branchId)) return false;
      return scopeIds.length === 0 || scopeIds.includes(branchId);
    }
    if (scope === 'ASSIGNED_CLASS') return assignmentAllows(actor, resource, state);
    if (scope === 'CLASS') return listed(scopeIds, classIdFor(resource, state));
    if (scope === 'SESSION') return listed(scopeIds, resource.sessionId || null);
    if (scope === 'OWN_LEARNER' || scope === 'LINKED_LEARNER') {
      return Boolean(resource.learnerId) && (actor.linkedLearnerIds || []).includes(resource.learnerId);
    }
    return false;
  }

  function result(allowed, permissionId, source, scope = null, recordId = null) {
    return Object.freeze({ allowed, source, permissionId, scope, recordId });
  }

  function explain(actor, requestedId, resource = {}, state) {
    const permissionId = legacyAliases[requestedId] || requestedId;
    if (!actor || actor.status !== 'ACTIVE') return result(false, permissionId, 'INACTIVE_USER');
    if (!state || !Array.isArray(state.rolePermissions) || !Array.isArray(state.userPermissionOverrides)) {
      return result(false, permissionId, 'POLICY_STATE_MISSING');
    }

    const overrides = state.userPermissionOverrides.filter((item) => item.userId === actor.id
      && item.permissionId === permissionId
      && isEffective(item, state)
      && scopeAllows(actor, item, resource, state));
    const userDeny = overrides.find((item) => item.effect === 'DENY');
    if (userDeny) return result(false, permissionId, 'USER_DENY', userDeny.scopeType, userDeny.id);
    const userAllow = overrides.find((item) => item.effect === 'ALLOW');
    if (userAllow) return result(true, permissionId, 'USER_ALLOW', userAllow.scopeType, userAllow.id);

    const roleGrants = state.rolePermissions.filter((item) => item.role === actor.role
      && item.permissionId === permissionId
      && isEffective(item, state)
      && scopeAllows(actor, item, resource, state));
    const roleDeny = roleGrants.find((item) => item.effect === 'DENY');
    if (roleDeny) return result(false, permissionId, 'ROLE_DENY', roleDeny.scopeType, roleDeny.id);
    const roleAllow = roleGrants.find((item) => item.effect === 'ALLOW');
    if (roleAllow) return result(true, permissionId, 'ROLE', roleAllow.scopeType, roleAllow.id);
    return result(false, permissionId, 'DEFAULT_DENY');
  }

  function can(actor, permissionId, resource = {}, state) {
    return explain(actor, permissionId, resource, state).allowed;
  }

  function visibleFeedback(actor, records, state) {
    if (!actor) return [];
    if (['ADMIN', 'ACADEMIC_MANAGER'].includes(actor.role)) return records.slice();
    if (actor.role === 'PARENT') {
      return records.filter((item) => (actor.linkedLearnerIds || []).includes(item.learnerId)
        && ['PARENT', 'LEARNER_PARENT'].includes(item.visibility));
    }
    if (actor.role === 'STUDENT') {
      return records.filter((item) => (actor.linkedLearnerIds || []).includes(item.learnerId)
        && ['LEARNER', 'LEARNER_PARENT'].includes(item.visibility));
    }
    if (actor.role === 'TEACHER') {
      return records.filter((item) => item.visibility !== 'RESTRICTED'
        && can(actor, 'learner.view', { learnerId: item.learnerId }, state));
    }
    return [];
  }

  root.YC.define('policy', Object.freeze({ assignmentAllows, can, explain, roleCapabilities, visibleFeedback }));
})(globalThis);
