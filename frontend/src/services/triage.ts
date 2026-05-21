import { api } from '../lib/api'
import type { TriageAnalyzeRequest, TriageResult } from '../types/triage'

export async function analyzeSymptoms(request: TriageAnalyzeRequest): Promise<TriageResult> {
  const { data } = await api.post<TriageResult>('/triage/analyze', request)
  return data
}

export async function submitTriageFeedback(
  sessionId: string,
  didVisitDoctor: boolean,
): Promise<void> {
  await api.patch(`/triage/sessions/${sessionId}/feedback`, null, {
    params: { did_visit_doctor: didVisitDoctor },
  })
}
