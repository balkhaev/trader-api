export interface AgentConfig {
  role: string
  goal: string
  backstory: string
}

export interface AgentsConfig {
  [key: string]: AgentConfig
}
