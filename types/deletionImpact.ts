export interface DeletionImpactGroup {
  groupId: number;
  groupName: string;
}

export interface DeletionImpactTransfer extends DeletionImpactGroup {
  successorName: string;
}

export interface DeletionImpact {
  groupsToDelete: DeletionImpactGroup[];
  creatorTransfers: DeletionImpactTransfer[];
  presidencyTransfers: DeletionImpactTransfer[];
}
