export type JobPresetName = 'diagnostic';

export const jobPresetSelectors: Record<JobPresetName, string> = {
  diagnostic: [
    'id',
    'jobReference{projectId,jobId,location}',
    'status{state,errorResult,errors}',
    'statistics{creationTime,startTime,endTime,totalSlotMs,finalExecutionDurationMs,',
    'query{statementType,totalBytesProcessed,totalBytesBilled,totalSlotMs,cacheHit,',
    'referencedTables,referencedRoutines,destinationTable,',
    'queryPlan{name,id,status,startMs,endMs,slotMs,recordsRead,recordsWritten,shuffleOutputBytes,shuffleOutputBytesSpilled},',
    'timeline{elapsedMs,totalSlotMs,pendingUnits,completedUnits,activeUnits,estimatedRunnableUnits},',
    'performanceInsights,materializedViewStatistics,metadataCacheStatistics}}',
  ].join(''),
};

export function resolveJobPreset(name: string): string | undefined {
  return name in jobPresetSelectors ? jobPresetSelectors[name as JobPresetName] : undefined;
}
