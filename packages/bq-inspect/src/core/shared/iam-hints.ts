export function iamHintForApi(api: string): string | undefined {
  if (api.startsWith('bigquery.jobs.')) {
    return 'Grant roles/bigquery.resourceViewer or a custom role with jobs.get/jobs.list.';
  }

  if (api.startsWith('bigquery.datasets.') || api.startsWith('bigquery.tables.')) {
    return 'Grant roles/bigquery.metadataViewer on the dataset/project or a custom metadata-only role.';
  }

  return undefined;
}
