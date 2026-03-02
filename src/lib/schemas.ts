export const getToolSchema = (toolId: string, config: any) => {
  switch (toolId) {
    case "send_email":
      return {
        openapi: "3.0.0",
        info: {
          title: "Email API",
          description: "API for sending emails.",
          version: "1.0.0",
        },
        servers: [
          {
            url: "https://tools-server.lyzr.app",
            description: "Avanade tools server",
          },
        ],
        components: {
          schemas: {
            EmailRequest: {
              type: "object",
              properties: {
                receiver_emails: {
                  type: "array",
                  description: "List of recipient email addresses",
                  items: {
                    type: "string",
                    description: "Email address of the recipient",
                  },
                },
                subject: {
                  type: "string",
                  description: "Subject of the email",
                },
                body: {
                  type: "string",
                  description: "Body is HTML content of the email",
                },
                username: {
                  type: "string",
                  description: "SMTP username",
                  default: config.username,
                },
                password: {
                  type: "string",
                  description: "SMTP password",
                  default: config.password,
                },
                host: {
                  type: "string",
                  description: "SMTP host",
                  default: config.host,
                },
                port: {
                  type: "string",
                  description: "SMTP port",
                  default: config.port,
                },
                sender_email: {
                  type: "string",
                  description: "Sender email address",
                  default: config.sender_email,
                },
                reply_to_email: {
                  type: "string",
                  description: "Reply-to email address",
                  default: config.reply_to_email,
                },
              },
              required: ["receiver_emails", "subject", "body"],
            },
          },
        },
        paths: {
          "/send_email/": {
            post: {
              summary: "Send an email",
              description: "Sends an email to the specified recipients.",
              operationId: "send_email",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/EmailRequest",
                    },
                  },
                },
                required: true,
              },
              responses: {
                "200": {
                  description: "Email sent successfully",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          status: {
                            type: "string",
                            example: "success",
                          },
                        },
                      },
                    },
                  },
                },
                "500": {
                  description: "Failed to send email",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          detail: {
                            type: "string",
                            example: "Failed to send email: Error message",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

    case "perplexity_search":
      return {
        openapi: "3.0.0",
        info: {
          title: "Perplexity AI Search API",
          description: "API for making search requests to Perplexity AI.",
          version: "1.0.0",
        },
        servers: [
          {
            url: "https://tools-server.lyzr.app",
            description: "Avanade tools server",
          },
        ],
        components: {
          schemas: {
            PerplexityRequest: {
              type: "object",
              properties: {
                api_key: {
                  type: "string",
                  description: "API key for Perplexity AI",
                  default: config.api_key,
                },
                model: {
                  type: "string",
                  description: "Model to use for the search",
                  default: config.model,
                },
                query: {
                  type: "string",
                  description: "Query to search for",
                },
              },
              required: ["query"],
            },
          },
        },
        paths: {
          "/perplexity_search/": {
            post: {
              summary: "Make a search request to Perplexity AI",
              description:
                "Makes a search request to Perplexity AI with the specified query.",
              operationId: "perplexity_search",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/PerplexityRequest",
                    },
                  },
                },
                required: true,
              },
              responses: {
                "200": {
                  description: "Search completed successfully",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          completion: {
                            type: "string",
                            example: "Search result content",
                          },
                        },
                      },
                    },
                  },
                },
                "500": {
                  description: "Failed to complete the search",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          detail: {
                            type: "string",
                            example:
                              "Failed to complete the search: Error message",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

    case "post_image_and_text_linkedin":
      return {
        openapi: "3.0.0",
        info: {
          title: "LinkedIn Post API",
          description: "API for posting images and text on LinkedIn.",
          version: "1.0.0",
        },
        servers: [
          {
            url: "https://tools-server.lyzr.app",
            description: "Avanade tools server",
          },
        ],
        components: {
          schemas: {
            LinkedInPostRequest: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                  description: "LinkedIn API token for authentication",
                  default: config.token,
                },
                title: {
                  type: "string",
                  description: "Title for the LinkedIn post",
                },
                image_url: {
                  type: "string",
                  description: "URL of the image to post",
                },
                text_content: {
                  type: "string",
                  description: "Text content to include in the LinkedIn post",
                },
              },
              required: ["title", "image_url", "text_content"],
            },
          },
        },
        paths: {
          "/post_linkedin/": {
            post: {
              summary: "Post image and text on LinkedIn",
              description: "Posts an image and text content to LinkedIn.",
              operationId: "post_image_and_text_linkedin",
              requestBody: {
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/LinkedInPostRequest",
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "Post created successfully",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          status: {
                            type: "string",
                            example: "success",
                          },
                          response: {
                            type: "string",
                            example: "success",
                          },
                        },
                      },
                    },
                  },
                },
                "500": {
                  description: "Failed to post on LinkedIn",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          detail: {
                            type: "string",
                            example:
                              "Failed to post on LinkedIn: Error message",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      };

    default:
      return {};
  }
};
