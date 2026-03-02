import React, { useState } from "react";
import { Plus, Trash2, Info, Code, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MappingRule {
  apiField: string;
  agentPath: string;
  type: 'QUERY' | 'BODY' | 'HEADER';
}

interface DefaultParamRule {
  paramField: string;
  paramValue: string;
  type: 'QUERY' | 'BODY' | 'HEADER';
}

interface AgentApiMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  agentNode: any;
  apiNode: any;
  onSaveMapping: (mapping: any) => void;
}

const AgentApiMappingModal: React.FC<AgentApiMappingModalProps> = ({
  isOpen,
  onClose,
  agentNode,
  apiNode,
  onSaveMapping,
}) => {
  console.log('🔥 AgentApiMappingModal component rendered!', { isOpen, agentNode: agentNode?.data?.name, apiNode: apiNode?.data?.name });

  const [sampleResponse, setSampleResponse] = useState<string>('{\n  "coordinates": {\n    "latitude": 40.7128,\n    "longitude": -74.0060\n  },\n  "city": "New York",\n  "confidence": 0.95\n}');
  const [mappingRules, setMappingRules] = useState<MappingRule[]>([]);
  const [defaultParamRules, setDefaultParamRules] = useState<DefaultParamRule[]>([]);
  const [defaultConfig, setDefaultConfig] = useState<{[key: string]: any}>({
    url: "",
    method: "GET",
    headers: {}
  });

  console.log('🔥 Initial defaultConfig:', defaultConfig);


  // Simple method change handler - no useEffects interfering  
  const handleMethodChange = (newMethod: string) => {
    console.log('=== METHOD CHANGE DEBUG ===');
    console.log('Current defaultConfig:', defaultConfig);
    console.log('Method changing from:', defaultConfig.method, 'to:', newMethod);
    console.log('newMethod type:', typeof newMethod);
    
    const newConfig = {
      ...defaultConfig,
      method: newMethod
    };
    console.log('Setting new config:', newConfig);
    setDefaultConfig(newConfig);
    
    // Verify it was set
    setTimeout(() => {
      console.log('After setState - current method should be:', newMethod);
    }, 0);
  };

  // Load initial data only once when modal opens
  React.useEffect(() => {
    if (!isOpen || !apiNode) return;
    
    console.log('=== LOADING EFFECT DEBUG ===');
    console.log('Modal opened, isOpen:', isOpen);
    console.log('apiNode config:', apiNode?.data?.params?.config);
    
    // Reset state first
    setDefaultConfig({
      url: "",
      method: "GET", 
      headers: {}
    });
    setMappingRules([]);
    setDefaultParamRules([]);
    
    // Load existing config - check for parameter block first, then agent-specific config, then general config
    const agentName = agentNode?.data?.name;
    const apiParams = apiNode.data?.params;
    const apiConfig = apiParams?.config;
    const agentParamBlockName = `${agentName}_data`;
    
    console.log('=== MAPPING MODAL LOADING DEBUG ===');
    console.log('Current agent name:', agentName);
    console.log('Looking for parameter block:', agentParamBlockName);
    console.log('All API params keys:', Object.keys(apiParams || {}));
    console.log('Parameter block found:', apiParams?.[agentParamBlockName]);
    console.log('Agent-specific config found:', apiParams?.[agentName || '']);
    console.log('General config:', apiConfig);
    
    // First check if there's an existing parameter block (most common for saved workflows)
    const agentParamBlock = agentName && apiParams?.[agentParamBlockName];
    // Then check for agent-specific configuration (alternative location)
    const agentSpecificConfig = agentName && apiParams?.[agentName];
    
    let configToLoad = null;
    let mappingToLoad = null;
    
    if (agentParamBlock && typeof agentParamBlock === 'object' && 'mapping' in agentParamBlock) {
      // Load from existing parameter block (most common case for saved workflows)
      console.log('✅ Loading from parameter block for:', agentName, agentParamBlock);
      mappingToLoad = agentParamBlock.mapping;
      // Get default config from general config
      if (apiConfig?.default) {
        configToLoad = apiConfig.default;
        console.log('Using general config default for UI:', configToLoad);
      }
    } else if (agentSpecificConfig && typeof agentSpecificConfig === 'object' && 'depends' in agentSpecificConfig) {
      // Load agent-specific configuration (alternative location)
      console.log('✅ Loading agent-specific config for:', agentName, agentSpecificConfig);
      mappingToLoad = agentSpecificConfig.mapping;
      // For agent-specific configs, we may need to get default from general config
      if (apiConfig?.default) {
        configToLoad = apiConfig.default;
        console.log('Using general config default for UI:', configToLoad);
      }
    } else {
      console.log('❌ No parameter block or agent-specific config found, checking general config');
      
      if (apiConfig) {
        // Fall back to general API config
        if (apiConfig.default) {
          configToLoad = apiConfig.default;
          // Only load general mapping if we're editing the same agent that the general config depends on
          if (apiConfig.depends === agentName) {
            mappingToLoad = apiConfig.mapping;
            console.log('✅ Loading general config for primary agent:', agentName);
          } else {
            console.log('⚠️ General config depends on different agent:', apiConfig.depends, 'but editing:', agentName);
          }
          console.log('Loading from general config.default:', configToLoad);
        }
        // Or if the config itself has the properties
        else if (apiConfig.url || apiConfig.method) {
          configToLoad = apiConfig;
          if (apiConfig.depends === agentName) {
            mappingToLoad = apiConfig.mapping;
          }
          console.log('Loading from config directly:', configToLoad);
        }
      } else {
        console.log('❌ No API config found at all');
      }
    }
    
    if (configToLoad) {
      const loadedConfig = {
        url: configToLoad.url || "",
        method: configToLoad.method || "GET",
        headers: configToLoad.headers || {}
      };
      console.log('Setting loaded config:', loadedConfig);
      setDefaultConfig(loadedConfig);
    }
    
    // Load existing mapping rules if they exist
    if (mappingToLoad) {
      const mapping = mappingToLoad;
      console.log('Loading existing mapping for agent:', agentName, mapping);
      const rules: MappingRule[] = [];
      Object.entries(mapping).forEach(([key, value]) => {
        let type: 'QUERY' | 'BODY' | 'HEADER' = 'BODY';
        let apiField = key;
        
        if (key.startsWith('QUERY_')) {
          type = 'QUERY';
          apiField = key.replace('QUERY_', '');
        } else if (key.startsWith('HEADER_')) {
          type = 'HEADER';
          apiField = key.replace('HEADER_', '');
        } else if (key.startsWith('BODY_')) {
          type = 'BODY';
          apiField = key.replace('BODY_', '');
        }
        
        rules.push({
          apiField,
          agentPath: value as string,
          type
        });
      });
      setMappingRules(rules);
      console.log('Loaded mapping rules:', rules);
    } else {
      console.log('No existing mapping found');
    }

    // Load existing default parameter rules from the default config
    if (configToLoad) {
      const defaultRules: DefaultParamRule[] = [];
      Object.entries(configToLoad).forEach(([key, value]) => {
        // Skip basic config fields
        if (['url', 'method', 'headers'].includes(key)) {
          return;
        }
        
        let type: 'QUERY' | 'BODY' | 'HEADER' = 'BODY';
        let paramField = key;
        
        if (key.startsWith('QUERY_')) {
          type = 'QUERY';
          paramField = key.replace('QUERY_', '');
          defaultRules.push({
            paramField,
            paramValue: value as string,
            type
          });
        } else if (key.startsWith('BODY_')) {
          type = 'BODY';
          paramField = key.replace('BODY_', '');
          defaultRules.push({
            paramField,
            paramValue: value as string,
            type
          });
        }
      });

      // Load default headers
      if (configToLoad.headers && typeof configToLoad.headers === 'object') {
        Object.entries(configToLoad.headers).forEach(([headerKey, headerValue]) => {
          if (typeof headerValue === 'string') {
            defaultRules.push({
              paramField: headerKey,
              paramValue: headerValue,
              type: 'HEADER'
            });
          }
        });
      }

      setDefaultParamRules(defaultRules);
      console.log('Loaded default parameter rules:', defaultRules);
    } else {
      console.log('No existing config found, keeping defaults');
    }
    
    console.log('=== LOADING EFFECT COMPLETE ===');
  }, [isOpen, apiNode]); // Run when modal opens or apiNode changes

  const addMappingRule = (type: 'QUERY' | 'BODY' | 'HEADER') => {
    const newRule: MappingRule = {
      apiField: '',
      agentPath: '',
      type
    };
    setMappingRules([...mappingRules, newRule]);
  };

  const updateMappingRule = (index: number, field: keyof MappingRule, value: string) => {
    const updated = [...mappingRules];
    updated[index] = { ...updated[index], [field]: value };
    setMappingRules(updated);
  };

  const removeMappingRule = (index: number) => {
    setMappingRules(mappingRules.filter((_, i) => i !== index));
  };

  const addDefaultParamRule = (type: 'QUERY' | 'BODY' | 'HEADER') => {
    const newRule: DefaultParamRule = {
      paramField: '',
      paramValue: '',
      type
    };
    setDefaultParamRules([...defaultParamRules, newRule]);
  };

  const updateDefaultParamRule = (index: number, field: keyof DefaultParamRule, value: string) => {
    const updated = [...defaultParamRules];
    updated[index] = { ...updated[index], [field]: value };
    setDefaultParamRules(updated);
  };

  const removeDefaultParamRule = (index: number) => {
    setDefaultParamRules(defaultParamRules.filter((_, i) => i !== index));
  };

  const validateSampleResponse = () => {
    try {
      JSON.parse(sampleResponse);
      return true;
    } catch {
      return false;
    }
  };

  const extractFieldPaths = (obj: any, prefix = ""): string[] => {
    const paths: string[] = [];
    
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        const path = prefix ? `${prefix}.${key}` : key;
        paths.push(path);
        
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          paths.push(...extractFieldPaths(obj[key], path));
        }
      });
    }
    
    return paths;
  };

  const getFieldPaths = () => {
    if (!validateSampleResponse()) return [];
    try {
      const parsed = JSON.parse(sampleResponse);
      return extractFieldPaths(parsed);
    } catch {
      return [];
    }
  };

  const handleSave = () => {
    // Create mapping configuration
    const mapping: any = {};
    const updatedDefaultConfig = { ...defaultConfig };
    if (typeof updatedDefaultConfig.headers !== "object" || updatedDefaultConfig.headers === null) {
      updatedDefaultConfig.headers = {};
    }
    
    // Process mapping rules (for dynamic mapping to agent response)
    mappingRules.forEach(rule => {
      if (rule.apiField && rule.agentPath) {
        const key = rule.type === 'QUERY' 
          ? `QUERY_${rule.apiField}` 
          : rule.type === 'HEADER'
          ? `HEADER_${rule.apiField}`
          : rule.type === 'BODY'
          ? `BODY_${rule.apiField}`
          : rule.apiField; // fallback
        mapping[key] = rule.agentPath;
      }
    });

    // Process default parameter rules (for static default values)
    defaultParamRules.forEach(rule => {
      if (rule.paramField && rule.paramValue) {
        if (rule.type === 'QUERY') {
          updatedDefaultConfig[`QUERY_${rule.paramField}`] = rule.paramValue;
        } else if (rule.type === 'HEADER') {
          updatedDefaultConfig.headers[rule.paramField] = rule.paramValue;
        } else if (rule.type === 'BODY') {
          updatedDefaultConfig[`BODY_${rule.paramField}`] = rule.paramValue;
        }
      }
    });

    const mappingConfig = {
      depends: agentNode.data.name,
      default: updatedDefaultConfig,
      mapping
    };

    console.log('Saving mapping config:', mappingConfig);
    console.log('Default config method:', updatedDefaultConfig.method);
    onSaveMapping(mappingConfig);
    onClose();
  };

  const fieldPaths = getFieldPaths();

  console.log('🔥 About to render Dialog, isOpen:', isOpen);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Agent to API Mapping
          </DialogTitle>
          <DialogDescription>
            Map fields from {agentNode?.data?.tag} response to {apiNode?.data?.tag} API parameters
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6">
          {(() => {
            const hasExistingMapping = apiNode?.data?.params?.config?.depends;
            const defaultTab = hasExistingMapping ? "mapping" : "sample";
            
            return (
              <Tabs defaultValue={defaultTab} className="w-full h-full flex flex-col">
                <TabsList className={`grid w-full ${hasExistingMapping ? 'grid-cols-2' : 'grid-cols-3'} flex-shrink-0 mb-4`}>
                  {!hasExistingMapping && <TabsTrigger value="sample">Sample Response</TabsTrigger>}
                  <TabsTrigger value="mapping">Field Mapping</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

            {!hasExistingMapping && (
              <TabsContent value="sample" className="flex-1 overflow-y-auto space-y-4 pr-2" style={{height: 'calc(100% - 3rem)'}}>
                <div className="space-y-4">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <div className="flex items-start gap-3">
                      <Info className="mt-0.5 h-5 w-5 text-foreground" />
                      <div className="space-y-2">
                        <h4 className="font-medium text-foreground">Agent Response Format</h4>
                        <p className="text-sm text-muted-foreground">
                          Provide a sample JSON response that your agent ({agentNode?.data?.tag}) will return. 
                          This helps create accurate field mappings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="sample-response">Sample Agent Response (JSON)</Label>
                    <Textarea
                      id="sample-response"
                      value={sampleResponse}
                      onChange={(e) => setSampleResponse(e.target.value)}
                      className="mt-2 min-h-[300px] font-mono text-sm bg-background text-foreground"
                      placeholder="Enter sample JSON response from your agent..."
                    />
                    {!validateSampleResponse() && sampleResponse && (
                      <p className="mt-2 text-sm text-destructive">Invalid JSON format</p>
                    )}
                  </div>

                  {validateSampleResponse() && (
                    <div>
                      <Label>Available Field Paths</Label>
                      <div className="mt-2 max-h-32 overflow-y-auto rounded border border-border bg-background p-3">
                        {fieldPaths.length > 0 ? (
                          <div className="space-y-1">
                            {fieldPaths.map((path, index) => (
                              <div key={index} className="font-mono text-sm text-foreground">
                                {path}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No valid field paths found</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            <TabsContent value="mapping" className="flex-1 overflow-y-auto space-y-4 pr-2" style={{height: 'calc(100% - 3rem)'}}>
              <div className="space-y-6 pb-4">
                <div>
                  <h4 className="font-medium mb-3">Default API Configuration</h4>
                  <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                    <div>
                      <Label htmlFor="default-url">Default URL</Label>
                      <Input
                        id="default-url"
                        value={defaultConfig.url}
                        onChange={(e) => setDefaultConfig({...defaultConfig, url: e.target.value})}
                        placeholder="https://api.example.com/endpoint"
                        className="mt-1 bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="default-method">Default Method</Label>
                      <Select
                        value={defaultConfig.method}
                        onValueChange={handleMethodChange}
                        onOpenChange={(open) => console.log('Select dropdown opened:', open)}
                      >
                        <SelectTrigger className="mt-1 bg-background text-foreground" onClick={() => console.log('Select trigger clicked, current value:', defaultConfig.method)}>
                          <SelectValue placeholder="Select HTTP method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET" onSelect={() => console.log('GET selected')}>GET</SelectItem>
                          <SelectItem value="POST" onSelect={() => console.log('POST selected')}>POST</SelectItem>
                          <SelectItem value="PUT" onSelect={() => console.log('PUT selected')}>PUT</SelectItem>
                          <SelectItem value="DELETE" onSelect={() => console.log('DELETE selected')}>DELETE</SelectItem>
                          <SelectItem value="PATCH" onSelect={() => console.log('PATCH selected')}>PATCH</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="text-xs text-gray-500 mt-1">Current method: {defaultConfig.method}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="font-medium text-lg">Dynamic Field Mapping</h4>
                  <p className="text-sm text-gray-600 mb-4">Map API parameters to agent response data</p>
                </div>

                <Accordion 
                  type="multiple" 
                  defaultValue={["query", "body", "headers"]}
                  className="w-full"
                >
                  <AccordionItem value="query">
                    <AccordionTrigger>Query Parameters</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {mappingRules.filter(rule => rule.type === 'QUERY').map((rule, index) => (
                          <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs">API Parameter</Label>
                              <Input
                                placeholder="lat"
                                value={rule.apiField}
                                onChange={(e) => updateMappingRule(mappingRules.indexOf(rule), 'apiField', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <ArrowRight className="h-4 w-4 text-gray-400 mb-2" />
                            <div className="flex-1">
                              <Label className="text-xs">Agent Response Path</Label>
                              <Input
                                placeholder="coordinates.latitude"
                                value={rule.agentPath}
                                onChange={(e) => updateMappingRule(mappingRules.indexOf(rule), 'agentPath', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMappingRule(mappingRules.indexOf(rule))}
                              className="mb-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addMappingRule('QUERY')}
                          className="w-full bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Query Parameter
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="body">
                    <AccordionTrigger>Body Parameters</AccordionTrigger>
                    <AccordionContent>
                      {!["POST", "PUT", "PATCH"].includes(defaultConfig.method) && (
                        <div className="mb-3 rounded-lg border border-border bg-background p-3">
                          <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">Note:</strong> Body parameters are typically used with POST, PUT, or PATCH methods. 
                            Current method is {defaultConfig.method}.
                          </p>
                        </div>
                      )}
                      <div className="space-y-3">
                        {mappingRules.filter(rule => rule.type === 'BODY').map((rule, index) => (
                          <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs">API Parameter</Label>
                              <Input
                                placeholder="message"
                                value={rule.apiField}
                                onChange={(e) => updateMappingRule(mappingRules.indexOf(rule), 'apiField', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <ArrowRight className="mb-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <Label className="text-xs">Agent Response Path</Label>
                              <Input
                                placeholder="extracted_data.message"
                                value={rule.agentPath}
                                onChange={(e) => updateMappingRule(mappingRules.indexOf(rule), 'agentPath', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMappingRule(mappingRules.indexOf(rule))}
                              className="mb-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addMappingRule('BODY')}
                          className="w-full bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Body Parameter
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="headers">
                    <AccordionTrigger>Headers</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {mappingRules.filter(rule => rule.type === 'HEADER').map((rule, index) => (
                          <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs">Header Name</Label>
                              <Input
                                placeholder="Authorization"
                                value={rule.apiField}
                                onChange={(e) => updateMappingRule(mappingRules.indexOf(rule), 'apiField', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <ArrowRight className="mb-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <Label className="text-xs">Agent Response Path</Label>
                              <Input
                                placeholder="auth.token"
                                value={rule.agentPath}
                                onChange={(e) => updateMappingRule(mappingRules.indexOf(rule), 'agentPath', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeMappingRule(mappingRules.indexOf(rule))}
                              className="mb-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addMappingRule('HEADER')}
                          className="w-full bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Header
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="space-y-6 mt-8">
                  <h4 className="font-medium text-lg">Default Parameters</h4>
                  <p className="mb-4 text-sm text-muted-foreground">Set static default values for API parameters</p>
                </div>

                <Accordion 
                  type="multiple" 
                  defaultValue={["default-query", "default-body", "default-headers"]}
                  className="w-full"
                >
                  <AccordionItem value="default-query">
                    <AccordionTrigger>Default Query Parameters</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {defaultParamRules.filter(rule => rule.type === 'QUERY').map((rule, index) => (
                          <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs">Parameter Name</Label>
                              <Input
                                placeholder="limit"
                                value={rule.paramField}
                                onChange={(e) => updateDefaultParamRule(defaultParamRules.indexOf(rule), 'paramField', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <ArrowRight className="mb-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <Label className="text-xs">Default Value</Label>
                              <Input
                                placeholder="10"
                                value={rule.paramValue}
                                onChange={(e) => updateDefaultParamRule(defaultParamRules.indexOf(rule), 'paramValue', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDefaultParamRule(defaultParamRules.indexOf(rule))}
                              className="mb-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addDefaultParamRule('QUERY')}
                          className="w-full bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Default Query Parameter
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="default-body">
                    <AccordionTrigger>Default Body Parameters</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {defaultParamRules.filter(rule => rule.type === 'BODY').map((rule, index) => (
                          <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs">Parameter Name</Label>
                              <Input
                                placeholder="message"
                                value={rule.paramField}
                                onChange={(e) => updateDefaultParamRule(defaultParamRules.indexOf(rule), 'paramField', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <ArrowRight className="mb-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <Label className="text-xs">Default Value</Label>
                              <Input
                                placeholder="Hello World"
                                value={rule.paramValue}
                                onChange={(e) => updateDefaultParamRule(defaultParamRules.indexOf(rule), 'paramValue', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDefaultParamRule(defaultParamRules.indexOf(rule))}
                              className="mb-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addDefaultParamRule('BODY')}
                          className="w-full bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Default Body Parameter
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="default-headers">
                    <AccordionTrigger>Default Headers</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {defaultParamRules.filter(rule => rule.type === 'HEADER').map((rule, index) => (
                          <div key={index} className="flex gap-2 items-end">
                            <div className="flex-1">
                              <Label className="text-xs">Header Name</Label>
                              <Input
                                placeholder="Content-Type"
                                value={rule.paramField}
                                onChange={(e) => updateDefaultParamRule(defaultParamRules.indexOf(rule), 'paramField', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <ArrowRight className="mb-2 h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <Label className="text-xs">Default Value</Label>
                              <Input
                                placeholder="application/json"
                                value={rule.paramValue}
                                onChange={(e) => updateDefaultParamRule(defaultParamRules.indexOf(rule), 'paramValue', e.target.value)}
                                className="mt-1 bg-background text-foreground"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeDefaultParamRule(defaultParamRules.indexOf(rule))}
                              className="mb-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addDefaultParamRule('HEADER')}
                          className="w-full bg-background text-foreground border-border hover:bg-accent hover:text-accent-foreground"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Default Header
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto space-y-4 pr-2" style={{height: 'calc(100% - 3rem)'}}>
              <div className="space-y-4 pb-4">
                <h4 className="font-medium">Generated Mapping Configuration</h4>
                <div className="rounded-lg border border-border bg-card p-4">
                  <pre className="whitespace-pre-wrap font-mono text-sm text-foreground">
                    {JSON.stringify((() => {
                      const mapping: any = {};
                      const previewDefaultConfig = { ...defaultConfig };
                      
                      // Process mapping rules (for dynamic mapping to agent response)
                      mappingRules.forEach(rule => {
                        if (rule.apiField && rule.agentPath) {
                          const key = rule.type === 'QUERY' 
                            ? `QUERY_${rule.apiField}` 
                            : rule.type === 'HEADER'
                            ? `HEADER_${rule.apiField}`
                            : rule.type === 'BODY'
                            ? `BODY_${rule.apiField}`
                            : rule.apiField;
                          mapping[key] = rule.agentPath;
                        }
                      });

                      // Process default parameter rules (for static default values)
                      defaultParamRules.forEach(rule => {
                        if (rule.paramField && rule.paramValue) {
                          if (rule.type === 'QUERY') {
                            previewDefaultConfig[`QUERY_${rule.paramField}`] = rule.paramValue;
                          } else if (rule.type === 'HEADER') {
                            previewDefaultConfig.headers[rule.paramField] = rule.paramValue;
                          } else if (rule.type === 'BODY') {
                            previewDefaultConfig[`BODY_${rule.paramField}`] = rule.paramValue;
                          }
                        }
                      });
                      
                      return {
                        depends: agentNode?.data?.name,
                        default: previewDefaultConfig,
                        mapping
                      };
                    })(), null, 2)}
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
            );
          })()}
        </div>

        <div className="flex justify-between items-center pt-4 border-t flex-shrink-0 px-6 pb-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={mappingRules.length === 0 && defaultParamRules.length === 0}>
            Save Mapping ({mappingRules.length + defaultParamRules.length} rules)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AgentApiMappingModal;