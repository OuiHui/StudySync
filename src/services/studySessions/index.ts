import { StudySessionsQueries } from './queries';
import { StudySessionsMutations } from './mutations';

export class StudySessionsService {
  // Queries
  static getSessions = StudySessionsQueries.getSessions;
  static getAvailableSessions = StudySessionsQueries.getAvailableSessions;
  static getSessionsByGroup = StudySessionsQueries.getSessionsByGroup;

  // Mutations
  static createSession = StudySessionsMutations.createSession;
  static joinSession = StudySessionsMutations.joinSession;
  static leaveSession = StudySessionsMutations.leaveSession;
  static updateSessionStatus = StudySessionsMutations.updateSessionStatus;
  static updateSession = StudySessionsMutations.updateSession;
  static deleteSession = StudySessionsMutations.deleteSession;
}
