import { StudyGroupsQueries } from './queries';
import { StudyGroupsMutations } from './mutations';

export class StudyGroupsService {
  // Queries
  static getUserGroups = StudyGroupsQueries.getUserGroups;
  static getUserGroupsViaMembers = StudyGroupsQueries.getUserGroupsViaMembers;
  static getPublicGroups = StudyGroupsQueries.getPublicGroups;
  static getGroupById = StudyGroupsQueries.getGroupById;
  static getGroupMembers = StudyGroupsQueries.getGroupMembers;

  // Mutations
  static createGroup = StudyGroupsMutations.createGroup;
  static joinGroup = StudyGroupsMutations.joinGroup;
  static leaveGroup = StudyGroupsMutations.leaveGroup;
  static removeMember = StudyGroupsMutations.removeMember;
  static updateGroup = StudyGroupsMutations.updateGroup;
  static deleteGroup = StudyGroupsMutations.deleteGroup;
  static uploadGroupAvatar = StudyGroupsMutations.uploadGroupAvatar;
  static inviteUserToGroup = StudyGroupsMutations.inviteUserToGroup;
  static getGroupInvitations = StudyGroupsMutations.getGroupInvitations;
  static acceptGroupInvitation = StudyGroupsMutations.acceptGroupInvitation;
  static declineGroupInvitation = StudyGroupsMutations.declineGroupInvitation;
}
