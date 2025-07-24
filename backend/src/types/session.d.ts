export interface RealtimeSessionOpenAPIResponseViewModel {
  id: string;
  object: string;
  expires_at: number;
  input_audio_noise_reduction: null | {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
    create_response: boolean;
    interrupt_response: boolean;
  };
  input_audio_format: string;
  input_audio_transcription: null | {
    type: string;
    language: string;
  };
  client_secret: {
    value: string;
    expires_at: number;
  };
  include: null | string[];
  model: string;
  modalities: string[];
  instructions: string;
  voice: string;
  output_audio_format: string;
  tools: string[];
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: string;
  speed: number;
  tracing: null | string;
  prompt: null | string;
}
