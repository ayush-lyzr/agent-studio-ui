import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Download, 
  ExternalLink, 
  CheckCircle2,
  Terminal
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Agent } from '../types/agent';
import { toast } from 'sonner';
import { CodeBlock } from '@/components/custom/markdown/components/code';

interface AgentMigrateStepProps {
  sourceAgent: Agent | null;
}

interface FrameworkTemplate {
  id: string;
  name: string;
  description: string;
  language: string;
  icon: string;
  configFormat: 'json' | 'yaml' | 'python' | 'javascript';
  documentationUrl?: string;
}

const frameworks: FrameworkTemplate[] = [
  {
    id: 'langgraph',
    name: 'LangGraph',
    description: '',
    language: 'Python',
    icon: 'Network',
    configFormat: 'python',
    documentationUrl: 'https://github.com/langchain-ai/langgraph'
  },
  {
    id: 'crewai',
    name: 'CrewAI',
    description: '',
    language: 'Python',
    icon: 'Users',
    configFormat: 'python',
    documentationUrl: 'https://docs.crewai.com/'
  },
  {
    id: 'google-adk',
    name: 'Google ADK',
    description: '',
    language: 'Python',
    icon: 'Cloud',
    configFormat: 'python',
    documentationUrl: 'https://google.github.io/adk-docs/'
  },
  {
    id: 'openai-agent-kit',
    name: 'OpenAI Agent Kit',
    description: '',
    language: 'Python',
    icon: 'Zap',
    configFormat: 'python',
    documentationUrl: 'https://openai.github.io/openai-agents-python/'
  }
];


