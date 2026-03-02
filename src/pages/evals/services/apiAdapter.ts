/**
 * API Adapter
 * Transforms data between old world_model API and new environment API formats
 */

import {
  Environment,
  Persona as NewPersona,
  Scenario as NewScenario,
  Simulation as NewSimulation
} from './environmentApi';
import {
  WorldModel,
  Persona as OldPersona,
  Scenario as OldScenario,
  TestCase
} from '../types/worldModel';

/**
 * Convert new Environment response to WorldModel format
 */
export function environmentToWorldModel(env: Environment): WorldModel {
  return {
    _id: env.id,
    id: env.id,
    name: env.name,
    source_agent_id: env.agent_id,
    agent_id: env.agent_id,
    user_id: env.user_id,
    cloned_agent_id: '', // Not provided by new API
    api_key: '', // Not provided by new API
    status: env.status,
    scenarios_count: env.scenarios_count,
    personas_count: env.personas_count,
    test_cases_count: env.simulations_count,
    simulations_count: env.simulations_count,
    created_at: env.created_at,
    updated_at: env.updated_at,
  };
}

/**
 * Convert array of Environments to WorldModels
 */
export function environmentsToWorldModels(environments: Environment[]): WorldModel[] {
  return environments.map(environmentToWorldModel);
}

/**
 * Convert new Persona to old format
 */
export function newPersonaToOld(persona: NewPersona): OldPersona {
  return {
    _id: persona.id,
    id: persona.id,
    world_model_id: persona.environment_id,
    environment_id: persona.environment_id,
    name: persona.name,
    description: persona.description,
    created_at: persona.created_at,
  };
}

/**
 * Convert array of new Personas to old format
 */
export function newPersonasToOld(personas: NewPersona[]): OldPersona[] {
  return personas.map(newPersonaToOld);
}

/**
 * Convert new Scenario to old format
 */
export function newScenarioToOld(scenario: NewScenario): OldScenario {
  return {
    _id: scenario.id,
    id: scenario.id,
    world_model_id: scenario.environment_id,
    environment_id: scenario.environment_id,
    name: scenario.name,
    description: scenario.description,
    created_at: scenario.created_at,
  };
}

/**
 * Convert array of new Scenarios to old format
 */
export function newScenariosToOld(scenarios: NewScenario[]): OldScenario[] {
  return scenarios.map(newScenarioToOld);
}

/**
 * Convert new Simulation to TestCase format
 */
export function simulationToTestCase(simulation: NewSimulation): TestCase {
  return {
    _id: simulation.id,
    id: simulation.id,
    world_model_id: simulation.environment_id,
    environment_id: simulation.environment_id,
    scenario_id: simulation.scenario_id,
    persona_id: simulation.persona_id,
    name: simulation.name,
    user_input: simulation.user_input,
    expected_output: simulation.expected_output,
    created_at: simulation.created_at,
  };
}

/**
 * Convert array of Simulations to TestCases
 */
export function simulationsToTestCases(simulations: NewSimulation[]): TestCase[] {
  return simulations.map(simulationToTestCase);
}
