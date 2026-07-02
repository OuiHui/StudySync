import { ProfileQueries } from './queries';
import { ProfileMutations } from './mutations';

export class ProfileService {
  // Queries & Helpers
  static getCurrentUser = ProfileQueries.getCurrentUser;
  static getUserStats = ProfileQueries.getUserStats;
  static calculateStudyHours = ProfileQueries.calculateStudyHours;
  static calculateStudyStreak = ProfileQueries.calculateStudyStreak;
  static getRecentActivity = ProfileQueries.getRecentActivity;
  static formatTimeAgo = ProfileQueries.formatTimeAgo;
  static parseTimeAgo = ProfileQueries.parseTimeAgo;
  static getStudyHoursToday = ProfileQueries.getStudyHoursToday;
  static getStudyHoursThisWeek = ProfileQueries.getStudyHoursThisWeek;

  // Mutations
  static updateProfile = ProfileMutations.updateProfile;
}
