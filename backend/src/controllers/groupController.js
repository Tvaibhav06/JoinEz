const groupService = require('../services/groupService');
const { success } = require('../utils/response');

async function createGroup(req, res, next) {
  try {
    const { name } = req.body;
    const group = await groupService.createGroup({
      name,
      studentId: req.user.id
    });
    return success(res, group, 'Group created successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function getMyGroup(req, res, next) {
  try {
    const group = await groupService.getMyGroup(req.user.id);
    return success(res, group, 'Current group details', 200);
  } catch (err) {
    next(err);
  }
}

async function getGroupById(req, res, next) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const group = await groupService.getGroupById(groupId, req.user);
    return success(res, group, 'Group details', 200);
  } catch (err) {
    next(err);
  }
}

async function addMember(req, res, next) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const { emailOrId } = req.body;
    const result = await groupService.addMember(groupId, { emailOrId }, req.user.id);
    return success(res, result, result.message, 200);
  } catch (err) {
    next(err);
  }
}

async function getGroupProgress(req, res, next) {
  try {
    const groupId = parseInt(req.params.id, 10);
    const progress = await groupService.getGroupProgress(groupId, req.user);
    return success(res, progress, 'Group progress details', 200);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createGroup,
  getMyGroup,
  getGroupById,
  addMember,
  getGroupProgress
};
