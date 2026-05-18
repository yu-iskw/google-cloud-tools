export interface DatasetRef {
  projectId: string;
  datasetId: string;
}

export interface TableRef extends DatasetRef {
  tableId: string;
}
