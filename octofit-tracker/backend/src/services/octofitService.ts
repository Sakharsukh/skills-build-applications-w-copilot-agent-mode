import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

function badRequest(message: string) {
  return Object.assign(new Error(message), { status: 400 });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Activity input is required');

  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (
    typeof userId !== 'string' || !mongoose.isObjectIdOrHexString(userId) ||
    typeof teamId !== 'string' || !mongoose.isObjectIdOrHexString(teamId) ||
    typeof type !== 'string' || type.trim().length === 0 ||
    typeof minutes !== 'number' || !Number.isInteger(minutes) || minutes < 1
  ) {
    throw badRequest('Valid userId, teamId, type, and minutes are required');
  }

  const [user, team] = await Promise.all([
    User.findById(userId).select('_id').lean(),
    Team.findById(teamId).select('_id').lean(),
  ]);
  if (!user || !team) throw badRequest('User or team does not exist');

  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw badRequest('Team input is required');

  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (typeof name !== 'string' || name.trim().length === 0 ||
      typeof mascot !== 'string' || mascot.trim().length === 0) {
    throw badRequest('Team name and mascot are required');
  }
  if (!Array.isArray(members) || members.some((member) => typeof member !== 'string' || !mongoose.isObjectIdOrHexString(member))) {
    throw badRequest('Team members must be valid user IDs');
  }

  const memberIds = [...new Set(members as string[])];
  const existingMembers = await User.find({ _id: { $in: memberIds } }).select('_id').lean();
  if (existingMembers.length !== memberIds.length) throw badRequest('One or more team members do not exist');

  const team = await Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
  await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  return team;
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
