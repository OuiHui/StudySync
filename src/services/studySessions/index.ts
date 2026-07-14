import { StudySessionsQueries } from './queries';
import { StudySessionsMutations } from './mutations';
import { SessionGoalsService } from './goals';

export class StudySessionsService {
  // Queries
  static getSessions = StudySessionsQueries.getSessions;
  static getAvailableSessions = StudySessionsQueries.getAvailableSessions;
  static getSessionsByGroup = StudySessionsQueries.getSessionsByGroup;
  static getSession = StudySessionsQueries.getSession;
  static getSessionGoals = SessionGoalsService.getSessionGoals;
  static getGoals = SessionGoalsService.getSessionGoals;
  static getParticipants = StudySessionsQueries.getParticipants;


  // Mutations
  static createSession = StudySessionsMutations.createSession;
  static joinSession = StudySessionsMutations.joinSession;
  static leaveSession = StudySessionsMutations.leaveSession;
  static updateSessionStatus = StudySessionsMutations.updateSessionStatus;
  static updateSession = StudySessionsMutations.updateSession;
  static deleteSession = StudySessionsMutations.deleteSession;
  static updateParticipantStatus = StudySessionsMutations.updateParticipantStatus;
  static removeParticipant = StudySessionsMutations.removeParticipant;
  static inviteUserToSession = StudySessionsMutations.inviteUserToSession;
  static acceptSessionInvitation = StudySessionsMutations.acceptSessionInvitation;
  static declineSessionInvitation = StudySessionsMutations.declineSessionInvitation;
  static planToAttendSession = StudySessionsMutations.planToAttendSession;
  static createGoal = SessionGoalsService.createGoal;
  static updateGoal = SessionGoalsService.updateGoal;
  static deleteGoal = SessionGoalsService.deleteGoal;
}
