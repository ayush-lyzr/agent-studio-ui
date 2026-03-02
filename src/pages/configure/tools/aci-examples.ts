export type AciExampleValue = "no_auth" | "api_key" | "oauth2";

export type AciExample = {
  value: AciExampleValue;
  label: string;
  appJson: Record<string, any>;
  functionJson: any[];
  secrets?: Record<string, any>;
};

export const ACI_EXAMPLES: AciExample[] = [
  {
    value: "no_auth",
    label: "No Auth",
    appJson: {
      name: "ARXIV",
      display_name: "arXiv",
      logo: "https://raw.githubusercontent.com/aipotheosis-labs/aipolabs-icons/refs/heads/main/apps/arxiv.svg",
      provider: "Cornell University",
      version: "1.0.0",
      description:
        "arXiv is an open-access repository of electronic preprints and postprints approved for posting after moderation, but not peer review. It consists of scientific papers in the fields of mathematics, physics, astronomy, electrical engineering, computer science, quantitative biology, statistics, mathematical finance and economics.",
      security_schemes: {
        no_auth: {},
      },
      default_security_credentials_by_scheme: {},
      categories: ["Research"],
      visibility: "public",
      active: true,
    },
    functionJson: [
      {
        name: "ARXIV__SEARCH_PAPERS",
        description:
          "Search for papers on arXiv by query, category, and other criteria. Returns results in Atom XML format that needs to be parsed into JSON.",
        tags: ["research", "academic", "science"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/api/query",
          server_url: "https://export.arxiv.org",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "Query parameters for searching papers",
              properties: {
                search_query: {
                  type: "string",
                  description:
                    "Search query string. Supports Boolean operators (AND, OR, NOT), grouping with parentheses, and field-specific searches.",
                },
                id_list: {
                  type: "string",
                  description: "Comma-separated list of arXiv IDs to return",
                },
                start: {
                  type: "integer",
                  description: "Starting index for results (for pagination)",
                  default: 0,
                  minimum: 0,
                },
                max_results: {
                  type: "integer",
                  description: "Maximum number of results to return (1-1000)",
                  default: 10,
                  minimum: 1,
                  maximum: 1000,
                },
                sortBy: {
                  type: "string",
                  description: "Sorting criterion for results",
                  enum: ["relevance", "lastUpdatedDate", "submittedDate"],
                  default: "relevance",
                },
                sortOrder: {
                  type: "string",
                  description: "Order of sorting",
                  enum: ["ascending", "descending"],
                  default: "descending",
                },
              },
              required: ["search_query"],
              visible: [
                "search_query",
                "id_list",
                "start",
                "max_results",
                "sortBy",
                "sortOrder",
              ],
              additionalProperties: false,
            },
            header: {
              type: "object",
              properties: {
                Accept: {
                  type: "string",
                  default: "application/atom+xml",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["query"],
          visible: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "ARXIV__GET_PAPER_METADATA",
        description:
          "Retrieve detailed metadata for a specific paper on arXiv by its ID.",
        tags: ["research", "academic", "science"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/api/query/",
          server_url: "https://export.arxiv.org",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "Query parameters for retrieving paper metadata",
              properties: {
                id_list: {
                  type: "string",
                  description:
                    "arXiv ID of the paper (e.g., '2108.07258' or 'cs/0703041')",
                },
              },
              required: ["id_list"],
              visible: ["id_list"],
              additionalProperties: false,
            },
            header: {
              type: "object",
              properties: {
                Accept: {
                  type: "string",
                  default: "application/json",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["query"],
          visible: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "ARXIV__DOWNLOAD_PAPER",
        description: "Download a paper from arXiv in PDF format.",
        tags: ["research", "academic", "science"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/pdf/{paper_id}",
          server_url: "https://arxiv.org",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters for downloading paper",
              properties: {
                paper_id: {
                  type: "string",
                  description:
                    "arXiv ID of the paper (e.g., '2108.07258' or 'cs/0703041')",
                },
              },
              required: ["paper_id"],
              visible: ["paper_id"],
              additionalProperties: false,
            },
            header: {
              type: "object",
              properties: {
                Accept: {
                  type: "string",
                  default: "application/pdf",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "ARXIV__GET_CATEGORIES",
        description: "Retrieve a list of all available categories on arXiv.",
        tags: ["research", "academic", "science"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/category_taxonomy",
          server_url: "https://arxiv.org",
        },
        parameters: {
          type: "object",
          properties: {
            header: {
              type: "object",
              properties: {
                Accept: {
                  type: "string",
                  default: "text/html",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: [],
          visible: [],
          additionalProperties: false,
        },
      },
      {
        name: "ARXIV__GET_DAILY_UPDATES",
        description:
          "Retrieve the latest papers from specific categories, published within the last day.",
        tags: ["research", "academic", "science"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/api/query",
          server_url: "https://export.arxiv.org",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "Query parameters for getting daily updates",
              properties: {
                search_query: {
                  type: "string",
                  description:
                    "Comma-separated list of arXiv categories to fetch updates from (e.g., 'cat:cs.AI,cat:physics.gen-ph')",
                },
                max_results: {
                  type: "integer",
                  description: "Maximum number of results to return (1-100)",
                  default: 10,
                  minimum: 1,
                  maximum: 100,
                },
                sortBy: {
                  type: "string",
                  description: "Sorting criterion for results",
                  enum: ["lastUpdatedDate", "submittedDate"],
                  default: "submittedDate",
                },
                sortOrder: {
                  type: "string",
                  description: "Order of sorting",
                  enum: ["ascending", "descending"],
                  default: "descending",
                },
              },
              required: ["search_query"],
              visible: ["search_query", "max_results", "sortBy", "sortOrder"],
              additionalProperties: false,
            },
            header: {
              type: "object",
              properties: {
                Accept: {
                  type: "string",
                  default: "application/json",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["query"],
          visible: ["query"],
          additionalProperties: false,
        },
      },
    ],
  },
  {
    value: "api_key",
    label: "API Key",
    appJson: {
      name: "BRAVE_SEARCH",
      display_name: "Brave Search",
      logo: "https://raw.githubusercontent.com/aipotheosis-labs/aipolabs-icons/refs/heads/main/apps/brave_search.svg",
      provider: "Brave Software, Inc.",
      version: "1.0.0",
      description:
        "Brave Search API is a REST API to query Brave Search and get back search results from the web. It supports web search, summarizer search, image search, video search, news search.",
      security_schemes: {
        api_key: {
          location: "header",
          name: "X-Subscription-Token",
          prefix: null,
        },
      },
      default_security_credentials_by_scheme: {},
      categories: ["Search & Scraping"],
      visibility: "public",
      active: true,
    },
    functionJson: [
      {
        name: "BRAVE_SEARCH__WEB_SEARCH",
        description:
          "Brave Web Search API is a REST API to query Brave Search and get back search results from the web.",
        tags: ["search"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/web/search",
          server_url: "https://api.search.brave.com/res/v1",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "query parameters",
              properties: {
                q: {
                  type: "string",
                  description:
                    "The user's search query term. Maximum of 400 characters and 50 words",
                  maxLength: 400,
                },
                country: {
                  type: "string",
                  description:
                    "The search query country (2 character country codes)",
                  default: "US",
                  enum: [
                    "ALL",
                    "AR",
                    "AU",
                    "AT",
                    "BE",
                    "BR",
                    "CA",
                    "CL",
                    "DK",
                    "FI",
                    "FR",
                    "DE",
                    "HK",
                    "IN",
                    "ID",
                    "IT",
                    "JP",
                    "KR",
                    "MY",
                    "MX",
                    "NL",
                    "NZ",
                    "NO",
                    "CN",
                    "PL",
                    "PT",
                    "PH",
                    "RU",
                    "SA",
                    "ZA",
                    "ES",
                    "SE",
                    "CH",
                    "TW",
                    "TR",
                    "GB",
                    "US",
                  ],
                },
                search_lang: {
                  type: "string",
                  description:
                    "The search language preference (2+ character language code)",
                  default: "en",
                  enum: [
                    "ar",
                    "eu",
                    "bn",
                    "bg",
                    "ca",
                    "zh-hans",
                    "zh-hant",
                    "hr",
                    "cs",
                    "da",
                    "nl",
                    "en",
                    "en-gb",
                    "et",
                    "fi",
                    "fr",
                    "gl",
                    "de",
                    "gu",
                    "he",
                    "hi",
                    "hu",
                    "is",
                    "it",
                    "jp",
                    "kn",
                    "ko",
                    "lv",
                    "lt",
                    "ms",
                    "ml",
                    "mr",
                    "nb",
                    "pl",
                    "pt-br",
                    "pt-pt",
                    "pa",
                    "ro",
                    "ru",
                    "sr",
                    "sk",
                    "sl",
                    "es",
                    "sv",
                    "ta",
                    "te",
                    "th",
                    "tr",
                    "uk",
                    "vi",
                  ],
                },
                ui_lang: {
                  type: "string",
                  description:
                    "User interface language preferred in response (format: <language_code>-<country_code>)",
                  default: "en-US",
                  enum: [
                    "es-AR",
                    "en-AU",
                    "de-AT",
                    "nl-BE",
                    "fr-BE",
                    "pt-BR",
                    "en-CA",
                    "fr-CA",
                    "es-CL",
                    "da-DK",
                    "fi-FI",
                    "fr-FR",
                    "de-DE",
                    "zh-HK",
                    "en-IN",
                    "en-ID",
                    "it-IT",
                    "ja-JP",
                    "ko-KR",
                    "en-MY",
                    "es-MX",
                    "nl-NL",
                    "en-NZ",
                    "no-NO",
                    "zh-CN",
                    "pl-PL",
                    "en-PH",
                    "ru-RU",
                    "en-ZA",
                    "es-ES",
                    "sv-SE",
                    "fr-CH",
                    "de-CH",
                    "zh-TW",
                    "tr-TR",
                    "en-GB",
                    "en-US",
                    "es-US",
                  ],
                },
                count: {
                  type: "integer",
                  description:
                    "Number of search results returned in response (max 20) The actual number delivered may be less than requested. Combine this parameter with offset to paginate search results.",
                  default: 20,
                  maximum: 20,
                  minimum: 1,
                },
                offset: {
                  type: "integer",
                  description:
                    "The zero based offset that indicates number of search results per page (count) to skip before returning the result. The maximum is 9. The actual number delivered may be less than requested based on the query. In order to paginate results use this parameter together with count",
                  default: 0,
                  maximum: 9,
                  minimum: 0,
                },
                safesearch: {
                  type: "string",
                  description: "Filters search results for adult content",
                  default: "moderate",
                  enum: ["off", "moderate", "strict"],
                },
                freshness: {
                  type: "string",
                  description:
                    "Filters search results by when they were discovered. Can be a predefined value (pd, pw, pm, py) or a date range in format YYYY-MM-DDtoYYYY-MM-DD",
                  anyOf: [
                    { enum: ["pd", "pw", "pm", "py"] },
                    { pattern: "^\\d{4}-\\d{2}-\\d{2}to\\d{4}-\\d{2}-\\d{2}$" },
                  ],
                },
                text_decorations: {
                  type: "boolean",
                  description:
                    "Whether display strings should include decoration markers",
                  default: true,
                },
                spellcheck: {
                  type: "boolean",
                  description: "Whether to spellcheck provided query",
                  default: true,
                },
                result_filter: {
                  type: "string",
                  description:
                    "Comma delimited string of result types to include. Available result filter values are: discussions, faq, infobox, news, query, summarizer, videos, web, locations",
                },
                goggles_id: {
                  type: "string",
                  description:
                    "Goggles act as a custom re-ranking on top of Brave’s search index",
                },
                units: {
                  type: "string",
                  description:
                    "The measurement units. If not provided, units are derived from search country.",
                  enum: ["metric", "imperial"],
                },
                extra_snippets: {
                  type: "boolean",
                  description:
                    "A snippet is an excerpt from a page you get as a result of the query, and extra_snippets allow you to get up to 5 additional, alternative excerpts.",
                  default: false,
                },
                summary: {
                  type: "boolean",
                  description:
                    "This parameter enables summary key generation in web search results. This is required for summarizer to be enabled.",
                  default: false,
                },
              },
              required: ["q"],
              visible: ["q", "count", "offset", "safesearch", "extra_snippets"],
              additionalProperties: false,
            },
            header: {
              type: "object",
              description: "header parameters",
              properties: {
                Accept: {
                  type: "string",
                  description: "The supported media type",
                  default: "application/json",
                },
                "Accept-Encoding": {
                  type: "string",
                  description: "The supported compression type",
                  enum: ["gzip"],
                },
                "Api-Version": {
                  type: "string",
                  description:
                    "The Brave Web Search API version to use. Format: YYYY-MM-DD. Latest version used by default",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                },
                "Cache-Control": {
                  type: "string",
                  description:
                    "Search will return cached web search results by default. To prevent caching set the Cache-Control header to no-cache",
                  enum: ["no-cache"],
                },
                "User-Agent": {
                  type: "string",
                  description:
                    "The user agent of the client sending the request. Should follow commonly used browser agent strings",
                },
                "X-Loc-Lat": {
                  type: "number",
                  description:
                    "The latitude of the client's geographical location in degrees, to provide relevant local results",
                  minimum: -90.0,
                  maximum: 90.0,
                },
                "X-Loc-Long": {
                  type: "number",
                  description:
                    "The longitude of the client's geographical location in degrees, to provide relevant local results",
                  minimum: -180.0,
                  maximum: 180.0,
                },
                "X-Loc-Timezone": {
                  type: "string",
                  description:
                    "The IANA timezone for the client's device (e.g., America/New_York)",
                },
                "X-Loc-City": {
                  type: "string",
                  description: "The generic name of the client city",
                },
                "X-Loc-State": {
                  type: "string",
                  description:
                    "The code representing the client's state/region (up to 3 characters)",
                  maxLength: 3,
                },
                "X-Loc-State-Name": {
                  type: "string",
                  description:
                    "The name of the client's state/region. The region is the first-level subdivision (the broadest or least specific) of the ISO 3166-2 code.",
                },
                "X-Loc-Country": {
                  type: "string",
                  description:
                    "The two letter code for the client's country (ISO 3166-1 alpha-2)",
                  pattern: "^[A-Z]{2}$",
                },
                "X-Loc-Postal-Code": {
                  type: "string",
                  description: "The postal code of the client's location",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["query", "header"],
          visible: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "BRAVE_SEARCH__IMAGE_SEARCH",
        description:
          "Brave Image Search API is a REST API to query Brave Search and get back search results from the web.",
        tags: ["search"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/images/search",
          server_url: "https://api.search.brave.com/res/v1",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "query parameters",
              properties: {
                q: {
                  type: "string",
                  description:
                    "The user’s search query term. Query can not be empty. Maximum of 400 characters and 50 words in the query.",
                  maxLength: 400,
                },
                country: {
                  type: "string",
                  description:
                    "The search query country (2 character country codes)",
                  default: "US",
                  enum: [
                    "ALL",
                    "AR",
                    "AU",
                    "AT",
                    "BE",
                    "BR",
                    "CA",
                    "CL",
                    "DK",
                    "FI",
                    "FR",
                    "DE",
                    "HK",
                    "IN",
                    "ID",
                    "IT",
                    "JP",
                    "KR",
                    "MY",
                    "MX",
                    "NL",
                    "NZ",
                    "NO",
                    "CN",
                    "PL",
                    "PT",
                    "PH",
                    "RU",
                    "SA",
                    "ZA",
                    "ES",
                    "SE",
                    "CH",
                    "TW",
                    "TR",
                    "GB",
                    "US",
                  ],
                },
                search_lang: {
                  type: "string",
                  description:
                    "The search language preference (2+ character language code)",
                  default: "en",
                  enum: [
                    "ar",
                    "eu",
                    "bn",
                    "bg",
                    "ca",
                    "zh-hans",
                    "zh-hant",
                    "hr",
                    "cs",
                    "da",
                    "nl",
                    "en",
                    "en-gb",
                    "et",
                    "fi",
                    "fr",
                    "gl",
                    "de",
                    "gu",
                    "he",
                    "hi",
                    "hu",
                    "is",
                    "it",
                    "jp",
                    "kn",
                    "ko",
                    "lv",
                    "lt",
                    "ms",
                    "ml",
                    "mr",
                    "nb",
                    "pl",
                    "pt-br",
                    "pt-pt",
                    "pa",
                    "ro",
                    "ru",
                    "sr",
                    "sk",
                    "sl",
                    "es",
                    "sv",
                    "ta",
                    "te",
                    "th",
                    "tr",
                    "uk",
                    "vi",
                  ],
                },
                count: {
                  type: "integer",
                  description:
                    "Number of search results returned in response (max 20) The actual number delivered may be less than requested. Combine this parameter with offset to paginate search results.",
                  default: 50,
                  maximum: 100,
                  minimum: 1,
                },
                safesearch: {
                  type: "string",
                  description: "Filters search results for adult content",
                  default: "strict",
                  enum: ["off", "strict"],
                },
                spellcheck: {
                  type: "boolean",
                  description: "Whether to spellcheck provided query",
                  default: false,
                },
              },
              required: ["q"],
              visible: [
                "q",
                "count",
                "country",
                "search_lang",
                "safesearch",
                "spellcheck",
              ],
              additionalProperties: false,
            },
            header: {
              type: "object",
              description: "header parameters",
              properties: {
                Accept: {
                  type: "string",
                  description: "The supported media type",
                  default: "application/json",
                },
                "Accept-Encoding": {
                  type: "string",
                  description: "The supported compression type",
                  enum: ["gzip"],
                },
                "Api-Version": {
                  type: "string",
                  description:
                    "The Brave Web Search API version to use. Format: YYYY-MM-DD. Latest version used by default",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                },
                "Cache-Control": {
                  type: "string",
                  description:
                    "Search will return cached web search results by default. To prevent caching set the Cache-Control header to no-cache",
                  enum: ["no-cache"],
                },
                "User-Agent": {
                  type: "string",
                  description:
                    "The user agent of the client sending the request. Should follow commonly used browser agent strings",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["query", "header"],
          visible: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "BRAVE_SEARCH__VIDEO_SEARCH",
        description:
          "Brave Video Search API is a REST API to query Brave Search and get back search results from the web.",
        tags: ["search"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/videos/search",
          server_url: "https://api.search.brave.com/res/v1",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "query parameters",
              properties: {
                q: {
                  type: "string",
                  description:
                    "The user’s search query term. Query can not be empty. Maximum of 400 characters and 50 words in the query.",
                  maxLength: 400,
                },
                country: {
                  type: "string",
                  description:
                    "The search query country (2 character country codes)",
                  default: "US",
                  enum: [
                    "ALL",
                    "AR",
                    "AU",
                    "AT",
                    "BE",
                    "BR",
                    "CA",
                    "CL",
                    "DK",
                    "FI",
                    "FR",
                    "DE",
                    "HK",
                    "IN",
                    "ID",
                    "IT",
                    "JP",
                    "KR",
                    "MY",
                    "MX",
                    "NL",
                    "NZ",
                    "NO",
                    "CN",
                    "PL",
                    "PT",
                    "PH",
                    "RU",
                    "SA",
                    "ZA",
                    "ES",
                    "SE",
                    "CH",
                    "TW",
                    "TR",
                    "GB",
                    "US",
                  ],
                },
                search_lang: {
                  type: "string",
                  description:
                    "The search language preference (2+ character language code)",
                  default: "en",
                  enum: [
                    "ar",
                    "eu",
                    "bn",
                    "bg",
                    "ca",
                    "zh-hans",
                    "zh-hant",
                    "hr",
                    "cs",
                    "da",
                    "nl",
                    "en",
                    "en-gb",
                    "et",
                    "fi",
                    "fr",
                    "gl",
                    "de",
                    "gu",
                    "he",
                    "hi",
                    "hu",
                    "is",
                    "it",
                    "jp",
                    "kn",
                    "ko",
                    "lv",
                    "lt",
                    "ms",
                    "ml",
                    "mr",
                    "nb",
                    "pl",
                    "pt-br",
                    "pt-pt",
                    "pa",
                    "ro",
                    "ru",
                    "sr",
                    "sk",
                    "sl",
                    "es",
                    "sv",
                    "ta",
                    "te",
                    "th",
                    "tr",
                    "uk",
                    "vi",
                  ],
                },
                ui_lang: {
                  type: "string",
                  description:
                    "User interface language preferred in response. Usually formatted as '<language_code>-<country_code>' (RFC 9110).",
                  default: "en-US",
                },
                count: {
                  type: "integer",
                  description:
                    "Number of search results returned in response (max 50). The actual number delivered may be less than requested. Combine this parameter with offset to paginate search results.",
                  default: 20,
                  maximum: 50,
                  minimum: 1,
                },
                offset: {
                  type: "integer",
                  description:
                    "The zero-based offset that indicates the number of search results per page to skip before returning the result. The maximum is 9.",
                  default: 0,
                  maximum: 9,
                  minimum: 0,
                },
                spellcheck: {
                  type: "boolean",
                  description:
                    "Whether to spellcheck provided query. If the spellchecker is enabled, the modified query is always used for search.",
                  default: true,
                },
                safesearch: {
                  type: "string",
                  description: "Filters search results for adult content.",
                  default: "moderate",
                  enum: ["off", "moderate", "strict"],
                },
                freshness: {
                  type: "string",
                  description:
                    "Filters search results by when they were discovered. Supported values: 'pd' (24 hours), 'pw' (7 days), 'pm' (31 days), 'py' (365 days), or a date range 'YYYY-MM-DDtoYYYY-MM-DD'.",
                },
              },
              required: ["q"],
              visible: [
                "q",
                "count",
                "offset",
                "country",
                "search_lang",
                "ui_lang",
                "spellcheck",
                "safesearch",
                "freshness",
              ],
              additionalProperties: false,
            },
            header: {
              type: "object",
              description: "header parameters",
              properties: {
                Accept: {
                  type: "string",
                  description: "The supported media type",
                  default: "application/json",
                },
                "Accept-Encoding": {
                  type: "string",
                  description: "The supported compression type",
                  default: "gzip",
                  enum: ["gzip"],
                },
                "Api-Version": {
                  type: "string",
                  description:
                    "The Brave Web Search API version to use. Format: YYYY-MM-DD. Latest version used by default",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                },
                "Cache-Control": {
                  type: "string",
                  description:
                    "Search will return cached web search results by default. To prevent caching set the Cache-Control header to no-cache",
                  enum: ["no-cache"],
                },
                "User-Agent": {
                  type: "string",
                  description:
                    "The user agent of the client sending the request. Should follow commonly used browser agent strings",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["query", "header"],
          visible: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "BRAVE_SEARCH__NEWS_SEARCH",
        description:
          "Brave News Search API is a REST API to query Brave Search and get back search results from the web.",
        tags: ["search"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/news/search",
          server_url: "https://api.search.brave.com/res/v1",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "query parameters",
              properties: {
                q: {
                  type: "string",
                  description:
                    "The user’s search query term. Query can not be empty. Maximum of 400 characters and 50 words in the query.",
                  maxLength: 400,
                },
                country: {
                  type: "string",
                  description:
                    "The search query country (2 character country codes)",
                  default: "US",
                  enum: [
                    "ALL",
                    "AR",
                    "AU",
                    "AT",
                    "BE",
                    "BR",
                    "CA",
                    "CL",
                    "DK",
                    "FI",
                    "FR",
                    "DE",
                    "HK",
                    "IN",
                    "ID",
                    "IT",
                    "JP",
                    "KR",
                    "MY",
                    "MX",
                    "NL",
                    "NZ",
                    "NO",
                    "CN",
                    "PL",
                    "PT",
                    "PH",
                    "RU",
                    "SA",
                    "ZA",
                    "ES",
                    "SE",
                    "CH",
                    "TW",
                    "TR",
                    "GB",
                    "US",
                  ],
                },
                search_lang: {
                  type: "string",
                  description:
                    "The search language preference (2+ character language code)",
                  default: "en",
                  enum: [
                    "ar",
                    "eu",
                    "bn",
                    "bg",
                    "ca",
                    "zh-hans",
                    "zh-hant",
                    "hr",
                    "cs",
                    "da",
                    "nl",
                    "en",
                    "en-gb",
                    "et",
                    "fi",
                    "fr",
                    "gl",
                    "de",
                    "gu",
                    "he",
                    "hi",
                    "hu",
                    "is",
                    "it",
                    "jp",
                    "kn",
                    "ko",
                    "lv",
                    "lt",
                    "ms",
                    "ml",
                    "mr",
                    "nb",
                    "pl",
                    "pt-br",
                    "pt-pt",
                    "pa",
                    "ro",
                    "ru",
                    "sr",
                    "sk",
                    "sl",
                    "es",
                    "sv",
                    "ta",
                    "te",
                    "th",
                    "tr",
                    "uk",
                    "vi",
                  ],
                },
                ui_lang: {
                  type: "string",
                  description:
                    "User interface language preferred in response. Usually formatted as '<language_code>-<country_code>' (RFC 9110).",
                  default: "en-US",
                },
                count: {
                  type: "integer",
                  description:
                    "Number of search results returned in response (max 50). The actual number delivered may be less than requested. Combine this parameter with offset to paginate search results.",
                  default: 20,
                  maximum: 50,
                  minimum: 1,
                },
                offset: {
                  type: "integer",
                  description:
                    "The zero-based offset that indicates the number of search results per page to skip before returning the result. The maximum is 9.",
                  default: 0,
                  maximum: 9,
                  minimum: 0,
                },
                spellcheck: {
                  type: "boolean",
                  description:
                    "Whether to spellcheck provided query. If the spellchecker is enabled, the modified query is always used for search.",
                  default: true,
                },
                safesearch: {
                  type: "string",
                  description: "Filters search results for adult content.",
                  default: "moderate",
                  enum: ["off", "moderate", "strict"],
                },
                freshness: {
                  type: "string",
                  description:
                    "Filters search results by when they were discovered. Supported values: 'pd' (24 hours), 'pw' (7 days), 'pm' (31 days), 'py' (365 days), or a date range 'YYYY-MM-DDtoYYYY-MM-DD'.",
                },
                extra_snippets: {
                  type: "boolean",
                  description:
                    "Whether to retrieve up to 5 additional alternative excerpts (snippets) from the result pages.",
                  default: false,
                },
              },
              required: ["q"],
              visible: [
                "q",
                "count",
                "offset",
                "country",
                "search_lang",
                "ui_lang",
                "safesearch",
                "freshness",
                "spellcheck",
              ],
              additionalProperties: false,
            },
            header: {
              type: "object",
              description: "header parameters",
              properties: {
                Accept: {
                  type: "string",
                  description: "The supported media type",
                  default: "application/json",
                },
                "Accept-Encoding": {
                  type: "string",
                  description: "The supported compression type",
                  default: "gzip",
                  enum: ["gzip"],
                },
                "Api-Version": {
                  type: "string",
                  description:
                    "The Brave Web Search API version to use. Format: YYYY-MM-DD. Latest version used by default",
                  pattern: "^\\d{4}-\\d{2}-\\d{2}$",
                },
                "Cache-Control": {
                  type: "string",
                  description:
                    "Search will return cached web search results by default. To prevent caching set the Cache-Control header to no-cache",
                  enum: ["no-cache"],
                },
                "User-Agent": {
                  type: "string",
                  description:
                    "The user agent of the client sending the request. Should follow commonly used browser agent strings",
                },
              },
              required: [],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["query", "header"],
          visible: ["query"],
          additionalProperties: false,
        },
      },
    ],
  },
  {
    value: "oauth2",
    label: "OAuth2",
    appJson: {
      name: "GMAIL",
      display_name: "Gmail",
      logo: "https://raw.githubusercontent.com/aipotheosis-labs/aipolabs-icons/refs/heads/main/apps/gmail.svg",
      provider: "Google",
      version: "1.0.0",
      description:
        "The Gmail API is a RESTful API that enables sending, reading, and managing emails. This integration allows sending emails on behalf of the user.",
      security_schemes: {
        oauth2: {
          location: "header",
          name: "Authorization",
          prefix: "Bearer",
          client_id: "{{ AIPOLABS_GMAIL_CLIENT_ID }}",
          client_secret: "{{ AIPOLABS_GMAIL_CLIENT_SECRET }}",
          scope:
            "https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.insert https://www.googleapis.com/auth/gmail.modify https://mail.google.com/",
          authorize_url: "https://accounts.google.com/o/oauth2/v2/auth",
          access_token_url: "https://oauth2.googleapis.com/token",
          refresh_token_url: "https://oauth2.googleapis.com/token",
        },
      },
      default_security_credentials_by_scheme: {},
      categories: ["Communication"],
      visibility: "public",
      active: true,
    },
    functionJson: [
      {
        name: "GMAIL__SEND_EMAIL",
        description: "Sends an email on behalf of the user",
        tags: ["email"],
        visibility: "public",
        active: true,
        protocol: "connector",
        protocol_data: {},
        parameters: {
          type: "object",
          properties: {
            sender: {
              type: "string",
              description:
                "The user's email address where the email will be sent from. The special value me can be used to indicate the authenticated user.",
              default: "me",
            },
            recipient: {
              type: "string",
              description: "The email address of the recipient.",
              format: "email",
            },
            body: {
              type: "string",
              description:
                "The body content of the email, for now only plain text is supported.",
            },
            subject: {
              type: "string",
              description: "The subject of the email.",
            },
            cc: {
              type: "array",
              items: {
                type: "string",
                format: "email",
              },
              description: "The email addresses of the cc recipients.",
            },
            bcc: {
              type: "array",
              items: {
                type: "string",
                format: "email",
              },
              description: "The email addresses of the bcc recipients.",
            },
          },
          required: ["sender", "recipient", "body"],
          visible: ["sender", "recipient", "subject", "body", "cc", "bcc"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__MESSAGES_LIST",
        description: "Lists the messages in the user's mailbox",
        tags: ["email", "messages"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/users/me/messages",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "Query parameters",
              properties: {
                maxResults: {
                  type: "integer",
                  description:
                    "Maximum number of messages to return. Default is 100.",
                  maximum: 500,
                  default: 100,
                },
                pageToken: {
                  type: "string",
                  description:
                    "Page token to retrieve a specific page of results",
                  default: null,
                },
                q: {
                  type: "string",
                  description:
                    "Only return messages matching the specified query. Supports the same query format as the Gmail search box.",
                },
                labelIds: {
                  type: "array",
                  description:
                    "Only return messages with labels that match all of the specified label IDs.",
                  items: {
                    type: "string",
                  },
                },
                includeSpamTrash: {
                  type: "boolean",
                  description:
                    "Include messages from SPAM and TRASH in the results.",
                  default: false,
                },
              },
              required: [],
              visible: [
                "maxResults",
                "pageToken",
                "q",
                "labelIds",
                "includeSpamTrash",
              ],
              additionalProperties: false,
            },
          },
          required: [],
          visible: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__MESSAGES_GET",
        description: "Gets the specified message",
        tags: ["email", "messages"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/users/me/messages/{id}",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the message to retrieve",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
            query: {
              type: "object",
              description: "Query parameters",
              properties: {
                format: {
                  type: "string",
                  description: "The format to return the message in",
                  enum: ["full", "metadata", "minimal", "raw"],
                  default: "full",
                },
                metadataHeaders: {
                  type: "array",
                  description:
                    "When given and format is metadata, only include headers specified",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["format"],
              visible: ["format", "metadataHeaders"],
              additionalProperties: false,
            },
          },
          required: ["path", "query"],
          visible: ["path", "query"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__MESSAGES_TRASH",
        description: "Moves the specified message to the trash",
        tags: ["email", "messages"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "POST",
          path: "/users/me/messages/{id}/trash",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the message to trash",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__MESSAGES_UNTRASH",
        description: "Removes the specified message from the trash",
        tags: ["email", "messages"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "POST",
          path: "/users/me/messages/{id}/untrash",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the message to untrash",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__LABELS_LIST",
        description: "Lists all labels in the user's mailbox",
        tags: ["email", "labels"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/users/me/labels",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {},
          required: [],
          visible: [],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__LABELS_GET",
        description: "Gets the specified label",
        tags: ["email", "labels"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/users/me/labels/{id}",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the label to retrieve",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__LABELS_CREATE",
        description: "Creates a new label",
        tags: ["email", "labels"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "POST",
          path: "/users/me/labels",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            body: {
              type: "object",
              description: "Label data",
              properties: {
                name: {
                  type: "string",
                  description: "The display name of the label",
                },
                messageListVisibility: {
                  type: "string",
                  description:
                    "The visibility of the label in the message list in the Gmail web interface",
                  enum: ["hide", "show"],
                  default: "show",
                },
                labelListVisibility: {
                  type: "string",
                  description:
                    "The visibility of the label in the label list in the Gmail web interface",
                  enum: ["labelHide", "labelShow", "labelShowIfUnread"],
                  default: "labelShow",
                },
                color: {
                  type: "object",
                  description: "The color to assign to the label",
                  properties: {
                    textColor: {
                      type: "string",
                      description: "The text color of the label",
                    },
                    backgroundColor: {
                      type: "string",
                      description: "The background color of the label",
                    },
                  },
                  required: [],
                  visible: ["textColor", "backgroundColor"],
                  additionalProperties: false,
                },
              },
              required: ["name"],
              visible: [
                "name",
                "messageListVisibility",
                "labelListVisibility",
                "color",
              ],
              additionalProperties: false,
            },
          },
          required: ["body"],
          visible: ["body"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__LABELS_UPDATE",
        description: "Updates the specified label",
        tags: ["email", "labels"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "PUT",
          path: "/users/me/labels/{id}",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the label to update",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
            body: {
              type: "object",
              description: "Label data",
              properties: {
                name: {
                  type: "string",
                  description: "The display name of the label",
                },
                messageListVisibility: {
                  type: "string",
                  description:
                    "The visibility of the label in the message list in the Gmail web interface",
                  enum: ["hide", "show"],
                },
                labelListVisibility: {
                  type: "string",
                  description:
                    "The visibility of the label in the label list in the Gmail web interface",
                  enum: ["labelHide", "labelShow", "labelShowIfUnread"],
                },
                color: {
                  type: "object",
                  description: "The color to assign to the label",
                  properties: {
                    textColor: {
                      type: "string",
                      description: "The text color of the label",
                    },
                    backgroundColor: {
                      type: "string",
                      description: "The background color of the label",
                    },
                  },
                  required: [],
                  visible: ["textColor", "backgroundColor"],
                  additionalProperties: false,
                },
              },
              required: [],
              visible: [
                "name",
                "messageListVisibility",
                "labelListVisibility",
                "color",
              ],
              additionalProperties: false,
            },
          },
          required: ["path", "body"],
          visible: ["path", "body"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__LABELS_DELETE",
        description: "Deletes the specified label",
        tags: ["email", "labels"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "DELETE",
          path: "/users/me/labels/{id}",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the label to delete",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__MESSAGES_MODIFY",
        description: "Modifies the labels on the specified message",
        tags: ["email", "messages"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "POST",
          path: "/users/me/messages/{id}/modify",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the message to modify",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
            body: {
              type: "object",
              description: "Message modification data",
              properties: {
                addLabelIds: {
                  type: "array",
                  description: "A list of label IDs to add to the message",
                  items: {
                    type: "string",
                  },
                  default: [],
                },
                removeLabelIds: {
                  type: "array",
                  description: "A list of label IDs to remove from the message",
                  items: {
                    type: "string",
                  },
                  default: [],
                },
              },
              required: [],
              visible: ["addLabelIds", "removeLabelIds"],
              additionalProperties: false,
            },
          },
          required: ["path", "body"],
          visible: ["path", "body"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__DRAFTS_LIST",
        description: "Lists the drafts in the user's mailbox",
        tags: ["email", "drafts"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/users/me/drafts",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "Query parameters",
              properties: {
                maxResults: {
                  type: "integer",
                  description:
                    "Maximum number of drafts to return. Default is 100.",
                  default: 100,
                },
                pageToken: {
                  type: "string",
                  description:
                    "Page token to retrieve a specific page of results",
                  default: null,
                },
                q: {
                  type: "string",
                  description:
                    "Only return drafts matching the specified query. Supports the same query format as the Gmail search box.",
                },
              },
              required: [],
              visible: ["maxResults", "pageToken", "q"],
              additionalProperties: false,
            },
          },
          required: [],
          visible: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__DRAFTS_CREATE",
        description: "create an email draft on behalf of the user",
        tags: ["email"],
        visibility: "public",
        active: true,
        protocol: "connector",
        protocol_data: {},
        parameters: {
          type: "object",
          properties: {
            sender: {
              type: "string",
              description:
                "The user's email address where the email will be sent from. The special value me can be used to indicate the authenticated user.",
              default: "me",
            },
            recipient: {
              type: "string",
              description: "The email address of the recipient.",
              format: "email",
            },
            body: {
              type: "string",
              description:
                "The body content of the email, for now only plain text is supported.",
            },
            subject: {
              type: "string",
              description: "The subject of the email.",
            },
            cc: {
              type: "array",
              items: {
                type: "string",
                format: "email",
              },
              description: "The email addresses of the cc recipients.",
            },
            bcc: {
              type: "array",
              items: {
                type: "string",
                format: "email",
              },
              description: "The email addresses of the bcc recipients.",
            },
          },
          required: ["sender", "recipient", "body"],
          visible: ["sender", "recipient", "subject", "body", "cc", "bcc"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__DRAFTS_GET",
        description: "Gets the specified draft",
        tags: ["email", "drafts"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/users/me/drafts/{id}",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the draft to retrieve",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
            query: {
              type: "object",
              description: "Query parameters",
              properties: {
                format: {
                  type: "string",
                  description: "The format to return the draft message in",
                  enum: ["full", "metadata", "minimal", "raw"],
                  default: "full",
                },
              },
              required: [],
              visible: ["format"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path", "query"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__DRAFTS_UPDATE",
        description: "create an email draft on behalf of the user",
        tags: ["email"],
        visibility: "public",
        active: true,
        protocol: "connector",
        protocol_data: {},
        parameters: {
          type: "object",
          properties: {
            draft_id: {
              type: "string",
              description: "The ID of the draft to update",
            },
            sender: {
              type: "string",
              description:
                "The user's email address where the email will be sent from. The special value me can be used to indicate the authenticated user.",
              default: "me",
            },
            recipient: {
              type: "string",
              description: "The email address of the recipient.",
              format: "email",
            },
            body: {
              type: "string",
              description:
                "The body content of the email, for now only plain text is supported.",
            },
            subject: {
              type: "string",
              description: "The subject of the email.",
            },
            cc: {
              type: "array",
              items: {
                type: "string",
                format: "email",
              },
              description: "The email addresses of the cc recipients.",
            },
            bcc: {
              type: "array",
              items: {
                type: "string",
                format: "email",
              },
              description: "The email addresses of the bcc recipients.",
            },
          },
          required: ["draft_id", "sender", "recipient", "body"],
          visible: [
            "draft_id",
            "sender",
            "recipient",
            "subject",
            "body",
            "cc",
            "bcc",
          ],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__DRAFTS_DELETE",
        description: "Deletes the specified draft",
        tags: ["email", "drafts"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "DELETE",
          path: "/users/me/drafts/{id}",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the draft to delete",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__DRAFTS_SEND",
        description: "Sends the specified draft",
        tags: ["email", "drafts"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "POST",
          path: "/users/me/drafts/send",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            body: {
              type: "object",
              description: "Draft data",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the draft to send",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["body"],
          visible: ["body"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__THREADS_LIST",
        description: "Lists the threads in the user's mailbox",
        tags: ["email", "threads"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/users/me/threads",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "object",
              description: "Query parameters",
              properties: {
                maxResults: {
                  type: "integer",
                  description:
                    "Maximum number of threads to return. Default is 100.",
                  default: 100,
                },
                pageToken: {
                  type: "string",
                  description:
                    "Page token to retrieve a specific page of results",
                  default: null,
                },
                q: {
                  type: "string",
                  description:
                    "Only return threads matching the specified query. Supports the same query format as the Gmail search box.",
                },
                labelIds: {
                  type: "array",
                  description:
                    "Only return threads with labels that match all of the specified label IDs.",
                  items: {
                    type: "string",
                  },
                },
                includeSpamTrash: {
                  type: "boolean",
                  description:
                    "Include threads from SPAM and TRASH in the results.",
                  default: false,
                },
              },
              required: [],
              visible: [
                "maxResults",
                "pageToken",
                "q",
                "labelIds",
                "includeSpamTrash",
              ],
              additionalProperties: false,
            },
          },
          required: [],
          visible: ["query"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__THREADS_GET",
        description: "Gets the specified thread",
        tags: ["email", "threads"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "GET",
          path: "/users/me/threads/{id}",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the thread to retrieve",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
            query: {
              type: "object",
              description: "Query parameters",
              properties: {
                format: {
                  type: "string",
                  description: "The format to return the messages in",
                  enum: ["full", "metadata", "minimal"],
                  default: "metadata",
                },
              },
              required: ["format"],
              visible: [],
              additionalProperties: false,
            },
          },
          required: ["path", "query"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__THREADS_MODIFY",
        description: "Modifies the labels applied to the thread",
        tags: ["email", "threads"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "POST",
          path: "/users/me/threads/{id}/modify",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the thread to modify",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
            body: {
              type: "object",
              description: "Request body",
              properties: {
                addLabelIds: {
                  type: "array",
                  description: "A list of IDs of labels to add to this thread",
                  items: {
                    type: "string",
                  },
                },
                removeLabelIds: {
                  type: "array",
                  description:
                    "A list of IDs of labels to remove from this thread",
                  items: {
                    type: "string",
                  },
                },
              },
              required: [],
              visible: ["addLabelIds", "removeLabelIds"],
              additionalProperties: false,
            },
          },
          required: ["path", "body"],
          visible: ["path", "body"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__THREADS_TRASH",
        description: "Moves the specified thread to the trash",
        tags: ["email", "threads"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "POST",
          path: "/users/me/threads/{id}/trash",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the thread to trash",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__THREADS_UNTRASH",
        description: "Removes the specified thread from the trash",
        tags: ["email", "threads"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "POST",
          path: "/users/me/threads/{id}/untrash",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the thread to untrash",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
      {
        name: "GMAIL__THREADS_DELETE",
        description: "Immediately and permanently deletes the specified thread",
        tags: ["email", "threads"],
        visibility: "public",
        active: true,
        protocol: "rest",
        protocol_data: {
          method: "DELETE",
          path: "/users/me/threads/{id}",
          server_url: "https://gmail.googleapis.com/gmail/v1",
        },
        parameters: {
          type: "object",
          properties: {
            path: {
              type: "object",
              description: "Path parameters",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the thread to delete",
                },
              },
              required: ["id"],
              visible: ["id"],
              additionalProperties: false,
            },
          },
          required: ["path"],
          visible: ["path"],
          additionalProperties: false,
        },
      },
    ],
    secrets: {
      AIPOLABS_GMAIL_CLIENT_ID: "123",
      AIPOLABS_GMAIL_CLIENT_SECRET: "123",
    },
  },
];