export const AgentMigrateStep: React.FC<AgentMigrateStepProps> = ({
  sourceAgent
}) => {
  const [selectedFramework, setSelectedFramework] = useState<string>('');
  const [generatedCode, setGeneratedCode] = useState<string>('');

  const generateMigrationCode = async (frameworkId: string) => {
    if (!sourceAgent) return;

    try {
      const framework = frameworks.find(f => f.id === frameworkId);
      if (!framework) return;

      // Generate framework-specific code based on agent configuration
      let code;

      switch (frameworkId) {
        case 'langgraph':
          code = generateLangGraphCode(sourceAgent);
          break;
        case 'crewai':
          code = generateCrewAICode(sourceAgent);
          break;
        case 'google-adk':
          code = generateGoogleADKCode(sourceAgent);
          break;
        case 'openai-agent-kit':
          code = generateOpenAIAgentKitCode(sourceAgent);
          break;
        default:
          code = generateGenericCode(sourceAgent, framework);
      }

      setGeneratedCode(code);
      toast.success(`Migration code generated for ${framework.name}`);
    } catch (error) {
      console.error('Failed to generate migration code:', error);
      toast.error('Failed to generate migration code');
    }
  };

  const generateLangGraphCode = (agent: Agent) => {
    return `# ${agent.name} - LangGraph Agent

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent

# Initialize model
llm = ChatOpenAI(model="gpt-4")

# Agent instructions
instructions = """${agent.agent_role}

${agent.agent_goal || 'Complete the assigned tasks effectively'}

${agent.agent_instructions}"""

# Create agent
agent = create_react_agent(llm, [], state_modifier=instructions)

# Run agent
def chat(message: str):
    result = agent.invoke({"messages": [("user", message)]})
    return result["messages"][-1].content

# Usage
response = chat("Hello!")
print(response)
`;
  };

  const generateGoogleADKCode = (agent: Agent) => {
    return `# ${agent.name} - Google ADK Agent

from google.adk import LlmAgent
from google.adk.llms import VertexAI

# Initialize model
llm = VertexAI(model="gemini-1.5-pro")

# Agent instructions
instructions = """${agent.agent_role}

${agent.agent_goal || 'Complete the assigned tasks effectively'}

${agent.agent_instructions}"""

# Create agent
agent = LlmAgent(
    name="${agent.name.replace(/\s+/g, '_').toLowerCase()}",
    instructions=instructions,
    model=llm
)

# Run agent
def chat(message: str):
    from google.adk import Runner
    result = Runner.run_sync(agent, message)
    return result.final_output

# Usage
response = chat("Hello!")
print(response)
`;
  };

  const generateCrewAICode = (agent: Agent) => {
    return `# ${agent.name} - CrewAI Agent

from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI

# Initialize model
llm = ChatOpenAI(model="gpt-4")

# Create agent
agent = Agent(
    role="${agent.agent_role}",
    goal="${agent.agent_goal || 'Complete the assigned tasks effectively'}",
    backstory="""${agent.agent_instructions}""",
    llm=llm
)

# Run agent
def chat(message: str):
    task = Task(
        description=message,
        agent=agent,
        expected_output="Helpful response"
    )
    
    crew = Crew(agents=[agent], tasks=[task])
    result = crew.kickoff()
    return result

# Usage
response = chat("Hello!")
print(response)
`;
  };

  const generateOpenAIAgentKitCode = (agent: Agent) => {
    return `# ${agent.name} - OpenAI Agent Kit Agent

from agents import Agent, Runner

# Agent instructions
instructions = """${agent.agent_role}

${agent.agent_goal || 'Complete the assigned tasks effectively'}

${agent.agent_instructions}"""

# Create agent
agent = Agent(
    name="${agent.name.replace(/\s+/g, '_').toLowerCase()}",
    instructions=instructions
)

# Run agent
def chat(message: str):
    result = Runner.run_sync(agent, message)
    return result.final_output

# Usage
response = chat("Hello!")
print(response)
`;
  };


  const generateGenericCode = (agent: Agent, framework: FrameworkTemplate) => {
    return `# ${agent.name} - ${framework.name} Configuration
# Generated from Agent Studio

Agent Configuration:
- Name: ${agent.name}
- Role: ${agent.agent_role}
- Goal: ${agent.agent_goal || 'Complete the assigned tasks effectively'}

Instructions:
${agent.agent_instructions}

# Please refer to ${framework.name} documentation for specific implementation details.
# Documentation: ${framework.documentationUrl || 'Please check the framework\'s official documentation'}
`;
  };

  const handleFrameworkSelect = (frameworkId: string) => {
    setSelectedFramework(frameworkId);
    if (frameworkId) {
      generateMigrationCode(frameworkId);
    } else {
      setGeneratedCode('');
    }
  };

  const downloadCode = (code: string, filename: string) => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    toast.success('Code downloaded successfully!');
  };

  const getFileExtension = (format: string) => {
    switch (format) {
      case 'python': return '.py';
      case 'javascript': return '.js';
      case 'yaml': return '.yaml';
      case 'json': return '.json';
      default: return '.txt';
    }
  };

  if (!sourceAgent) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No agent information available</p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Agent Migration</h2>
        <p className="text-gray-600">
          Export Lyzr Agent to external frameworks (currently supports Single-Agent Migration).
        </p>
      </div>

      {/* Available Frameworks Overview - Only show when no framework is selected */}
      {!selectedFramework && (
        <Card className="p-8">
          <div className="text-center mb-6">
            <p className="text-muted-foreground">
              Choose from our supported frameworks to migrate your agent
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {frameworks.map((framework) => {
              return (
                <div
                  key={framework.id}
                  className="p-4 border rounded-lg transition-colors cursor-pointer hover:border-primary/50"
                  onClick={() => handleFrameworkSelect(framework.id)}
                >
                  <div className="mb-3">
                    <h5 className="font-semibold mb-2">{framework.name}</h5>
                    <Badge variant="outline" className="text-xs">
                      {framework.language}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Framework Selection Dropdown - Only show when framework is selected */}
      {selectedFramework && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Selected Framework</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedFramework('')}
            >
              Change Framework
            </Button>
          </div>
          <div className="space-y-4">
            <Select value={selectedFramework} onValueChange={handleFrameworkSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a framework to migrate to..." />
              </SelectTrigger>
              <SelectContent>
                {frameworks.map((framework) => {
                  return (
                    <SelectItem key={framework.id} value={framework.id}>
                      <div className="flex items-center justify-between w-full gap-8">
                        <div className="font-medium">{framework.name}</div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </Card>
      )}

      {/* Generated Code */}
      {generatedCode && selectedFramework && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b bg-gray-50/50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <Terminal className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h4 className="font-semibold">Generated Migration Code</h4>
                <p className="text-sm text-muted-foreground">
                  {frameworks.find(f => f.id === selectedFramework)?.name} implementation
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Ready
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => downloadCode(
                  generatedCode, 
                  `${sourceAgent.name.replace(/\s+/g, '_').toLowerCase()}_${selectedFramework}${getFileExtension(frameworks.find(f => f.id === selectedFramework)?.configFormat || 'python')}`
                )}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>

          <div className="p-6">
            <CodeBlock
              className={`language-${frameworks.find(f => f.id === selectedFramework)?.configFormat || 'python'}`}
              theme="dark"
              showLineNumbers={true}
            >
              {generatedCode}
            </CodeBlock>

            {(() => {
              const framework = frameworks.find(f => f.id === selectedFramework);
              return framework?.documentationUrl && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Next Steps
                      </p>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        Review the generated code and refer to the{' '}
                        <Button
                          variant="link"
                          className="h-auto p-0 text-blue-800 dark:text-blue-200 underline font-medium"
                          onClick={() => window.open(framework.documentationUrl, '_blank')}
                        >
                          {framework.name} documentation
                        </Button>
                        {' '}for deployment instructions and advanced configuration options.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </Card>
      )}

    </div>
  );
};