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
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  const teams = await Team.find({ _id: { $in: totals.map(({ _id }) => _id) } }).lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals.map((entry, index) => ({
    teamName: names.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.toLowerCase() }).lean();
  if (!user) throw Object.assign(new Error('User not found'), { status: 404 });

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentTypes = new Map<string, number>();
  for (const activity of recentActivities) {
    recentTypes.set(activity.type, (recentTypes.get(activity.type) ?? 0) + 1);
  }

  const activityFocus = [...recentTypes.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
  const focus = activityFocus === 'run' || activityFocus === 'cycle' ? 'endurance' : activityFocus === 'strength' ? 'strength' : user.fitnessGoal;
  const workouts = await Workout.find({ focus }).lean();

  return workouts.map((workout) => ({
    ...workout,
    reason: activityFocus
      ? `Matches your recent ${activityFocus} activity and ${focus} goal.`
      : `Matches your ${focus} fitness goal and recent activity pattern.`,
  }));
}

export { User };
