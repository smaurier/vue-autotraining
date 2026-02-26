export type JobStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "skipped";

export interface PipelineJob {
  id: number;
  name: string;
  stage: string;
  script: string[];
  status: JobStatus;
  duration?: number;
  allowFailure?: boolean;
}

export interface PipelineStage {
  name: string;
  status: JobStatus;
}

export interface Pipeline {
  id: number;
  name: string;
  stages: PipelineStage[];
  jobs: PipelineJob[];
  trigger: string;
  status: JobStatus;
}
