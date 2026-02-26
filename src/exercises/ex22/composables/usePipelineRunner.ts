import { ref, type Ref } from "vue";
import type { Pipeline, PipelineJob, JobStatus } from "../types";

/**
 * TODO: Composable pour exécuter un pipeline (simulation)
 */
export function usePipelineRunner(pipeline: Ref<Pipeline>) {
  const isRunning = ref(false);
  const logs = ref<string[]>([]);

  // TODO: Exécuter les jobs séquentiellement par stage
  // TODO: Simuler un délai par job (1-3s)
  // TODO: Échec aléatoire possible
  // TODO: Arrêter au premier échec (sauf allowFailure)
  async function run(): Promise<void> {
    // TODO
  }

  function reset(): void {
    // TODO: Remettre tous les statuts à 'pending'
  }

  return { isRunning, logs, run, reset };
}
